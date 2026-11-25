import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { greet } from './greeting.js';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': `${type}; charset=utf-8` });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

/** The request handler. Routes: GET /healthz, GET /, GET /greet?name=, GET /version */
export function handle(req, res) {
  let url;
  try { url = new URL(req.url ?? '/', 'http://localhost'); } catch { return send(res, 400, { error: 'bad_request' }); } // e.g. a path of "//"
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method_not_allowed' });
  switch (url.pathname) {
    case '/healthz': return send(res, 200, 'ok', 'text/plain');
    case '/': return send(res, 200, { service: 'utopic-pilot-service', message: 'Hello from the Utopic pilot service' });
    case '/greet': return send(res, 200, { greeting: greet(url.searchParams.get('name')) });
    case '/version': return send(res, 200, { version });
    default: return send(res, 404, { error: 'not_found' });
  }
}

/** Starts the server; resolves once it is listening. Closes gracefully on SIGTERM/SIGINT when `signals` is true. */
export function start({ port = Number(process.env.PORT) || 8080, host = '0.0.0.0', signals = false } = {}) {
  const server = http.createServer(handle);
  if (signals) {
    const stop = () => {
      server.close(() => process.exit(0));
      server.closeIdleConnections();
      setTimeout(() => process.exit(0), 5000).unref();
    };
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
  }
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1] === fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')) {
  const s = await start({ signals: true });
  console.log(`utopic-pilot-service listening on ${s.address().port}`);
}
