# ConAI Deployment Guide — Manual Steps

## Step 1: SSH to the jump server, then to the target server

Open your terminal (PowerShell, Git Bash, or CMD) and run:

```bash
ssh U93305@sp.se@srv-rd-ssh-1.sp.se
```

Enter your password when prompted.

Once inside the jump server, SSH to the target:

```bash
ssh srv-screens.sp.se
```

(Or try: `ssh U93305@sp.se@srv-screens.sp.se` if the short form doesn't work)

## Step 2: Probe the server

On `srv-screens.sp.se`, run the probe script to see what's installed:

```bash
# Option A: Copy-paste this entire block into the terminal
bash -c '
set -e
APP_DIR="/var/www/conai"

echo "=== Node.js ==="
command -v node &>/dev/null && echo "Node: $(node --version), npm: $(npm --version)" || echo "NOT installed"

echo ""
echo "=== Git ==="
command -v git &>/dev/null && echo "Git: $(git --version)" || echo "NOT installed"

echo ""
echo "=== Nginx ==="
command -v nginx &>/dev/null && echo "Nginx: $(nginx -v 2>&1)" || echo "NOT installed"

echo ""
echo "=== PM2 ==="
command -v pm2 &>/dev/null && echo "PM2: $(pm2 --version)" || echo "NOT installed"

echo ""
echo "=== Sudo ==="
sudo -n true 2>/dev/null && echo "Sudo: YES" || echo "Sudo: NO (or requires password)"

echo ""
echo "=== OS ==="
cat /etc/os-release 2>/dev/null | head -n 5

echo ""
echo "=== Existing app ==="
[ -d "$APP_DIR" ] && echo "App dir exists: $APP_DIR" || echo "App dir: NOT found"
'
```

**Copy the output and paste it back to me.** I'll adjust the deploy script based on what you find.

## Step 3: Deploy the app

After I review the probe output, I'll give you the exact deploy commands. But the general flow is:

1. Install Node.js (if missing)
2. Clone the repo: `git clone https://github.com/dabrise/conai.git /var/www/conai`
3. `cd /var/www/conai && npm ci && npm run build`
4. Create `.env` with real API keys
5. Start with PM2: `pm2 start server.cjs --name conai`

## Step 4: Configure nginx

Add the nginx location block from `03-nginx-conai.conf` to the existing `screens.ri.se` config, then reload nginx.

## Step 5: Test

Open `https://screens.ri.se/conai` in your browser and verify:
- The login page loads
- You can log in with the APP_PASSWORD
- Chat/LLM works (test with a local model first to avoid API key issues)
- Voice/TTS works

## Rollback

If something breaks:
```bash
# Stop the app
pm2 stop conai

# Revert nginx
sudo nginx -t && sudo nginx -s reload
```

## Troubleshooting

- **Port 3001 already in use**: `lsof -i :3001` to find the process, then `kill <PID>`
- **nginx config error**: `sudo nginx -t` will show the exact line
- **Build fails**: Check Node.js version (needs 18+), run `npm ci` to clear cache
- **API keys not working**: Check `.env` file exists and has correct values
