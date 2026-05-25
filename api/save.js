function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(data));
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function assertSafeAsset(asset) {
  if (!asset || typeof asset.path !== "string" || typeof asset.content !== "string") {
    throw new Error("Invalid asset payload");
  }
  if (!asset.path.startsWith("assets/img/") || asset.path.includes("..") || asset.path.includes("\\")) {
    throw new Error(`Unsafe asset path: ${asset.path}`);
  }
  if ((asset.encoding || "base64") !== "base64") {
    throw new Error(`Unsupported asset encoding for ${asset.path}`);
  }
  if (asset.content.length > 6_500_000) {
    throw new Error(`Asset is too large: ${asset.path}`);
  }
}

function cleanPayload(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Invalid JSON payload");
  if (!payload.site || typeof payload.site !== "object") throw new Error("Missing site content");
  if (!Array.isArray(payload.projects)) throw new Error("Missing projects content");

  const files = [
    {
      path: "content/site.json",
      content: `${JSON.stringify(payload.site, null, 2)}\n`,
      encoding: "utf-8",
    },
    {
      path: "content/projects.json",
      content: `${JSON.stringify(payload.projects, null, 2)}\n`,
      encoding: "utf-8",
    },
  ];

  for (const asset of payload.assets || []) {
    assertSafeAsset(asset);
    files.push({
      path: asset.path,
      content: asset.content,
      encoding: "base64",
    });
  }

  return files;
}

function githubClient({ owner, repo, token }) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  return async function gh(endpoint, options = {}) {
    const response = await fetch(`${base}${endpoint}`, {
      ...options,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
        "content-type": "application/json",
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      throw new Error(data.message || `GitHub API ${response.status}`);
    }
    return data;
  };
}

async function commitFiles(files) {
  const owner = requiredEnv("GITHUB_OWNER");
  const repo = requiredEnv("GITHUB_REPO");
  const token = requiredEnv("GITHUB_TOKEN");
  const branch = process.env.GITHUB_BRANCH || "main";
  const gh = githubClient({ owner, repo, token });

  const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`);
  const baseCommitSha = ref.object.sha;
  const baseCommit = await gh(`/git/commits/${baseCommitSha}`);

  const treeEntries = [];
  for (const file of files) {
    const blob = await gh("/git/blobs", {
      method: "POST",
      body: JSON.stringify({
        content: file.content,
        encoding: file.encoding === "base64" ? "base64" : "utf-8",
      }),
    });
    treeEntries.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const tree = await gh("/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: treeEntries,
    }),
  });

  const commit = await gh("/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: `CMS update ${new Date().toISOString()}`,
      tree: tree.sha,
      parents: [baseCommitSha],
    }),
  });

  await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return { sha: commit.sha, files: files.map((file) => file.path) };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const expectedPassword = requiredEnv("ADMIN_PASSWORD");
    if (req.headers["x-admin-password"] !== expectedPassword) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }

    const payload = await readBody(req);
    const files = cleanPayload(payload);
    const result = await commitFiles(files);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
};
