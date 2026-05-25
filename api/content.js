const fs = require("fs");
const path = require("path");

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return sendJson(res, 500, { error: "Missing ADMIN_PASSWORD environment variable" });
  }

  if (req.headers["x-admin-password"] !== expectedPassword) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  try {
    const root = process.cwd();
    const site = JSON.parse(fs.readFileSync(path.join(root, "content/site.json"), "utf8"));
    const projects = JSON.parse(fs.readFileSync(path.join(root, "content/projects.json"), "utf8"));
    return sendJson(res, 200, { site, projects });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
};
