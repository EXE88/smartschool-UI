#!/usr/bin/env bash
#
# SmartSchool UI — Smart Installer & Manager
# ------------------------------------------
# Interactive, transactional installer for the SmartSchool UI frontend.
#
#   sudo bash install.sh
#
# Features:
#   * Colored interactive menu (install wizard + management menu)
#   * Configures runtime env values (backend API URL, domain, port, ...)
#   * Three deploy modes: simple (standalone server), nginx, nginx + TLS
#   * Every decision is changeable later from the management menu
#   * Transactional: on error or Ctrl+C, all changes are rolled back
#     so the script can safely be run again
#
set -Eeuo pipefail

# ============================================================================
# Constants & paths
# ============================================================================
SCRIPT_VERSION="2.0.0"
APP_NAME="smartschool-ui"
APP_TITLE="SmartSchool UI"
APP_DIR="/var/www/${APP_NAME}"
CONF_DIR="/etc/${APP_NAME}"
ENV_FILE="${CONF_DIR}/install.env"
SERVICE_NAME="${APP_NAME}.service"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}"
NGINX_AVAILABLE="/etc/nginx/sites-available/${APP_NAME}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${APP_NAME}"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"

# ---- runtime configuration (persisted in ENV_FILE) ----
DEPLOY_MODE="simple"        # simple | nginx | tls
API_BASE_URL="http://127.0.0.1:8000"
DASHBOARD_LIMIT="0"
DOMAIN=""
SIMPLE_PORT="3000"
TLS_EMAIL=""
INSTALLED="no"

# ============================================================================
# Colors & UI helpers
# ============================================================================
if [[ -t 1 ]]; then
  C_RESET=$'\e[0m';  C_BOLD=$'\e[1m';   C_DIM=$'\e[2m'
  C_RED=$'\e[31m';   C_GREEN=$'\e[32m'; C_YELLOW=$'\e[33m'
  C_BLUE=$'\e[34m';  C_MAGENTA=$'\e[35m'; C_CYAN=$'\e[36m'; C_WHITE=$'\e[97m'
else
  C_RESET=""; C_BOLD=""; C_DIM=""; C_RED=""; C_GREEN=""; C_YELLOW=""
  C_BLUE=""; C_MAGENTA=""; C_CYAN=""; C_WHITE=""
fi

info()    { printf "%s➜%s %s\n"  "${C_CYAN}"   "${C_RESET}" "$*"; }
ok()      { printf "%s✔%s %s\n"  "${C_GREEN}"  "${C_RESET}" "$*"; }
warn()    { printf "%s⚠%s %s\n"  "${C_YELLOW}" "${C_RESET}" "$*"; }
err()     { printf "%s✘ %s%s\n"  "${C_RED}" "$*" "${C_RESET}" >&2; }
step()    { printf "\n%s%s── %s ──%s\n" "${C_BOLD}" "${C_MAGENTA}" "$*" "${C_RESET}"; }

hr() { printf "%s%s%s\n" "${C_DIM}" "────────────────────────────────────────────────────────────" "${C_RESET}"; }

banner() {
  clear 2>/dev/null || true
  printf "%s%s" "${C_BOLD}" "${C_CYAN}"
  cat <<'EOF'
   _____                      _   _____      _                 _
  / ____|                    | | / ____|    | |               | |
 | (___  _ __ ___   __ _ _ __| || (___   ___| |__   ___   ___ | |
  \___ \| '_ ` _ \ / _` | '__| __\___ \ / __| '_ \ / _ \ / _ \| |
  ____) | | | | | | (_| | |  | |_ ___) | (__| | | | (_) | (_) | |
 |_____/|_| |_| |_|\__,_|_|   \__|____/ \___|_| |_|\___/ \___/|_|
EOF
  printf "%s" "${C_RESET}"
  printf "  %s%s UI — Smart Installer & Manager %sv%s%s\n" \
    "${C_BOLD}" "${APP_TITLE%% *}" "${C_DIM}" "${SCRIPT_VERSION}" "${C_RESET}"
  hr
}

# ask <prompt> <default> -> REPLY_VALUE
ask() {
  local prompt="$1" default="${2:-}" answer
  if [[ -n "$default" ]]; then
    printf "%s?%s %s %s[%s]%s: " "${C_GREEN}" "${C_RESET}" "$prompt" "${C_DIM}" "$default" "${C_RESET}" > /dev/tty
  else
    printf "%s?%s %s: " "${C_GREEN}" "${C_RESET}" "$prompt" > /dev/tty
  fi
  IFS= read -r answer < /dev/tty || answer=""
  REPLY_VALUE="${answer:-$default}"
}

# ask_required <prompt> [default]
ask_required() {
  while true; do
    ask "$1" "${2:-}"
    [[ -n "$REPLY_VALUE" ]] && return 0
    warn "A value is required."
  done
}

confirm() { # confirm <prompt> [y|n default]
  local d="${2:-y}" hint answer
  [[ "$d" == "y" ]] && hint="Y/n" || hint="y/N"
  printf "%s?%s %s %s[%s]%s: " "${C_GREEN}" "${C_RESET}" "$1" "${C_DIM}" "$hint" "${C_RESET}" > /dev/tty
  IFS= read -r answer < /dev/tty || answer=""
  answer="${answer:-$d}"
  [[ "$answer" =~ ^[Yy] ]]
}

pause() {
  printf "\n%sPress Enter to continue...%s" "${C_DIM}" "${C_RESET}" > /dev/tty
  IFS= read -r _ < /dev/tty || true
}

mode_label() {
  case "$1" in
    simple) printf "Simple (standalone server on port %s)" "${SIMPLE_PORT}" ;;
    nginx)  printf "Nginx (HTTP, domain: %s)" "${DOMAIN:-_}" ;;
    tls)    printf "Nginx + TLS (HTTPS, domain: %s)" "${DOMAIN:-_}" ;;
    *)      printf "unknown" ;;
  esac
}

# ============================================================================
# Transaction engine (rollback on error / Ctrl+C)
# ============================================================================
TX_ACTIVE=0
TX_BACKUP=""
TX_LABEL=""
declare -a TX_UNDO=()

tx_begin() {
  TX_LABEL="$1"
  TX_BACKUP="$(mktemp -d "/tmp/${APP_NAME}-tx.XXXXXX")"
  TX_UNDO=()
  TX_ACTIVE=1
}

# Register a shell command that undoes the change being made next.
tx_undo() { TX_UNDO+=("$*"); }

# Snapshot a file/dir so it is restored (or removed, if it didn't exist) on rollback.
tx_protect() {
  local path="$1" slot
  slot="${TX_BACKUP}/$(printf '%03d' "${#TX_UNDO[@]}")"
  if [[ -e "$path" || -L "$path" ]]; then
    mkdir -p "$slot"
    cp -a "$path" "$slot/item"
    tx_undo "rm -rf '$path'; cp -a '$slot/item' '$path'"
  else
    tx_undo "rm -rf '$path'"
  fi
}

tx_commit() {
  TX_ACTIVE=0
  TX_UNDO=()
  [[ -n "$TX_BACKUP" ]] && rm -rf "$TX_BACKUP"
  TX_BACKUP=""
}

tx_rollback() {
  local i
  err "Rolling back: ${TX_LABEL}"
  set +e
  for (( i=${#TX_UNDO[@]}-1; i>=0; i-- )); do
    eval "${TX_UNDO[$i]}" >/dev/null 2>&1
  done
  set -e
  TX_ACTIVE=0
  TX_UNDO=()
  [[ -n "$TX_BACKUP" ]] && rm -rf "$TX_BACKUP"
  TX_BACKUP=""
  warn "All changes were reverted. You can safely run the script again."
}

on_error() {
  local rc=$?
  err "An unexpected error occurred (exit code ${rc}, line ${BASH_LINENO[0]})."
  if (( TX_ACTIVE )); then tx_rollback; fi
  exit "$rc"
}

on_interrupt() {
  echo
  err "Interrupted by user (Ctrl+C)."
  if (( TX_ACTIVE )); then tx_rollback; fi
  exit 130
}

trap on_error ERR
trap on_interrupt INT TERM

# ============================================================================
# Env persistence
# ============================================================================
load_env() { [[ -f "$ENV_FILE" ]] && . "$ENV_FILE"; }

save_env() {
  mkdir -p "$CONF_DIR"
  cat > "$ENV_FILE" <<EOF
# Generated by install.sh — do not edit by hand, use: sudo bash install.sh
INSTALLED="${INSTALLED}"
DEPLOY_MODE="${DEPLOY_MODE}"
API_BASE_URL="${API_BASE_URL}"
DASHBOARD_LIMIT="${DASHBOARD_LIMIT}"
DOMAIN="${DOMAIN}"
SIMPLE_PORT="${SIMPLE_PORT}"
TLS_EMAIL="${TLS_EMAIL}"
EOF
}

# ============================================================================
# System helpers
# ============================================================================
require_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    err "This script must run as root. Use: sudo bash install.sh"
    exit 1
  fi
}

require_debian() {
  if ! command -v apt-get >/dev/null 2>&1; then
    err "Only Debian/Ubuntu (apt) systems are supported."
    exit 1
  fi
}

pkg_install() { # pkg_install <pkg>...
  local missing=()
  local p
  for p in "$@"; do
    dpkg -s "$p" >/dev/null 2>&1 || missing+=("$p")
  done
  if (( ${#missing[@]} )); then
    info "Installing packages: ${missing[*]}"
    DEBIAN_FRONTEND=noninteractive apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${missing[@]}"
    ok "Packages installed."
  fi
}

nginx_reload() {
  info "Testing nginx configuration..."
  nginx -t
  systemctl reload nginx 2>/dev/null || systemctl restart nginx
  ok "Nginx reloaded."
}

# ============================================================================
# Build blocks (each is transaction-aware)
# ============================================================================
deploy_files() {
  step "Deploying application files"
  pkg_install rsync
  tx_protect "$APP_DIR"
  mkdir -p "$APP_DIR"
  rsync -a --delete \
    --exclude ".git" --exclude "node_modules" \
    --exclude "install.sh" --exclude "*.log" \
    "${SRC_DIR}/" "${APP_DIR}/"
  ok "Files deployed to ${APP_DIR}"
}

write_config_js() {
  step "Writing runtime configuration (js/config.js)"
  tx_protect "${APP_DIR}/js/config.js"
  cat > "${APP_DIR}/js/config.js" <<EOF
window.SMARTSCHOOL_CONFIG = {
  apiBaseUrl: "${API_BASE_URL}",
  dashboardLimit: ${DASHBOARD_LIMIT}
};
EOF
  ok "Backend API set to ${API_BASE_URL}"
}

# ---- simple mode (systemd + python http.server) ----
setup_simple() {
  step "Setting up standalone server (systemd)"
  pkg_install python3
  tx_protect "$SERVICE_FILE"
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=${APP_TITLE} static frontend (standalone)
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 -m http.server ${SIMPLE_PORT} --directory ${APP_DIR}
Restart=on-failure
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  tx_undo "systemctl disable --now '${SERVICE_NAME}' >/dev/null 2>&1; systemctl daemon-reload"
  systemctl enable --now "$SERVICE_NAME"
  ok "Service '${SERVICE_NAME}' is running on port ${SIMPLE_PORT}"
}

teardown_simple() {
  if [[ -f "$SERVICE_FILE" ]]; then
    info "Stopping standalone server..."
    systemctl disable --now "$SERVICE_NAME" >/dev/null 2>&1 || true
    tx_protect "$SERVICE_FILE"
    rm -f "$SERVICE_FILE"
    systemctl daemon-reload
    ok "Standalone server removed."
  fi
}

# ---- nginx mode ----
setup_nginx() {
  step "Setting up Nginx"
  pkg_install nginx
  tx_protect "$NGINX_AVAILABLE"
  tx_protect "$NGINX_ENABLED"
  cat > "$NGINX_AVAILABLE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN:-_};

    root ${APP_DIR};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|webp|woff|woff2|ttf|eot|map)\$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000";
        try_files \$uri =404;
    }
}
EOF
  ln -sfn "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  if [[ -L /etc/nginx/sites-enabled/default ]]; then
    tx_protect /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-enabled/default
  fi
  systemctl enable --now nginx >/dev/null 2>&1 || true
  nginx_reload
  ok "Nginx site enabled for '${DOMAIN:-_}'"
}

teardown_nginx() {
  if [[ -e "$NGINX_ENABLED" || -e "$NGINX_AVAILABLE" ]]; then
    info "Removing Nginx site..."
    tx_protect "$NGINX_ENABLED"
    tx_protect "$NGINX_AVAILABLE"
    rm -f "$NGINX_ENABLED" "$NGINX_AVAILABLE"
    if command -v nginx >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
      nginx_reload
    fi
    ok "Nginx site removed (nginx itself was kept)."
  fi
}

# ---- TLS (certbot) ----
setup_tls() {
  step "Enabling HTTPS with Let's Encrypt"
  if [[ -z "$DOMAIN" || "$DOMAIN" == "_" ]]; then
    err "A real domain is required for TLS."
    return 1
  fi
  pkg_install certbot python3-certbot-nginx
  tx_protect "$NGINX_AVAILABLE"
  tx_undo "certbot delete --cert-name '${DOMAIN}' --non-interactive >/dev/null 2>&1; true"
  certbot --nginx --non-interactive --agree-tos --redirect \
    -m "$TLS_EMAIL" -d "$DOMAIN"
  nginx_reload
  ok "HTTPS enabled for https://${DOMAIN}"
}

teardown_tls() {
  if command -v certbot >/dev/null 2>&1 && certbot certificates 2>/dev/null | grep -q "Certificate Name: ${DOMAIN}$"; then
    if confirm "Delete the TLS certificate for ${DOMAIN}?" "n"; then
      certbot delete --cert-name "$DOMAIN" --non-interactive || true
      ok "Certificate deleted."
    else
      info "Certificate kept on disk."
    fi
  fi
}

# ---- mode orchestration: knows what to stop/start when switching ----
apply_mode() { # apply_mode <new_mode>
  local new="$1"
  # tear down whatever the new mode does not need
  case "$new" in
    simple)      teardown_nginx ;;
    nginx|tls)   teardown_simple ;;
  esac
  case "$new" in
    simple) setup_simple ;;
    nginx)  setup_nginx ;;
    tls)    setup_nginx; setup_tls ;;
  esac
  DEPLOY_MODE="$new"
}

# ============================================================================
# Wizards & menu actions
# ============================================================================
prompt_mode() { # sets REPLY_VALUE to simple|nginx|tls
  echo
  printf "  %s1)%s Simple   %s— standalone server, no nginx (best for testing)%s\n" "${C_BOLD}" "${C_RESET}" "${C_DIM}" "${C_RESET}"
  printf "  %s2)%s Nginx    %s— production HTTP behind nginx%s\n"                    "${C_BOLD}" "${C_RESET}" "${C_DIM}" "${C_RESET}"
  printf "  %s3)%s TLS      %s— nginx + free HTTPS certificate (needs a domain)%s\n" "${C_BOLD}" "${C_RESET}" "${C_DIM}" "${C_RESET}"
  while true; do
    ask "Select deploy mode" "1"
    case "$REPLY_VALUE" in
      1) REPLY_VALUE="simple"; return ;;
      2) REPLY_VALUE="nginx";  return ;;
      3) REPLY_VALUE="tls";    return ;;
      *) warn "Enter 1, 2 or 3." ;;
    esac
  done
}

prompt_mode_details() { # asks the questions the chosen mode needs
  local mode="$1"
  case "$mode" in
    simple)
      ask "Port for the standalone server" "$SIMPLE_PORT";  SIMPLE_PORT="$REPLY_VALUE" ;;
    nginx)
      ask "Domain / server_name (empty = catch-all)" "${DOMAIN:-}"; DOMAIN="$REPLY_VALUE" ;;
    tls)
      ask_required "Domain (must point to this server)" "${DOMAIN:-}"; DOMAIN="$REPLY_VALUE"
      ask_required "Email for Let's Encrypt" "${TLS_EMAIL:-}";         TLS_EMAIL="$REPLY_VALUE" ;;
  esac
}

wizard_install() {
  banner
  step "Installation wizard"
  info "Answer a few questions — everything can be changed later from the menu."

  ask "Backend API base URL" "$API_BASE_URL";  API_BASE_URL="$REPLY_VALUE"
  ask "Dashboard item limit (0 = unlimited)" "$DASHBOARD_LIMIT"; DASHBOARD_LIMIT="$REPLY_VALUE"
  prompt_mode; local mode="$REPLY_VALUE"
  prompt_mode_details "$mode"

  echo; hr
  printf "  %sSummary%s\n" "${C_BOLD}" "${C_RESET}"
  printf "  API URL      : %s%s%s\n" "${C_CYAN}" "$API_BASE_URL" "${C_RESET}"
  printf "  Deploy mode  : %s%s%s\n" "${C_CYAN}" "$(DEPLOY_MODE=$mode mode_label "$mode")" "${C_RESET}"
  printf "  App dir      : %s%s%s\n" "${C_CYAN}" "$APP_DIR" "${C_RESET}"
  hr
  confirm "Proceed with installation?" "y" || { warn "Cancelled."; return; }

  tx_begin "installation"
  deploy_files
  write_config_js
  apply_mode "$mode"
  INSTALLED="yes"
  tx_protect "$ENV_FILE"
  save_env
  tx_commit

  echo
  ok "${C_BOLD}Installation complete!${C_RESET}"
  case "$DEPLOY_MODE" in
    simple) info "Open:  http://<server-ip>:${SIMPLE_PORT}" ;;
    nginx)  info "Open:  http://${DOMAIN:-<server-ip>}" ;;
    tls)    info "Open:  https://${DOMAIN}" ;;
  esac
  info "Run this script again anytime to manage or reconfigure."
  pause
}

action_change_api() {
  ask "New backend API base URL" "$API_BASE_URL"; API_BASE_URL="$REPLY_VALUE"
  ask "Dashboard item limit (0 = unlimited)" "$DASHBOARD_LIMIT"; DASHBOARD_LIMIT="$REPLY_VALUE"
  tx_begin "API reconfiguration"
  write_config_js
  tx_protect "$ENV_FILE"; save_env
  tx_commit
  ok "API configuration updated (no restart needed — clients pick it up on reload)."
  pause
}

action_change_mode() {
  info "Current mode: $(mode_label "$DEPLOY_MODE")"
  prompt_mode; local new="$REPLY_VALUE"
  prompt_mode_details "$new"
  tx_begin "deploy mode change"
  if [[ "$new" != "tls" && "$DEPLOY_MODE" == "tls" ]]; then teardown_tls; fi
  apply_mode "$new"
  tx_protect "$ENV_FILE"; save_env
  tx_commit
  ok "Deploy mode is now: $(mode_label "$DEPLOY_MODE")"
  pause
}

action_change_domain() {
  if [[ "$DEPLOY_MODE" == "simple" ]]; then
    warn "Domain only applies to nginx/TLS modes. Change the deploy mode first."
    pause; return
  fi
  ask_required "New domain" "${DOMAIN:-}"; DOMAIN="$REPLY_VALUE"
  tx_begin "domain change"
  setup_nginx
  if [[ "$DEPLOY_MODE" == "tls" ]]; then
    [[ -n "$TLS_EMAIL" ]] || { ask_required "Email for Let's Encrypt"; TLS_EMAIL="$REPLY_VALUE"; }
    setup_tls
  fi
  tx_protect "$ENV_FILE"; save_env
  tx_commit
  ok "Domain updated to ${DOMAIN}"
  pause
}

action_redeploy() {
  tx_begin "redeploy"
  deploy_files
  write_config_js
  case "$DEPLOY_MODE" in
    simple) systemctl restart "$SERVICE_NAME"; ok "Service restarted." ;;
    nginx|tls) info "Static files replaced — nginx needs no restart." ;;
  esac
  tx_commit
  ok "Redeployed latest files from ${SRC_DIR}"
  pause
}

action_status() {
  step "Status"
  printf "  Deploy mode : %s\n" "$(mode_label "$DEPLOY_MODE")"
  printf "  API URL     : %s\n" "$API_BASE_URL"
  printf "  App dir     : %s\n" "$APP_DIR"
  echo
  case "$DEPLOY_MODE" in
    simple)
      systemctl --no-pager status "$SERVICE_NAME" 2>/dev/null | head -8 || warn "Service not found." ;;
    nginx|tls)
      systemctl --no-pager status nginx 2>/dev/null | head -8 || warn "Nginx not found."
      [[ "$DEPLOY_MODE" == "tls" ]] && { echo; certbot certificates 2>/dev/null | sed -n "/${DOMAIN}/,/^$/p" || true; } ;;
  esac
  pause
}

action_logs() {
  step "Recent logs (Ctrl+C to stop following)"
  set +e
  trap - INT
  case "$DEPLOY_MODE" in
    simple)     journalctl -u "$SERVICE_NAME" -n 40 -f ;;
    nginx|tls)  tail -n 40 -f /var/log/nginx/access.log /var/log/nginx/error.log ;;
  esac
  trap on_interrupt INT
  set -e
}

action_uninstall() {
  warn "This will remove the deployed app, its service/nginx site and saved settings."
  confirm "Are you sure you want to uninstall?" "n" || { info "Aborted."; pause; return; }
  tx_begin "uninstall"
  teardown_simple
  [[ "$DEPLOY_MODE" == "tls" ]] && teardown_tls
  teardown_nginx
  tx_protect "$APP_DIR";  rm -rf "$APP_DIR"
  tx_protect "$CONF_DIR"; rm -rf "$CONF_DIR"
  tx_commit
  INSTALLED="no"
  ok "SmartSchool UI was uninstalled. Run the script again to reinstall."
  pause
}

# ============================================================================
# Menus
# ============================================================================
menu_item() { printf "  %s%2s)%s %-28s %s%s%s\n" "${C_BOLD}${C_YELLOW}" "$1" "${C_RESET}" "$2" "${C_DIM}" "${3:-}" "${C_RESET}"; }

main_menu() {
  while true; do
    load_env
    banner
    if [[ "$INSTALLED" == "yes" ]]; then
      printf "  Status: %sinstalled%s  •  Mode: %s%s%s\n\n" \
        "${C_GREEN}${C_BOLD}" "${C_RESET}" "${C_CYAN}" "$(mode_label "$DEPLOY_MODE")" "${C_RESET}"
      menu_item 1 "Change backend API URL"   "edit js/config.js values"
      menu_item 2 "Change deploy mode"       "simple / nginx / nginx+TLS"
      menu_item 3 "Change domain"            "updates nginx & TLS cert"
      menu_item 4 "Redeploy files"           "sync latest source, restart as needed"
      menu_item 5 "Status"                   "services & certificate"
      menu_item 6 "Logs"                     "follow live logs"
      menu_item 7 "Uninstall"                "remove everything (rollback-safe)"
      menu_item 0 "Exit"
      echo
      ask "Choose an option" "0"
      case "$REPLY_VALUE" in
        1) action_change_api ;;
        2) action_change_mode ;;
        3) action_change_domain ;;
        4) action_redeploy ;;
        5) action_status ;;
        6) action_logs ;;
        7) action_uninstall ;;
        0) ok "Goodbye!"; exit 0 ;;
        *) warn "Invalid option."; pause ;;
      esac
    else
      printf "  Status: %snot installed%s\n\n" "${C_YELLOW}${C_BOLD}" "${C_RESET}"
      menu_item 1 "Install SmartSchool UI"   "guided wizard with rollback"
      menu_item 0 "Exit"
      echo
      ask "Choose an option" "1"
      case "$REPLY_VALUE" in
        1) wizard_install ;;
        0) ok "Goodbye!"; exit 0 ;;
        *) warn "Invalid option."; pause ;;
      esac
    fi
  done
}

# ============================================================================
# Entry point
# ============================================================================
require_root
require_debian
main_menu
