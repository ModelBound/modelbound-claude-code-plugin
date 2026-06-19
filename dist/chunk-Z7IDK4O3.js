// scripts/config.ts
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
function resolveApiKey(cfg) {
  return cfg.apiKey ?? cfg.token ?? process.env.MODELBOUND_API_KEY;
}
var DEFAULTS = {
  mcpUrl: "https://mcp.modelbound.co/mcp",
  authUrl: "https://modelbound.co/api/extension-device-auth",
  hooks: {
    autoSync: true,
    bashGuard: true,
    webFetchGuard: true,
    bashDenylist: [
      "rm\\s+-rf\\s+/",
      "curl[^|]*\\|\\s*sh",
      "wget[^|]*\\|\\s*sh",
      ":\\(\\)\\s*\\{",
      "chmod\\s+-R\\s+777"
    ],
    webFetchAllowlist: []
  }
};
var CONFIG_DIR = join(homedir(), ".modelbound");
var CONFIG_PATH = join(CONFIG_DIR, "config.json");
async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const apiKey = resolveApiKey(parsed);
    return {
      ...DEFAULTS,
      ...parsed,
      ...apiKey ? { apiKey } : {},
      hooks: { ...DEFAULTS.hooks, ...parsed.hooks ?? {} }
    };
  } catch {
    return { ...DEFAULTS };
  }
}
async function saveConfig(cfg) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}
async function requireApiKey() {
  const cfg = await loadConfig();
  const apiKey = resolveApiKey(cfg);
  if (!apiKey) {
    process.stderr.write("Not signed in. Run /mb:sign-in first.\n");
    process.exit(1);
  }
  return { cfg: { ...cfg, apiKey }, apiKey };
}
async function checkApiKey(cfg, apiKey) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 1e4);
  try {
    const res = await fetch(cfg.mcpUrl, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: "auth_whoami", arguments: {} }
      })
    });
    if (res.status === 401 || res.status === 403) {
      return { status: "unauthorized", detail: `HTTP ${res.status}` };
    }
    if (!res.ok) {
      return { status: "network", detail: `HTTP ${res.status}` };
    }
    const ctype = res.headers.get("content-type") ?? "";
    let body = "";
    if (ctype.includes("text/event-stream")) {
      const raw = await res.text();
      const lines = raw.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).filter(Boolean);
      body = lines[lines.length - 1] ?? "";
    } else {
      body = await res.text();
    }
    if (!body)
      return { status: "valid" };
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return { status: "valid" };
    }
    if (parsed?.error) {
      const msg = String(parsed.error.message ?? "").toLowerCase();
      if (msg.includes("unauthor") || msg.includes("invalid api key") || msg.includes("invalid_api_key")) {
        return { status: "unauthorized", detail: parsed.error.message };
      }
      return { status: "network", detail: parsed.error.message };
    }
    const structured = parsed?.result?.structuredContent;
    return { status: "valid", email: structured?.user_email ?? null, teamId: structured?.team_id ?? null };
  } catch (err) {
    return { status: "network", detail: err.message ?? String(err) };
  } finally {
    clearTimeout(timer);
  }
}
async function ensureValidApiKey() {
  const cfg = await loadConfig();
  const apiKey = resolveApiKey(cfg);
  if (!apiKey)
    return { cfg, apiKey: void 0, check: null };
  const check = await checkApiKey(cfg, apiKey);
  if (check.status === "unauthorized") {
    await saveConfig({ ...cfg, apiKey: void 0, token: void 0, email: void 0, activeTeamId: void 0 });
    return { cfg: { ...cfg, apiKey: void 0, token: void 0 }, apiKey: void 0, check };
  }
  return { cfg: { ...cfg, apiKey }, apiKey, check };
}
function extractMcpError(text, structured) {
  const parts = [];
  if (typeof text === "string") {
    if (text.includes("[MCP_ERROR]"))
      parts.push(text.replace(/^\[MCP_ERROR\]\s*/, ""));
    if (text.includes("Pipeline failed:"))
      parts.push(text.trim());
    if (text.includes("Lookup failed:"))
      parts.push(text.trim());
  }
  if (structured && typeof structured === "object" && structured !== null && "error" in structured) {
    const err = structured.error;
    if (typeof err === "string")
      parts.push(err);
    else if (err)
      parts.push(JSON.stringify(err));
  }
  return parts.length ? parts.join("\n") : void 0;
}
function parseToolResult(name, result) {
  if (!result || typeof result !== "object")
    return result;
  const r = result;
  const text = r.content?.map((c) => c.text ?? "").join("\n").trim();
  const structured = r.structuredContent;
  const err = text ? extractMcpError(text, structured) : extractMcpError("", structured);
  if (r.isError || err)
    throw new Error(err ?? text ?? `MCP ${name} failed`);
  if (structured !== void 0)
    return structured;
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  }
  return result;
}
async function callMcpOnce(cfg, apiKey, name, args) {
  const res = await fetch(cfg.mcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args }
    })
  });
  const ctype = res.headers.get("content-type") ?? "";
  let body = "";
  if (ctype.includes("text/event-stream")) {
    const text = await res.text();
    const dataLines = text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).filter(Boolean);
    body = dataLines[dataLines.length - 1] ?? "";
  } else {
    body = await res.text();
  }
  if (!res.ok) {
    let msg = `MCP ${name} failed: HTTP ${res.status}`;
    if (body) {
      try {
        const parsed2 = JSON.parse(body);
        msg = parsed2?.error?.message ?? msg;
      } catch {
        msg = body.slice(0, 500);
      }
    }
    throw new Error(msg);
  }
  if (!body)
    return null;
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (parsed?.error) {
    throw new Error(`MCP ${name}: ${parsed.error.message ?? JSON.stringify(parsed.error)}`);
  }
  return parseToolResult(name, parsed?.result ?? null);
}
async function callMcpTool(cfg, apiKey, name, args, aliases = []) {
  const names = [name, ...aliases];
  let lastErr;
  for (const toolName of names) {
    try {
      return await callMcpOnce(cfg, apiKey, toolName, args);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("Unknown tool"))
        throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`Unknown MCP tool: ${name}`);
}

export {
  loadConfig,
  saveConfig,
  requireApiKey,
  checkApiKey,
  ensureValidApiKey,
  extractMcpError,
  callMcpTool
};
