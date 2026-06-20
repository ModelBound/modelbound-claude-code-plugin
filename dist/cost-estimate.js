// scripts/cost-estimate.ts
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { encode } from "gpt-tokenizer";
var PRICES = {
  "Claude Sonnet 4": { in: 3, out: 15 },
  "Claude Opus 4": { in: 15, out: 75 },
  "Claude Haiku 4": { in: 0.8, out: 4 }
};
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
    else if (/\.(md|mdc|json|txt)$/i.test(e.name))
      out.push(p);
  }
  return out;
}
async function main() {
  let inputTokens = 0;
  for (const f of await walk(join(process.cwd(), ".claude"))) {
    inputTokens += encode(await fs.readFile(f, "utf8")).length;
  }
  const turns = 20;
  const outPerTurn = 1e3;
  console.log(`Context size: ${inputTokens} tokens \xB7 assumed ${turns} turns \xB7 ${outPerTurn} out/turn
`);
  console.log("Model".padEnd(20), "In $".padStart(8), "Out $".padStart(8), "Total".padStart(8));
  for (const [model, p] of Object.entries(PRICES)) {
    const inCost = inputTokens * turns / 1e6 * p.in;
    const outCost = outPerTurn * turns / 1e6 * p.out;
    const total = inCost + outCost;
    console.log(model.padEnd(20), `$${inCost.toFixed(2)}`.padStart(8), `$${outCost.toFixed(2)}`.padStart(8), `$${total.toFixed(2)}`.padStart(8));
  }
}
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
