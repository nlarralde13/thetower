import fs from 'node:fs';
import path from 'node:path';
import { createContentStore } from './content-store.mjs';

const port = Number(process.env.PORT || 3001);
const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const store = await createContentStore();

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

function textResponse(payload, status = 200, contentType = 'text/plain; charset=utf-8') {
  return new Response(payload, {
    status,
    headers: { 'content-type': contentType }
  });
}

function normalizeContentPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }
  const mutableKinds = ['realms', 'zones', 'areas', 'items', 'enemies', 'recipes', 'events', 'expeditions'];
  const normalized = {};
  for (const kind of mutableKinds) {
    if (!Array.isArray(payload[kind])) {
      throw new Error(`Missing ${kind}`);
    }
    normalized[kind] = payload[kind];
  }
  normalized.updatedAt = typeof payload.updatedAt === 'number' ? payload.updatedAt : Date.now();
  return normalized;
}

function serveStatic(requestUrl) {
  if (!fs.existsSync(distDir)) {
    return null;
  }
  const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const filePath = path.join(distDir, requestedPath);
  const safePath = path.normalize(filePath);
  const relativePath = path.relative(distDir, safePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return textResponse('Not found', 404);
  }
  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const content = fs.readFileSync(safePath);
    const ext = path.extname(safePath);
    const contentType =
      ext === '.html'
        ? 'text/html; charset=utf-8'
        : ext === '.css'
          ? 'text/css; charset=utf-8'
          : ext === '.js'
            ? 'application/javascript; charset=utf-8'
            : 'application/octet-stream';
    return new Response(content, {
      status: 200,
      headers: { 'content-type': contentType }
    });
  }
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return new Response(fs.readFileSync(indexPath), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  }
  return textResponse('Not found', 404);
}

async function handleRequest(request) {
  const url = new URL(request.url);

  if (url.pathname === '/api/health') {
    return jsonResponse({ ok: true });
  }

  if (url.pathname === '/api/content' && request.method === 'GET') {
    return jsonResponse(store.loadContent());
  }

  if (url.pathname === '/api/content' && request.method === 'PUT') {
    try {
      const payload = normalizeContentPayload(await request.json());
      return jsonResponse(store.replaceContent(payload));
    } catch (error) {
      return jsonResponse({ error: error.message ?? 'Invalid payload' }, 400);
    }
  }

  if (url.pathname === '/api/reset' && request.method === 'POST') {
    return jsonResponse(store.resetContent());
  }

  if (request.method === 'GET') {
    const response = serveStatic(url);
    if (response) return response;
  }

  return textResponse('Not found', 404);
}

const http = await import('node:http');
const nodeServer = http.createServer(async (req, res) => {
  try {
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
      duplex: req.method === 'GET' || req.method === 'HEAD' ? undefined : 'half'
    });
    const response = await handleRequest(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const arrayBuffer = await response.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } else {
      res.end();
    }
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error.message ?? 'Server error' }));
  }
});

nodeServer.listen(port, '0.0.0.0', () => {
  console.log(`API server running on http://localhost:${port}`);
});

process.on('SIGINT', () => {
  nodeServer.close(() => process.exit(0));
});
