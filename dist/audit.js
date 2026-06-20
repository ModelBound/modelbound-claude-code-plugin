import {
  callMcpTool,
  loadConfig
} from "./chunk-WNETRTE4.js";

// scripts/audit.ts
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";
var SECRET_PATTERNS = [
  { name: "OpenAI key", re: /sk-[A-Za-z0-9]{20,}/g },
  { name: "Anthropic key", re: /sk-ant-[A-Za-z0-9-]{20,}/g },
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/g },
  { name: "GitHub token", re: /gh[pousr]_[A-Za-z0-9]{30,}/g },
  { name: "Generic API key", re: /api[_-]?key["'\s:=]+["']?[A-Za-z0-9_\-]{24,}/gi }
];
var INJECTION_PATTERNS = [
  { name: "Prompt-injection: ignore previous", re: /ignore (all )?previous instructions/i },
  { name: "Prompt-injection: act as", re: /you are now (a|an) [A-Z]/i },
  { name: "Tool override", re: /disregard (your )?tools?/i }
];
async function walk(dir, out = []) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory())
      await walk(p, out);
    else if (/\.(md|mdc|json|txt|ya?ml)$/i.test(e.name))
      out.push(p);
  }
  return out;
}
async function main() {
  const root = process.cwd();
  const files = [
    ...await walk(join(root, ".claude")),
    join(root, ".mcp.json"),
    join(root, "CLAUDE.md")
  ];
  const findings = [];
  for (const f of files) {
    let content;
    try {
      content = await fs.readFile(f, "utf8");
    } catch {
      continue;
    }
    const rel = relative(root, f);
    for (const { name, re } of SECRET_PATTERNS) {
      if (re.test(content))
        findings.push({ path: rel, kind: "secret", detail: name });
    }
    for (const { name, re } of INJECTION_PATTERNS) {
      if (re.test(content))
        findings.push({ path: rel, kind: "prompt-injection", detail: name });
    }
    if (rel.endsWith(".mcp.json")) {
      try {
        const cfg2 = JSON.parse(content);
        for (const [name, srv] of Object.entries(cfg2.mcpServers ?? {})) {
          const url = srv?.url ?? "";
          if (url.startsWith("http://"))
            findings.push({ path: rel, kind: "mcp", detail: `${name} uses plaintext HTTP` });
          if (/localhost|127\.0\.0\.1|10\.|192\.168\./.test(url))
            findings.push({ path: rel, kind: "mcp", detail: `${name} points to a private network address` });
        }
      } catch {
      }
    }
  }
  if (findings.length === 0) {
    console.log("Clean. No secrets, injection patterns, or risky MCP URLs found.");
  } else {
    console.log(`Found ${findings.length} finding(s):
`);
    for (const f of findings) {
      console.log(`  [${f.kind}] ${f.path} \u2014 ${f.detail}`);
    }
  }
  const cfg = await loadConfig();
  if (cfg.apiKey) {
    try {
      await callMcpTool(cfg, cfg.apiKey, "audit.log", {
        source: "claude-code-plugin",
        event_type: "audit.scan",
        details: { findings }
      });
    } catch {
    }
  }
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
