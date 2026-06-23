#!/bin/bash
# ConAI Deployment Script for srv-screens.sp.se
# Run this on the target server AFTER reviewing the probe output

set -e

APP_DIR="/var/www/conai"
DIST_DIR="$APP_DIR/dist"
DATA_DIR="$APP_DIR/data"
REPO_URL="https://github.com/dabrise/conai.git"

echo "======================================"
echo "ConAI Deployment — Main Install"
echo "======================================"

# 1. Install Node.js if missing (adjust for your OS)
if ! command -v node &>/dev/null; then
    echo "Installing Node.js..."
    # Ubuntu/Debian
    if command -v apt &>/dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    # RHEL/CentOS/Rocky
    elif command -v yum &>/dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo "Cannot auto-install Node.js. Please install manually and re-run."
        exit 1
    fi
fi

echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

# 2. Ensure app directory exists
sudo mkdir -p "$APP_DIR"
sudo chown "$(whoami):$(whoami)" "$APP_DIR"

# 3. Clone or update the repo
if [ -d "$APP_DIR/.git" ]; then
    echo "Updating existing repo..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    echo "Cloning repo..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 4. Install dependencies and build
echo "Installing npm dependencies..."
npm ci

echo "Building production bundle..."
npm run build

# 5. Set up data directories
mkdir -p "$DATA_DIR/presets" "$DATA_DIR/sessions"

# 6. Create .env file (YOU MUST EDIT THIS!)
if [ ! -f "$APP_DIR/.env" ]; then
    echo "Creating .env file — YOU MUST EDIT IT WITH REAL API KEYS!"
    cat > "$APP_DIR/.env" << 'EOF'
# OpenRouter API key (get at https://openrouter.ai/keys)
OPENROUTER_KEY=your-openrouter-key-here

# ElevenLabs API key (get at https://elevenlabs.io/app/settings/api-keys)
ELEVENLABS_KEY=your-elevenlabs-key-here

# OpenAI API key (only needed for Realtime voice engine)
OPENAI_KEY=your-openai-key-here

# Shared password for accessing the tool
APP_PASSWORD=change-me-to-something-secure

# Random string for session cookie signing (64+ chars recommended)
SESSION_SECRET=change-this-to-a-long-random-string-at-least-64-characters

# Production mode
NODE_ENV=production
EOF
    echo ""
    echo "*******************************************************************"
    echo "* IMPORTANT: Edit $APP_DIR/.env with your real API keys!          *"
    echo "* Run: nano $APP_DIR/.env                                         *"
    echo "*******************************************************************"
    echo ""
    exit 1
fi

# 7. Install PM2 if not present
if ! command -v pm2 &>/dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# 8. Start the app with PM2
echo "Starting ConAI with PM2..."
cd "$APP_DIR"
pm2 delete conai 2>/dev/null || true
pm2 start server.cjs --name conai --env NODE_ENV=production
pm2 save

# 9. Configure PM2 to start on boot (optional, may need sudo)
# sudo env PATH=$PATH:$(dirname $(which node)) pm2 startup systemd -u $(whoami) --hp $HOME

echo ""
echo "======================================"
echo "App deployed and running on port 3001"
echo "======================================"
echo ""
