import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { start } from '../src/server.js';

async function withServer(fn) {
  const server = await start({ port: 0, host: '127.0.0.1' });
  try { return await fn(`http://127.0.0.1:${server.address().port}`); } finally { server.close(); server.closeAllConnections(); }
}

test('GET /healthz answers 200 ok', () => withServer(async (base) => {
  const r = await fetch(`${base}/healthz`);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'ok');
}));

test('GET / answers a JSON greeting', () => withServer(async (base) => {
  const r = await fetch(`${base}/`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /application\/json/);
  const body = await r.json();
  assert.equal(body.service, 'utopic-pilot-service');
  assert.ok(body.message);
}));

test('GET /greet greets by name, or the world', () => withServer(async (base) => {
  assert.deepEqual(await (await fetch(`${base}/greet?name=Ada`)).json(), { greeting: 'Hello, Ada!' });
  assert.deepEqual(await (await fetch(`${base}/greet`)).json(), { greeting: 'Hello, world!' });
  assert.deepEqual(await (await fetch(`${base}/greet?name=%20%20`)).json(), { greeting: 'Hello, world!' });
  assert.deepEqual(await (await fetch(`${base}/greet?name=${'x'.repeat(200)}`)).json(), { greeting: `Hello, ${'x'.repeat(50)}!` });
}));

test('unknown paths are 404 and other methods are 405', () => withServer(async (base) => {
  assert.equal((await fetch(`${base}/nope`)).status, 404);
  assert.equal((await fetch(`${base}/healthz`, { method: 'POST' })).status, 405);
}));

test('node . listens on PORT and exits 0 on SIGTERM', async () => {
  const child = spawn(process.execPath, ['.'], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'] });
  let out = '';
  const port = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.stdout.on('data', (d) => { out += d; const m = /listening on (\d+)/.exec(out); if (m) resolve(Number(m[1])); });
    child.once('exit', (c) => reject(new Error(`exited early ${c}`)));
  });
  assert.equal((await fetch(`http://127.0.0.1:${port}/healthz`)).status, 200);
  child.removeAllListeners('exit');
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  const [code, signal] = await exited;
  assert.equal(code, 0, `exit code ${code}, signal ${signal}`);
});

test('a request path that is not a valid URL is a 400, not a crash', async () => {
  const { start } = await import('../src/server.js');
  const net = await import('node:net');
  const server = await start({ port: 0, host: '127.0.0.1' });
  const { port } = server.address();
  const reply = await new Promise((resolve, reject) => {
    const s = net.connect(port, '127.0.0.1', () => s.write('GET // HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n'));
    let d = ''; s.on('data', (c) => { d += c; }); s.on('end', () => resolve(d)); s.on('error', reject);
  });
  server.close();
  assert.match(reply, /^HTTP\/1\.1 400/);
});
