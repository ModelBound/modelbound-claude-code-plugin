import {
  callMcpTool,
  requireApiKey
} from "./chunk-WNETRTE4.js";

// scripts/tree.ts
function normalize(data) {
  if (!data)
    return {};
  const src = data.platforms ?? data.tree ?? {};
  const out = {};
  for (const [platform, roots] of Object.entries(src)) {
    out[platform] = {};
    for (const [root, val] of Object.entries(roots)) {
      if (Array.isArray(val)) {
        out[platform][root] = val;
      } else if (val && typeof val === "object" && Array.isArray(val.files)) {
        out[platform][root] = val.files;
      } else {
        out[platform][root] = [];
      }
    }
  }
  return out;
}
async function main() {
  const { cfg, apiKey } = await requireApiKey();
  const raw = await callMcpTool(cfg, apiKey, "get_resource_tree", {});
  const tree = normalize(raw);
  const platforms = Object.keys(tree).sort();
  if (platforms.length === 0) {
    console.log("No resources found. Push some skills to ModelBound first.");
    return;
  }
  for (const platform of platforms) {
    console.log(platform);
    const roots = Object.keys(tree[platform]).sort();
    roots.forEach((root, ri) => {
      const lastRoot = ri === roots.length - 1;
      console.log(`${lastRoot ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500"} ${root}/`);
      const files = tree[platform][root];
      files.forEach((f, fi) => {
        const lastFile = fi === files.length - 1;
        const prefix = `${lastRoot ? "    " : "\u2502   "}${lastFile ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500"}`;
        const label = f.path || f.name || f.id || "(unnamed)";
        const type = f.ai_type ? `  [${f.ai_type}]` : "";
        console.log(`${prefix} ${label}${type}`);
      });
    });
    console.log();
  }
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
