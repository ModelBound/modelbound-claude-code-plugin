// Rough per-session cost across Claude tiers, based on current .claude/ context size.
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { encode } from "gpt-tokenizer";

const PRICES: Record<string, { in: number; out: number }> = {
  "Claude Sonnet 4":  { in: 3.00,  out: 15.00 },
  "Claude Opus 4":    { in: 15.00, out: 75.00 },
  "Claude Haiku 4":   { in: 0.80,  out: 4.00 },
};

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  let entries: import("node:fs").Dirent[] = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (/\.(md|mdc|json|txt)$/i.test(e.name)) out.push(p);
  }
  return out;
}

async function main() {
  let inputTokens = 0;
  for (const f of await walk(join(process.cwd(), ".claude"))) {
    inputTokens += encode(await fs.readFile(f, "utf8")).length;
  }
  // Assume a 20-turn session with 1k output per turn, replaying context each turn.
  const turns = 20;
  const outPerTurn = 1000;
  console.log(`Context size: ${inputTokens} tokens · assumed ${turns} turns · ${outPerTurn} out/turn\n`);
  console.log("Model".padEnd(20), "In $".padStart(8), "Out $".padStart(8), "Total".padStart(8));
  for (const [model, p] of Object.entries(PRICES)) {
    const inCost = (inputTokens * turns / 1_000_000) * p.in;
    const outCost = (outPerTurn * turns / 1_000_000) * p.out;
    const total = inCost + outCost;
    console.log(model.padEnd(20), `$${inCost.toFixed(2)}`.padStart(8), `$${outCost.toFixed(2)}`.padStart(8), `$${total.toFixed(2)}`.padStart(8));
  }
}

main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
