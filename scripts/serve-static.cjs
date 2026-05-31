#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
};

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const host = getArg('host', '127.0.0.1');
const port = Number(getArg('port', process.env.PORT || 3005));
const root = path.resolve(getArg('root', process.cwd()));
const openPath = getArg('open', '');

function isInsideRoot(filePath) {
  const relative = path.relative(root, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolveRequestPath(reqUrl) {
  const url = new URL(reqUrl, `http://${host}:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  if (pathname === '/favicon.ico') pathname = '/icons/icon-192.png';

  const candidates = [];
  if (pathname.startsWith('/content/')) {
    candidates.push(path.join(root, 'public', pathname));
  }
  candidates.push(path.join(root, pathname));

  for (const candidate of candidates) {
    if (isInsideRoot(candidate) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function landingContentPath() {
  return path.join(root, 'public', 'content', 'landing-pages.json');
}

async function handleLandingContent(req, res) {
  const filePath = landingContentPath();

  if (req.method === 'GET') {
    if (!fs.existsSync(filePath)) {
      sendJson(res, 404, { error: 'Landing content file not found.' });
      return;
    }
    try {
      sendJson(res, 200, JSON.parse(fs.readFileSync(filePath, 'utf8')));
    } catch (error) {
      sendJson(res, 500, { error: error.message || 'Landing content could not be read.' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const body = await readJson(req);
      if (!body || typeof body !== 'object' || !body.pages || typeof body.pages !== 'object') {
        sendJson(res, 400, { error: 'Landing content must include a pages object.' });
        return;
      }
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Landing content could not be saved.' });
    }
    return;
  }

  res.writeHead(405, { Allow: 'GET, PUT' });
  res.end('Method Not Allowed');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${host}:${port}`);
  if (url.pathname === '/api/landing-content') {
    handleLandingContent(req, res);
    return;
  }

  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  let filePath;
  try {
    filePath = resolveRequestPath(req.url);
  } catch (_err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}/`);
  if (openPath) {
    const target = new URL(openPath.replace(/^\/+/, ''), `http://${host}:${port}/`).toString();
    const opener = spawn('open', [target], { detached: true, stdio: 'ignore' });
    opener.unref();
  }
});
