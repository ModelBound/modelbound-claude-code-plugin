// Prints the team's AI resource hierarchy as an ASCII tree.
import { callMcpTool, requireApiKey } from "./config.js";

interface TreeFile { path: string; ai_type?: string; name?: string; id?: string }
interface TreeNode { files?: TreeFile[]; [k: string]: unknown }
interface TreeResponse {
  tree?: Record<string, Record<string, TreeFile[] | TreeNode>>;
  platforms?: Record<string, Record<string, TreeFile[]>>;
}

function normalize(data: TreeResponse | null): Record<string, Record<string, TreeFile[]>> {
  if (!data) return {};
  const src = data.platforms ?? data.tree ?? {};
  const out: Record<string, Record<string, TreeFile[]>> = {};
  for (const [platform, roots] of Object.entries(src)) {
    out[platform] = {};
    for (const [root, val] of Object.entries(roots as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        out[platform][root] = val as TreeFile[];
      } else if (val && typeof val === "object" && Array.isArray((val as TreeNode).files)) {
        out[platform][root] = (val as TreeNode).files as TreeFile[];
      } else {
        out[platform][root] = [];
      }
    }
  }
  return out;
}

async function main() {
  const { cfg, apiKey } = await requireApiKey();
  const raw = await callMcpTool<TreeResponse>(cfg, apiKey, "get_resource_tree", {});
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
      console.log(`${lastRoot ? "└──" : "├──"} ${root}/`);
      const files = tree[platform][root];
      files.forEach((f, fi) => {
        const lastFile = fi === files.length - 1;
        const prefix = `${lastRoot ? "    " : "│   "}${lastFile ? "└──" : "├──"}`;
        const label = f.path || f.name || f.id || "(unnamed)";
        const type = f.ai_type ? `  [${f.ai_type}]` : "";
        console.log(`${prefix} ${label}${type}`);
      });
    });
    console.log();
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
