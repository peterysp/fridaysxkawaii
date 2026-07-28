const http = require("http");
const fs = require("fs");
const path = require("path");
const loginHandler = require("./api/login");
const logoutHandler = require("./api/logout");
const meHandler = require("./api/me");
const sheetHandler = require("./api/sheet");

const publicDir = path.join(__dirname, "public");
const port = process.env.PORT || 3000;
const host = process.env.HOST || "127.0.0.1";
const apiRoutes = {
  "/api/login": loginHandler,
  "/api/logout": logoutHandler,
  "/api/me": meHandler,
  "/api/sheet": sheetHandler
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end(error.code === "ENOENT" ? "404 Not Found" : "Server Error");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(request.url.split("?")[0]);

  if (apiRoutes[urlPath]) {
    apiRoutes[urlPath](request, response);
    return;
  }

  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = safePath === "/" ? "/index.html" : safePath;
  const filePath = path.join(publicDir, requestedPath);

  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  sendFile(response, filePath);
});

server.listen(port, host, () => {
  console.log(`Fridays x Kawaii website running at http://localhost:${port}`);
});
