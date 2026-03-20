/**
 * Simple reverse proxy: one port serves both Metro and Backend API.
 * - /api/* → backend (localhost:8000)
 * - everything else → Metro bundler (localhost:8081)
 *
 * This allows a single ngrok tunnel to serve both Expo Go and API calls.
 */
const http = require("http");
const httpProxy = require("http-proxy");

const PROXY_PORT = 9000;
const METRO_TARGET = "http://localhost:8081";
const BACKEND_TARGET = "http://localhost:8000";

const proxy = httpProxy.createProxyServer({ ws: true });

proxy.on("error", (err, _req, res) => {
  console.error("[proxy error]", err.message);
  if (res.writeHead) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Proxy error");
  }
});

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    proxy.web(req, res, { target: BACKEND_TARGET });
  } else {
    proxy.web(req, res, { target: METRO_TARGET });
  }
});

// WebSocket upgrade: /api/* → backend, others → Metro hot reload
server.on("upgrade", (req, socket, head) => {
  const target = req.url.startsWith("/api/") ? BACKEND_TARGET : METRO_TARGET;
  proxy.ws(req, socket, head, { target });
});

server.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(`[proxy] Listening on port ${PROXY_PORT}`);
  console.log(`[proxy] /api/* → ${BACKEND_TARGET}`);
  console.log(`[proxy] /*     → ${METRO_TARGET}`);
});
