import { test } from 'node:test';
import assert from 'node:assert/strict';
import { farewell } from '../src/greeting.js';
import { start } from '../src/server.js';

test('farewell() handles names, blanks and non-strings', () => {
  assert.equal(farewell('Ada'), 'Goodbye, Ada!');
  assert.equal(farewell('  Ada  '), 'Goodbye, Ada!');
  assert.equal(farewell(''), 'Goodbye, world!');
  assert.equal(farewell('   '), 'Goodbye, world!');
  assert.equal(farewell(null), 'Goodbye, world!');
  assert.equal(farewell(undefined), 'Goodbye, world!');
  assert.equal(farewell('x'.repeat(80)), `Goodbye, ${'x'.repeat(50)}!`);
});

test('GET /farewell', async () => {
  const server = await start({ port: 0, host: '127.0.0.1' });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.deepEqual(await (await fetch(`${base}/farewell?name=Ada`)).json(), { farewell: 'Goodbye, Ada!' });
    assert.deepEqual(await (await fetch(`${base}/farewell`)).json(), { farewell: 'Goodbye, world!' });
    assert.deepEqual(await (await fetch(`${base}/farewell?name=%20%20`)).json(), { farewell: 'Goodbye, world!' });
    assert.deepEqual(await (await fetch(`${base}/farewell?name=${'y'.repeat(60)}`)).json(), { farewell: `Goodbye, ${'y'.repeat(50)}!` });
  } finally { server.close(); server.closeAllConnections(); }
});
