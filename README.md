# utopic-pilot-service

The smallest deployable service inside the Utopic workload contract: plain JavaScript on Node, no dependencies, no build
step. Utopic's pilot uses it for its first live deploy, and the build bot extends it with small changes.

    npm test     # node --test, Node 22.18 or newer
    npm start    # node .  (PORT defaults to 8080)

| Route | Answer |
|---|---|
| `GET /healthz` | 200 `ok` (the deploy health path) |
| `GET /` | JSON greeting |
| `GET /greet?name=Ada` | `{"greeting":"Hello, Ada!"}` (no name: `Hello, world!`) |

It listens on `0.0.0.0:$PORT` and shuts down cleanly on SIGTERM.
