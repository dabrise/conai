#!/bin/bash
# ConAI Deployment Script for srv-screens.sp.se
# Run this on the target server after SSHing in

set -e

APP_DIR="/var/www/conai"
DIST_DIR="$APP_DIR/dist"
DATA_DIR="$APP_DIR/data"
REPO_URL="https://github.com/dabrise/conai.git"
NODE_VERSION="22"

echo "======================================"
echo "ConAI Deployment — Server Probe"
echo "======================================"

# 1. Check what we have installed
echo ""
echo "--- Checking Node.js ---"
if command -v node &>/dev/null; then
    echo "Node.js version: $(node --version)"
    echo "npm version: $(npm --version)"
else
    echo "Node.js NOT installed"
fi

echo ""
echo "--- Checking git ---"
if command -v git &>/dev/null; then
    echo "Git version: $(git --version)"
else
    echo "Git NOT installed"
fi

echo ""
echo "--- Checking nginx ---"
if command -v nginx &>/dev/null; then
    echo "Nginx version: $(nginx -v 2>&1)"
    echo "Nginx config dir:"
    ls -la /etc/nginx/sites-available/ 2>/dev/null || echo "No /etc/nginx/sites-available/"
    ls -la /etc/nginx/conf.d/ 2>/dev/null || echo "No /etc/nginx/conf.d/"
else
    echo "Nginx NOT installed"
fi

echo ""
echo "--- Checking pm2 ---"
if command -v pm2 &>/dev/null; then
    echo "PM2 version: $(pm2 --version)"
else
    echo "PM2 NOT installed"
fi

echo ""
echo "--- Checking sudo access ---"
if sudo -n true 2>/dev/null; then
    echo "Sudo access: YES"
else
    echo "Sudo access: NO (or requires password)"
fi

echo ""
echo "--- Checking OS ---"
cat /etc/os-release 2>/dev/null || echo "OS info not available"

echo ""
echo "--- Checking existing app ---"
if [ -d "$APP_DIR" ]; then
    echo "App directory exists: $APP_DIR"
    ls -la "$APP_DIR"
else
    echo "App directory does NOT exist yet"
fi

echo ""
echo "======================================"
echo "Probe complete. Review the output above."
echo "======================================"
