const fs = require("fs");
const http = require("http");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = decoded === "/" ? "/index.html" : decoded;
  const target = path.normalize(path.join(root, normalized));
  if (!target.startsWith(root)) return null;
  return target;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function writeJson(relPath, data) {
  fs.writeFileSync(path.join(root, relPath), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeAsset(asset) {
  if (!asset.path.startsWith("assets/img/") || asset.path.includes("..") || asset.path.includes("\\")) {
    throw new Error(`Unsafe asset path: ${asset.path}`);
  }
  const target = path.join(root, asset.path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.from(asset.content, "base64"));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url.startsWith("/api/content")) {
      const site = JSON.parse(fs.readFileSync(path.join(root, "content/site.json"), "utf8"));
      const projects = JSON.parse(fs.readFileSync(path.join(root, "content/projects.json"), "utf8"));
      return send(res, 200, JSON.stringify({ site, projects }), mimeTypes[".json"]);
    }

    if (req.method === "POST" && req.url.startsWith("/api/save")) {
      const payload = JSON.parse(await readBody(req));
      writeJson("content/site.json", payload.site);
      writeJson("content/projects.json", payload.projects);
      for (const asset of payload.assets || []) writeAsset(asset);
      execFileSync(process.execPath, [path.join(root, "scripts/build.js")], { cwd: root, stdio: "inherit" });
      return send(res, 200, JSON.stringify({ ok: true, local: true }), mimeTypes[".json"]);
    }

    let target = safePath(req.url);
    if (!target) return send(res, 403, "Forbidden");
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    if (!fs.existsSync(target) && req.url === "/admin") target = path.join(root, "admin/index.html");
    if (!fs.existsSync(target)) return send(res, 404, "Not found");

    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
    fs.createReadStream(target).pipe(res);
  } catch (error) {
    send(res, 500, error.stack || error.message);
  }
});

server.listen(port, () => {
  console.log(`Local preview: http://localhost:${port}`);
});
