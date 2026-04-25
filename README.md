# ConAI — AINA LLM Tester

A web tool for the ConAI research project to test and refine AINA (the conversational AI co-driver for Scania trucks) prompt configurations, ADAS knowledge bases, scenario contexts, and voice interactions.

Built for RISE × Scania as part of the WP3 work package.

## Features

- **Prompt configuration** — editable agent modes (Adaptive/Calm/Proactive), response depths, design principles, ADAS knowledge modules, scenario contexts, and base identity prompt
- **Live testing** — type or speak to AINA and hear voice responses via ElevenLabs TTS
- **Start Test mode** — researcher-controlled live session with 3 modes (hands-free, approve, manual), participant number tracking, and full transcript saving
- **Multi-language** — English and Swedish support
- **Session history** — automatic saving of all transcripts with export
- **Settings presets** — save/load/share complete configurations
- **Multiple LLMs** — access hundreds of models via OpenRouter, or bring your own local model (Ollama, LM Studio)
- **Server-side password gate** — real auth via session cookies (not just a client-side check)

## Quick Start (development)

1. Clone the repo
2. Install dependencies: `npm install`
3. Set up your `.env`: `cp .env.example .env` then fill in values
4. Run dev mode: `npm run dev`
5. Open http://localhost:5173
6. Enter your `APP_PASSWORD`

## Production deployment

For a real server (not localhost), run in production mode which:
- Builds the frontend to `dist/`
- Express serves the static files AND the API from a single port (3001)
- Enables `secure` session cookies (HTTPS-only)

```bash
npm run prod
```

Or step-by-step:
```bash
npm run build   # compiles frontend to dist/
npm run start   # NODE_ENV=production node server.cjs
```

### Behind HTTPS

On a real domain, put the Express server (port 3001) behind a reverse proxy with TLS. The simplest is **Caddy**:

```
yourdomain.com {
    reverse_proxy localhost:3001
}
```

Caddy auto-provisions Let's Encrypt TLS certs. Done.

Or nginx:
```
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### Firewall

Block direct access to port 3001. Only allow 443 (HTTPS).

```bash
sudo ufw allow 443/tcp
sudo ufw deny 3001/tcp
```

### Running as a service (systemd)

Create `/etc/systemd/system/conai.service`:
```
[Unit]
Description=ConAI AINA Tester
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/conai
ExecStart=/usr/bin/npm run start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then: `sudo systemctl enable --now conai`

## Environment variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_KEY` | OpenRouter API key (for LLM calls) |
| `ELEVENLABS_KEY` | ElevenLabs API key (for TTS) |
| `APP_PASSWORD` | Password users enter at the gate |
| `SESSION_SECRET` | Random string for signing session cookies |
| `NODE_ENV` | `development` or `production` |

## Architecture

- **Frontend:** React + TypeScript + Vite + Tailwind CSS 4
- **Backend:** Express.js with session-based auth
- **LLM:** OpenRouter proxy (one API for all cloud models) or local via Ollama (LAN-only, SSRF-protected)
- **TTS:** ElevenLabs multilingual v2 (server-proxied)
- **STT:** Chrome Web Speech API (browser-native, real-time)
- **Storage:** JSON files in `data/` (presets and transcripts)

## Security notes

- **API keys never reach the browser** — all LLM/TTS calls proxy through Express, which reads keys from `.env` only on the server
- **Session-based auth** — password is checked server-side, signed HTTP-only cookies used for authenticated requests
- **API endpoints require auth** — any call to `/api/chat`, `/api/tts`, `/api/presets`, etc. requires a valid session
- **Local model proxy is LAN-only** — `/api/local-llm` only accepts localhost, 192.168.x.x, 10.x.x.x, and 172.16-31.x.x endpoints to prevent SSRF attacks
- **Set a strong `SESSION_SECRET`** in production (random 64-char string)
- **Rate limiting** is not enforced server-side — set it at the API provider level (OpenRouter dashboard, ElevenLabs limits)

## License

Internal research tool — not for public distribution.
