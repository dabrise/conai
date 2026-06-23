require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { Readable } = require('node:stream');

const app = express();
const PORT = 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// Pipe an upstream fetch() body to the Express response, regardless of whether
// it's a Node stream (node-fetch) or a WHATWG ReadableStream (Node global fetch,
// which has no .pipe()). This is required for streaming chat + audio.
function pipeUpstream(upstream, res) {
  const body = upstream.body;
  if (!body) { res.end(); return; }
  if (typeof body.pipe === 'function') {
    body.pipe(res);                  // Node Readable
  } else {
    Readable.fromWeb(body).pipe(res); // web ReadableStream → Node Readable
  }
}

// Behind nginx (and KEMP). Trust the X-Forwarded-Proto header so req.secure
// reflects the original HTTPS connection — required for `secure: true` cookies.
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const PRESETS_DIR = path.join(DATA_DIR, 'presets');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const DIST_DIR = path.join(__dirname, 'dist');

[DATA_DIR, PRESETS_DIR, SESSIONS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// === SECRETS from .env ===
const OPENROUTER_KEY = process.env.OPENROUTER_KEY || '';
const ELEVENLABS_KEY = process.env.ELEVENLABS_KEY || '';
const OPENAI_KEY = process.env.OPENAI_KEY || '';
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret';

if (!APP_PASSWORD) {
  console.warn('\n[WARN] APP_PASSWORD not set in .env — anyone can access the tool!\n');
}

// === SESSION COOKIES ===
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: IS_PROD,     // HTTPS-only in production
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// === AUTH MIDDLEWARE ===
function requireAuth(req, res, next) {
  if (req.session?.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// === LOGIN / LOGOUT / STATUS (public) ===

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!APP_PASSWORD) return res.status(500).json({ error: 'Server has no password configured' });
  if (password === APP_PASSWORD) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Incorrect password' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth-status', (req, res) => {
  res.json({ authenticated: Boolean(req.session?.authenticated) });
});

app.get('/api/status', requireAuth, (req, res) => {
  res.json({
    openrouter: Boolean(OPENROUTER_KEY),
    elevenlabs: Boolean(ELEVENLABS_KEY),
    openai: Boolean(OPENAI_KEY),
  });
});

// === DATA HELPERS ===

function readAllFiles(dir) {
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    return files
      .map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')); } catch { return null; } })
      .filter(Boolean)
      .sort((a, b) => (b.savedAt || b.startTime || 0) - (a.savedAt || a.startTime || 0));
  } catch { return []; }
}

// === PRESETS (auth required) ===
app.get('/api/presets', requireAuth, (req, res) => res.json(readAllFiles(PRESETS_DIR)));

app.post('/api/presets', requireAuth, (req, res) => {
  const preset = req.body;
  if (!preset.id || typeof preset.id !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(preset.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  fs.writeFileSync(path.join(PRESETS_DIR, `${preset.id}.json`), JSON.stringify(preset, null, 2));
  console.log(`[Preset saved] ${preset.name}`);
  res.json({ ok: true });
});

app.delete('/api/presets/:id', requireAuth, (req, res) => {
  if (!/^[a-zA-Z0-9-_]+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try { fs.unlinkSync(path.join(PRESETS_DIR, `${req.params.id}.json`)); } catch {}
  res.json({ ok: true });
});

// === SESSIONS (auth required) ===
app.get('/api/sessions', requireAuth, (req, res) => res.json(readAllFiles(SESSIONS_DIR)));

app.post('/api/sessions', requireAuth, (req, res) => {
  const s = req.body;
  if (!s.id || typeof s.id !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(s.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  fs.writeFileSync(path.join(SESSIONS_DIR, `${s.id}.json`), JSON.stringify(s, null, 2));
  const label = s.type === 'live' ? `P${s.participantNumber}` : 'Chat';
  console.log(`[Session saved] ${label} (${s.messages?.length || 0} messages)`);
  res.json({ ok: true });
});

app.delete('/api/sessions/:id', requireAuth, (req, res) => {
  if (!/^[a-zA-Z0-9-_]+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try { fs.unlinkSync(path.join(SESSIONS_DIR, `${req.params.id}.json`)); } catch {}
  res.json({ ok: true });
});

// === OPENROUTER CHAT PROXY (auth required, streaming) ===

app.post('/api/chat', requireAuth, async (req, res) => {
  if (!OPENROUTER_KEY) return res.status(503).json({ error: { message: 'OpenRouter not configured' } });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'http://localhost',
        'X-Title': 'ConAI AINA LLM Tester',
      },
      body: JSON.stringify(req.body),
    });

    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');

    if (req.body.stream) pipeUpstream(response, res);
    else res.json(await response.json());
  } catch (err) {
    console.error('[OpenRouter proxy]', err.message);
    res.status(502).json({ error: { message: err.message } });
  }
});

// === ELEVENLABS TTS PROXY (auth required) ===

app.post('/api/tts', requireAuth, async (req, res) => {
  if (!ELEVENLABS_KEY) return res.status(503).json({ error: { message: 'ElevenLabs not configured' } });

  const { voiceId, text, model, stability, similarity } = req.body;
  if (!voiceId || !text) return res.status(400).json({ error: 'Missing voiceId or text' });

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: model || 'eleven_multilingual_v2',
        voice_settings: { stability: stability ?? 0.5, similarity_boost: similarity ?? 0.75 },
      }),
    });

    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
    pipeUpstream(response, res);
  } catch (err) {
    console.error('[ElevenLabs TTS]', err.message);
    res.status(502).json({ error: { message: err.message } });
  }
});

// === OPENAI REALTIME — mint ephemeral token (auth required) ===
// The browser connects to OpenAI directly via WebRTC using this short-lived
// token, so the real OPENAI_KEY never leaves the server.

app.post('/api/realtime-token', requireAuth, async (req, res) => {
  if (!OPENAI_KEY) return res.status(503).json({ error: { message: 'OpenAI not configured' } });

  const { model, voice } = req.body || {};
  if (!model) return res.status(400).json({ error: { message: 'Missing model' } });

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model,
          audio: { output: { voice: voice || 'marin' } },
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[Realtime token]', response.status, JSON.stringify(data).slice(0, 300));
      return res.status(response.status).json({
        error: { message: data?.error?.message || `Realtime token error ${response.status}` },
      });
    }

    // Response shape: { value: 'ek_...', expires_at, session: {...} } (or nested client_secret)
    const value = data.value || data.client_secret?.value;
    if (!value) {
      return res.status(502).json({ error: { message: 'No ephemeral token returned by OpenAI' } });
    }
    console.log(`[Realtime token] minted for model ${model}, voice ${voice || 'marin'}`);
    res.json({ value, model });
  } catch (err) {
    console.error('[Realtime token]', err.message);
    res.status(502).json({ error: { message: err.message } });
  }
});

// === LOCAL MODEL PROXY (auth required, SSRF-protected) ===

// Only allow localhost/LAN endpoints, not arbitrary URLs
function isSafeLocalEndpoint(endpoint) {
  try {
    const url = new URL(endpoint);
    const hostname = url.hostname;
    // Only allow these:
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    );
  } catch { return false; }
}

app.post('/api/local-llm', requireAuth, async (req, res) => {
  const { endpoint, ...body } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint URL' });
  if (!isSafeLocalEndpoint(endpoint)) {
    return res.status(403).json({
      error: { message: 'Endpoint must be localhost or a LAN address (192.168.x.x, 10.x.x.x, 172.16-31.x.x)' }
    });
  }

  try {
    const url = endpoint.replace(/\/$/, '') + '/v1/chat/completions';
    console.log(`[Local LLM] ${url} (${body.model})`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');

    if (body.stream) pipeUpstream(response, res);
    else res.json(await response.json());
  } catch (err) {
    console.error('[Local LLM]', err.message);
    res.status(502).json({ error: { message: err.message } });
  }
});

// === PRODUCTION: serve built frontend from /dist ===

if (IS_PROD && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback — serve index.html for non-API routes
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`[Prod mode] Serving built frontend from ${DIST_DIR}`);
}

app.listen(PORT, () => {
  console.log(`\n  ConAI API server on http://localhost:${PORT}`);
  console.log(`  Mode:       ${IS_PROD ? 'production' : 'development'}`);
  console.log(`  Password:   ${APP_PASSWORD ? 'configured' : 'NOT SET (open access!)'}`);
  console.log(`  OpenRouter: ${OPENROUTER_KEY ? 'configured' : 'NOT SET'}`);
  console.log(`  ElevenLabs: ${ELEVENLABS_KEY ? 'configured' : 'NOT SET'}`);
  console.log(`  OpenAI:     ${OPENAI_KEY ? 'configured' : 'NOT SET'}`);
  console.log(`  Data dir:   ${DATA_DIR}\n`);
});
