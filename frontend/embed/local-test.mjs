import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const root = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.resolve(root, '..');
const bundle = path.join(frontend, 'dist', 'embed', 'agent.js');
const page = path.join(root, 'test-page.html');
const KEY = 'pk_testpagekeytestpagekeytestpagekey12';

const built = spawnSync(process.execPath, [
  path.join(frontend, 'node_modules', 'vite', 'bin', 'vite.js'),
  'build',
  '--config',
  'vite.embed.loader.config.js',
], { cwd: frontend, stdio: 'inherit' });
if (built.status !== 0) process.exit(built.status || 1);

const agentSource = readFileSync(bundle, 'utf8');
assert.equal(agentSource.includes('GROK_API_KEY'), false);
assert.equal(agentSource.includes('xai-'), false);

const requests = [];
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  requests.push({ path: url.pathname, key: request.headers['x-embed-key'] || '' });
  if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/public/embed/')) {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': request.headers.origin || '*',
      'Access-Control-Allow-Headers': 'x-embed-key, content-type, accept',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    response.end();
    return;
  }
  if (url.pathname === '/embed/test-page.html') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(readFileSync(page));
    return;
  }
  if (url.pathname === '/embed/agent.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    response.end(agentSource);
    return;
  }
  if (url.pathname === '/embed/frame.html') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end('<!doctype html><title>frame</title><p>frame de prueba</p>');
    return;
  }
  if (url.pathname === '/api/public/embed/config') {
    const origin = request.headers.origin || '';
    if (request.headers['x-embed-key'] !== KEY || (origin && !origin.startsWith('http://127.0.0.1'))) {
      response.writeHead(403, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ detail: 'embed_agent_origin' }));
      return;
    }
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      provider: 'browser',
      name: 'BiciSur',
      greeting: 'Hola',
      frame_token: 'frame-token-de-prueba',
    }));
    return;
  }
  response.writeHead(404);
  response.end();
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const pageUrl = `http://127.0.0.1:${port}/embed/test-page.html`;

const dom = await JSDOM.fromURL(pageUrl, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.fetch = (input, init) => fetch(input, init);
  },
});

const deadline = Date.now() + 5000;
let host = null;
while (Date.now() < deadline) {
  host = dom.window.document.querySelector('[data-sistemamaestro-embed]');
  if (host && host.shadowRoot) break;
  await new Promise((resolve) => setTimeout(resolve, 40));
}
assert.ok(host, 'el bundle no montó el widget');
assert.equal(dom.window.document.querySelector('style'), null);
assert.equal(dom.window.document.querySelector('link[rel="stylesheet"]'), null);

const button = host.shadowRoot.querySelector('[data-embed-launcher]');
assert.equal(button.textContent, 'Hablar');
button.click();

let src = '';
const frameDeadline = Date.now() + 5000;
while (Date.now() < frameDeadline) {
  src = host.shadowRoot.querySelector('iframe')?.getAttribute('src') || '';
  if (src) break;
  await new Promise((resolve) => setTimeout(resolve, 40));
}

assert.equal(src, `http://127.0.0.1:${port}/embed/frame.html#frame-token-de-prueba`);
assert.equal(src.includes(KEY), false);
assert.ok(requests.some((item) => item.path === '/api/public/embed/config' && item.key === KEY));
assert.equal(dom.window.document.querySelector('style'), null);

dom.window.close();
server.close();
console.log('embed local page ok');
