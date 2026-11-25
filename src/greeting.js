/** The greeting for GET /greet?name=. Pure, so the build bot can extend it without touching the server. */
export function greet(name) {
  const who = typeof name === 'string' ? name.trim().slice(0, 50) : '';
  return who === '' ? 'Hello, world!' : `Hello, ${who}!`;
}
