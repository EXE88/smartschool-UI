#!/usr/bin/env bash

set -Eeuo pipefail

APP_NAME="smartschool-ui"
DEFAULT_APP_DIR="/var/www/${APP_NAME}"
DEFAULT_NGINX_SITE="${APP_NAME}"
DEFAULT_BACKEND_URL="https://api.example.com"
DEFAULT_DASHBOARD_LIMIT="0"
DEFAULT_NO_PROXY="localhost,127.0.0.1,::1"

APP_DIR="${APP_DIR:-$DEFAULT_APP_DIR}"
PROXY_URL="${SMARTSCHOOL_PROXY_URL:-}"
NO_PROXY_VALUE="${NO_PROXY:-$DEFAULT_NO_PROXY}"
RELEASES_DIR="$APP_DIR/releases"
CURRENT_LINK="$APP_DIR/current"
SHARED_DIR="$APP_DIR/shared"
BACKUPS_DIR="$APP_DIR/backups"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
BOLD="\033[1m"
DIM="\033[2m"
RESET="\033[0m"

info() { printf "${BLUE}[INFO]${RESET} %s\n" "$*"; }
ok() { printf "${GREEN}[OK]${RESET} %s\n" "$*"; }
warn() { printf "${YELLOW}[WARN]${RESET} %s\n" "$*"; }
fail() { printf "${RED}[ERROR]${RESET} %s\n" "$*" >&2; }

pause() {
  printf "\n${DIM}Press Enter to continue...${RESET}"
  read -r _
}

require_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    fail "This action must be run as root. Use: sudo bash scripts/production-manager.sh"
    exit 1
  fi
}

script_dir() {
  cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1
  pwd -P
}

project_root() {
  local dir
  dir="$(script_dir)"
  cd "$dir/.." >/dev/null 2>&1
  pwd -P
}

is_debian_like() {
  command -v apt-get >/dev/null 2>&1
}

prompt() {
  local label="$1"
  local default_value="${2:-}"
  local value

  if [[ -n "$default_value" ]]; then
    printf "${CYAN}%s${RESET} ${DIM}[%s]${RESET}: " "$label" "$default_value" >&2
  else
    printf "${CYAN}%s${RESET}: " "$label" >&2
  fi

  read -r value
  printf "%s" "${value:-$default_value}"
}

validate_domain() {
  local domain="$1"
  [[ "$domain" =~ ^[A-Za-z0-9.-]+$ ]] && [[ "$domain" == *.* ]]
}

validate_url() {
  local url="$1"
  [[ "$url" =~ ^https?://[^[:space:]\"\']+$ ]]
}

validate_proxy_url() {
  local url="$1"
  [[ "$url" =~ ^https?://[^[:space:]\"\']+$ ]]
}

validate_integer() {
  local value="$1"
  [[ "$value" =~ ^[0-9]+$ ]]
}

confirm() {
  local label="$1"
  local default="${2:-n}"
  local answer

  if [[ "$default" == "y" ]]; then
    printf "${YELLOW}%s${RESET} [Y/n]: " "$label"
  else
    printf "${YELLOW}%s${RESET} [y/N]: " "$label"
  fi

  read -r answer
  answer="${answer:-$default}"
  [[ "$answer" =~ ^[Yy]$ ]]
}

apply_proxy() {
  if [[ -z "$PROXY_URL" ]]; then
    return 0
  fi

  export http_proxy="$PROXY_URL"
  export https_proxy="$PROXY_URL"
  export HTTP_PROXY="$PROXY_URL"
  export HTTPS_PROXY="$PROXY_URL"
  export no_proxy="$NO_PROXY_VALUE"
  export NO_PROXY="$NO_PROXY_VALUE"
  export npm_config_proxy="$PROXY_URL"
  export npm_config_https_proxy="$PROXY_URL"

  info "Proxy is enabled for this script session: $PROXY_URL"
}

clear_proxy() {
  PROXY_URL=""
  unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY no_proxy NO_PROXY npm_config_proxy npm_config_https_proxy
  ok "Proxy disabled for this script session."
}

set_proxy_from_prompts() {
  local proxy_url
  local no_proxy_value

  proxy_url="$(prompt "Proxy URL" "${PROXY_URL:-http://127.0.0.1:8080}")"
  if ! validate_proxy_url "$proxy_url"; then
    fail "Invalid proxy URL. Example: http://127.0.0.1:8080"
    pause
    return 1
  fi

  no_proxy_value="$(prompt "No-proxy hosts" "$NO_PROXY_VALUE")"
  PROXY_URL="$proxy_url"
  NO_PROXY_VALUE="$no_proxy_value"
  apply_proxy
  ok "Proxy configured for apt, npm, curl, and certbot commands in this session."
}

configure_proxy() {
  print_header

  printf "${BOLD}Current proxy:${RESET} "
  if [[ -n "$PROXY_URL" ]]; then
    printf "%s\n" "$PROXY_URL"
  else
    printf "disabled\n"
  fi

  printf "\n"
  if ! confirm "Use proxy for downloads and network commands?" "n"; then
    clear_proxy
    pause
    return 0
  fi

  set_proxy_from_prompts
  pause
}

print_header() {
  clear || true
  printf "${CYAN}${BOLD}"
  printf "============================================================\n"
  printf "             SmartSchool UI Production Manager             \n"
  printf "============================================================\n"
  printf "${RESET}"
  printf "${DIM}App dir:${RESET} %s\n" "$APP_DIR"
  printf "${DIM}Current:${RESET} %s\n\n" "$CURRENT_LINK"
  if [[ -n "$PROXY_URL" ]]; then
    printf "${DIM}Proxy:${RESET} %s\n\n" "$PROXY_URL"
  fi
}

install_system_packages() {
  require_root

  if ! is_debian_like; then
    fail "This installer currently supports Debian/Ubuntu servers with apt-get."
    return 1
  fi

  apply_proxy
  info "Installing system packages..."
  apt-get update
  apt-get install -y nginx certbot python3-certbot-nginx curl ca-certificates rsync npm
  systemctl enable nginx
  ok "System packages are installed."
}

write_runtime_config() {
  local target_dir="$1"
  local backend_url="$2"
  local dashboard_limit="$3"

  mkdir -p "$target_dir/js"
  cat > "$target_dir/js/config.js" <<EOF_CONFIG
window.SMARTSCHOOL_CONFIG = {
  apiBaseUrl: "$backend_url",
  dashboardLimit: $dashboard_limit
};
EOF_CONFIG
}

copy_project_files() {
  local release_dir="$1"
  local root
  root="$(project_root)"

  mkdir -p "$release_dir"
  rsync -a --delete \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude "dist" \
    --exclude ".DS_Store" \
    "$root/" "$release_dir/"
}

install_frontend_dependencies() {
  local release_dir="$1"

  info "Installing frontend dependencies in release..."
  if [[ -f "$release_dir/package-lock.json" ]]; then
    (cd "$release_dir" && npm ci --omit=dev)
  else
    (cd "$release_dir" && npm install --omit=dev)
  fi
}

create_release() {
  local backend_url="$1"
  local dashboard_limit="$2"
  local release_name
  local release_dir

  release_name="$(date +%Y%m%d%H%M%S)"
  release_dir="$RELEASES_DIR/$release_name"

  mkdir -p "$RELEASES_DIR" "$SHARED_DIR" "$BACKUPS_DIR"
  copy_project_files "$release_dir"
  install_frontend_dependencies "$release_dir"
  write_runtime_config "$release_dir" "$backend_url" "$dashboard_limit"

  ln -sfn "$release_dir" "$CURRENT_LINK"
  chown -R www-data:www-data "$APP_DIR"

  ok "Release deployed: $release_name"
}

write_nginx_site() {
  local domain="$1"
  local site_name="${2:-$DEFAULT_NGINX_SITE}"
  local site_path="$NGINX_AVAILABLE/$site_name"

  if [[ -f "$site_path" ]]; then
    local backup_path="$BACKUPS_DIR/nginx-${site_name}-$(date +%Y%m%d%H%M%S).conf"
    cp "$site_path" "$backup_path"
    info "Existing Nginx config backed up to: $backup_path"
  fi

  cat > "$site_path" <<EOF_NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $domain;

    root $CURRENT_LINK;
    index index.html;

    access_log /var/log/nginx/${APP_NAME}.access.log;
    error_log /var/log/nginx/${APP_NAME}.error.log;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|webp|woff|woff2|ttf)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public";
        try_files \$uri =404;
    }
}
EOF_NGINX

  ln -sfn "$site_path" "$NGINX_ENABLED/$site_name"
  nginx -t
  systemctl reload nginx

  ok "Nginx site is active for: $domain"
}

issue_ssl_certificate() {
  local domain="$1"
  local email="$2"

  if [[ -z "$email" ]]; then
    certbot --nginx -d "$domain" --redirect --agree-tos --register-unsafely-without-email --non-interactive
  else
    certbot --nginx -d "$domain" --redirect --agree-tos -m "$email" --non-interactive
  fi

  systemctl reload nginx
  ok "SSL is active for: https://$domain"
}

install_or_update() {
  require_root
  print_header

  local domain
  local backend_url
  local dashboard_limit
  local email

  if confirm "Use proxy for installation downloads?" "n"; then
    set_proxy_from_prompts
    print_header
  fi

  domain="$(prompt "Frontend domain" "")"
  if [[ -z "$domain" ]]; then
    fail "Domain is required."
    pause
    return 1
  fi
  if ! validate_domain "$domain"; then
    fail "Invalid domain. Example: school.example.com"
    pause
    return 1
  fi

  backend_url="$(prompt "Backend API base URL" "$DEFAULT_BACKEND_URL")"
  if ! validate_url "$backend_url"; then
    fail "Invalid backend URL. Example: https://api.example.com"
    pause
    return 1
  fi

  dashboard_limit="$(prompt "Dashboard limit" "$DEFAULT_DASHBOARD_LIMIT")"
  if ! validate_integer "$dashboard_limit"; then
    fail "Dashboard limit must be a number."
    pause
    return 1
  fi

  email="$(prompt "Email for Let's Encrypt notices" "")"

  install_system_packages
  create_release "$backend_url" "$dashboard_limit"
  write_nginx_site "$domain"

  if confirm "Enable HTTPS with Certbot now?" "y"; then
    issue_ssl_certificate "$domain" "$email"
  else
    warn "HTTPS was skipped. The site is currently served over HTTP."
  fi

  ok "Production setup completed."
  printf "${GREEN}${BOLD}URL:${RESET} https://%s\n" "$domain"
  pause
}

deploy_new_release() {
  require_root
  print_header

  local backend_url
  local dashboard_limit

  if confirm "Use proxy for npm install in this deployment?" "n"; then
    set_proxy_from_prompts
    print_header
  fi

  backend_url="$(prompt "Backend API base URL" "$DEFAULT_BACKEND_URL")"
  if ! validate_url "$backend_url"; then
    fail "Invalid backend URL. Example: https://api.example.com"
    pause
    return 1
  fi

  dashboard_limit="$(prompt "Dashboard limit" "$DEFAULT_DASHBOARD_LIMIT")"
  if ! validate_integer "$dashboard_limit"; then
    fail "Dashboard limit must be a number."
    pause
    return 1
  fi

  create_release "$backend_url" "$dashboard_limit"
  nginx -t
  systemctl reload nginx
  ok "New release is live."
  pause
}

rollback_release() {
  require_root
  print_header

  if [[ ! -d "$RELEASES_DIR" ]]; then
    fail "No releases directory found."
    pause
    return 1
  fi

  mapfile -t releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf "%f\n" | sort -r)

  if [[ "${#releases[@]}" -eq 0 ]]; then
    fail "No releases found."
    pause
    return 1
  fi

  printf "${BOLD}Available releases:${RESET}\n"
  local i
  for i in "${!releases[@]}"; do
    printf "  ${CYAN}%2d)${RESET} %s\n" "$((i + 1))" "${releases[$i]}"
  done

  local choice
  choice="$(prompt "Select release number" "1")"

  if ! [[ "$choice" =~ ^[0-9]+$ ]] || (( choice < 1 || choice > ${#releases[@]} )); then
    fail "Invalid release number."
    pause
    return 1
  fi

  local selected="${releases[$((choice - 1))]}"
  ln -sfn "$RELEASES_DIR/$selected" "$CURRENT_LINK"
  nginx -t
  systemctl reload nginx

  ok "Rolled back to release: $selected"
  pause
}

show_status() {
  print_header

  printf "${BOLD}Nginx:${RESET}\n"
  systemctl --no-pager --full status nginx || true

  printf "\n${BOLD}Current release:${RESET}\n"
  if [[ -L "$CURRENT_LINK" ]]; then
    readlink -f "$CURRENT_LINK"
  else
    warn "No current release symlink found."
  fi

  printf "\n${BOLD}Recent releases:${RESET}\n"
  if [[ -d "$RELEASES_DIR" ]]; then
    find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf "%f\n" | sort -r | head -10
  else
    warn "No releases directory found."
  fi

  printf "\n${BOLD}Nginx config test:${RESET}\n"
  nginx -t || true

  pause
}

reload_nginx() {
  require_root
  print_header

  nginx -t
  systemctl reload nginx
  ok "Nginx reloaded."
  pause
}

show_logs() {
  print_header

  printf "${BOLD}Last Nginx error log lines:${RESET}\n"
  if [[ -f "/var/log/nginx/${APP_NAME}.error.log" ]]; then
    tail -n 80 "/var/log/nginx/${APP_NAME}.error.log"
  else
    warn "Project-specific error log not found. Showing default Nginx error log."
    tail -n 80 /var/log/nginx/error.log 2>/dev/null || true
  fi

  pause
}

renew_ssl() {
  require_root
  print_header

  if confirm "Use proxy for Certbot renewal test?" "n"; then
    set_proxy_from_prompts
    print_header
  fi

  apply_proxy
  certbot renew --dry-run
  ok "Certbot dry-run renewal completed."
  pause
}

uninstall_project() {
  require_root
  print_header

  warn "This removes the Nginx site and optionally removes deployed files."
  if ! confirm "Continue uninstall?" "n"; then
    pause
    return 0
  fi

  rm -f "$NGINX_ENABLED/$DEFAULT_NGINX_SITE"

  if [[ -f "$NGINX_AVAILABLE/$DEFAULT_NGINX_SITE" ]]; then
    mkdir -p "$BACKUPS_DIR"
    cp "$NGINX_AVAILABLE/$DEFAULT_NGINX_SITE" "$BACKUPS_DIR/nginx-${DEFAULT_NGINX_SITE}-uninstall-$(date +%Y%m%d%H%M%S).conf"
    rm -f "$NGINX_AVAILABLE/$DEFAULT_NGINX_SITE"
  fi

  nginx -t
  systemctl reload nginx

  if confirm "Remove deployed files from $APP_DIR?" "n"; then
    rm -rf "$APP_DIR"
    ok "Deployed files removed."
  else
    ok "Nginx site removed. Deployed files were kept."
  fi

  warn "SSL certificates are not deleted automatically. Use certbot delete if you want to remove them."
  pause
}

main_menu() {
  while true; do
    print_header
    printf "${BOLD}Choose an action:${RESET}\n"
    printf "  ${GREEN}1)${RESET} Install production setup\n"
    printf "  ${GREEN}2)${RESET} Deploy new release\n"
    printf "  ${GREEN}3)${RESET} Rollback release\n"
    printf "  ${GREEN}4)${RESET} Show status\n"
    printf "  ${GREEN}5)${RESET} Reload Nginx\n"
    printf "  ${GREEN}6)${RESET} Show logs\n"
    printf "  ${GREEN}7)${RESET} Test SSL renewal\n"
    printf "  ${GREEN}8)${RESET} Proxy settings\n"
    printf "  ${RED}9)${RESET} Uninstall\n"
    printf "  ${YELLOW}0)${RESET} Exit\n\n"

    local choice
    choice="$(prompt "Menu option" "0")"
    printf "\n"

    case "$choice" in
      1) install_or_update ;;
      2) deploy_new_release ;;
      3) rollback_release ;;
      4) show_status ;;
      5) reload_nginx ;;
      6) show_logs ;;
      7) renew_ssl ;;
      8) configure_proxy ;;
      9) uninstall_project ;;
      0) exit 0 ;;
      *) warn "Unknown option."; pause ;;
    esac
  done
}

main_menu "$@"
