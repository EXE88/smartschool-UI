#!/usr/bin/env bash

set -Eeuo pipefail

APP_NAME="smartschool-ui"
APP_DIR="/var/www/${APP_NAME}"
NGINX_SITE="${APP_NAME}"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd -P)"
DOMAIN="${DOMAIN:-_}"

info() { printf "[INFO] %s\n" "$*"; }
error() { printf "[ERROR] %s\n" "$*" >&2; }
require_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    error "This script must run as root. Use: sudo bash scripts/production-manager.sh"
    exit 1
  fi
}

install_nginx() {
  if ! command -v nginx >/dev/null 2>&1; then
    if command -v apt-get >/dev/null 2>&1; then
      info "Installing nginx and rsync..."
      apt-get update
      apt-get install -y nginx rsync
    else
      error "This script supports Debian/Ubuntu only. Install nginx and rsync manually on your platform."
      exit 1
    fi
  else
    info "nginx is already installed."
  fi
}

deploy_project() {
  info "Copying project files to $APP_DIR..."
  mkdir -p "$APP_DIR"
  rsync -a --delete \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude "dist" \
    --exclude "build" \
    --exclude "*.log" \
    "$ROOT_DIR/" "$APP_DIR/"
}

write_nginx_config() {
  local config_path="$NGINX_AVAILABLE/$NGINX_SITE"

  info "Writing nginx site config to $config_path..."
  cat > "$config_path" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $APP_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|webp|woff|woff2|ttf|eot|map)$ {
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000";
        try_files \$uri =404;
    }
}
EOF

  ln -sfn "$config_path" "$NGINX_ENABLED/$NGINX_SITE"
  rm -f "$NGINX_ENABLED/default"
}

reload_nginx() {
  info "Testing nginx configuration..."
  nginx -t
  info "Reloading nginx..."
  systemctl reload nginx
}

main() {
  require_root
  install_nginx
  deploy_project
  write_nginx_config
  reload_nginx
  info "Deployment complete. Project is served from $APP_DIR."
  info "Set DOMAIN=<your-domain> before running if you want a specific server_name."
}

main "$@"
