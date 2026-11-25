import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { start } from '../src/server.js';

test('GET /version answers the package.json version', async () => {
  const server = await start({ port: 0, host: '127.0.0.1' });
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/version`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /application\/json/);
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    assert.deepEqual(await r.json(), { version });
  } finally { server.close(); server.closeAllConnections(); }
});
