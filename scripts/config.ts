// Shared config + MCP helpers. Mirrors the Cursor extension auth/sync model.
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ModelBoundConfig {
  apiKey?: string;
  activeTeamId?: string;
  email?: string;
  mcpUrl: string;
  authUrl: string;
  hooks: {
    autoSync: boolean;
    bashGuard: boolean;
    webFetchGuard: boolean;
    bashDenylist: string[];
    webFetchAllowlist: string[];
  };
  lastSyncAt?: string;
}

const DEFAULTS: ModelBoundConfig = {
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
      "chmod\\s+-R\\s+777",
    ],
    webFetchAllowlist: [],
  },
};

const CONFIG_DIR = join(homedir(), ".modelbound");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<ModelBoundConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<ModelBoundConfig>;
    return {
      ...DEFAULTS,
      ...parsed,
      hooks: { ...DEFAULTS.hooks, ...(parsed.hooks ?? {}) },
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveConfig(cfg: ModelBoundConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export async function requireApiKey(): Promise<{ cfg: ModelBoundConfig; apiKey: string }> {
  const cfg = await loadConfig();
  if (!cfg.apiKey) {
    process.stderr.write("Not signed in. Run /mb:sign-in first.\n");
    process.exit(1);
  }
  return { cfg, apiKey: cfg.apiKey };
}

/** Call a tool on the ModelBound MCP server (Streamable HTTP). */
export async function callMcpTool<T = unknown>(
  cfg: ModelBoundConfig,
  apiKey: string,
  name: string,
  args: Record<string, unknown>,
): Promise<T | null> {
  const res = await fetch(cfg.mcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  if (!res.ok) {
    throw new Error(`MCP ${name} failed: HTTP ${res.status}`);
  }

  const ctype = res.headers.get("content-type") ?? "";
  let body = "";
  if (ctype.includes("text/event-stream")) {
    const text = await res.text();
    const dataLines = text
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .filter(Boolean);
    body = dataLines[dataLines.length - 1] ?? "";
  } else {
    body = await res.text();
  }
  if (!body) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (parsed?.error) {
    throw new Error(`MCP ${name}: ${parsed.error.message ?? JSON.stringify(parsed.error)}`);
  }
  const result = parsed?.result ?? null;
  if (!result) return null;
  if (result.structuredContent) return result.structuredContent as T;
  const txt = result.content?.[0]?.text;
  if (typeof txt === "string") {
    try { return JSON.parse(txt) as T; } catch { return { text: txt } as T; }
  }
  return result as T;
}
