#!/usr/bin/env ts-node
import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";

import { loadRuleApprovalRows } from "../approval-report/load-rows";
import {
  formatSnapshotJson,
  snapshotsEqual,
} from "../approval-report/snapshot";

const program = new Command();
program
  .description(
    "Write data/snapshot.json from classifier JSON only when contents changed",
  )
  .option(
    "-i, --input <path>",
    "Classifier RuleApprovalRow JSON file",
    path.resolve(process.cwd(), "approval-report.json"),
  )
  .option(
    "-o, --outFile <path>",
    "Snapshot path on act-board",
    path.resolve(process.cwd(), "data/snapshot.json"),
  );

program.parse(process.argv);
const options = program.opts();
const inputPath = path.resolve(options.input);
const outFile = path.resolve(options.outFile);
const rows = loadRuleApprovalRows(inputPath);
const next = formatSnapshotJson(rows);
const previous = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : "";

if (snapshotsEqual(previous, next)) {
  console.log(`Snapshot unchanged: ${outFile}`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, next, "utf8");
console.log(`Wrote snapshot ${outFile} (${rows.length} rules)`);
