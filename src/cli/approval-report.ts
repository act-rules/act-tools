#!/usr/bin/env ts-node
import * as path from "node:path";
import { Command } from "commander";

import { runApprovalReport } from "../approval-report/run";
import { ApprovalReportOptions } from "../approval-report/types";

const defaultSibling = (segment: string): string =>
  path.resolve(process.cwd(), "..", segment);

const program = new Command();
program
  .description(
    "List ACT rules ready for WAI approval: updated approved rules, or proposed rules with a complete implementation",
  )
  .option(
    "-r, --rulesDir <path>",
    "Path to act-rules.github.io _rules directory",
    defaultSibling("act-rules.github.io/_rules"),
  )
  .option(
    "-g, --glossaryDir <path>",
    "Path to act-rules.github.io pages/glossary directory",
    defaultSibling("act-rules.github.io/pages/glossary"),
  )
  .option(
    "-t, --testAssetsDir <path>",
    "Path to act-rules.github.io test-assets directory",
    defaultSibling("act-rules.github.io/test-assets"),
  )
  .option(
    "-a, --actRulesRepo <path>",
    "Path to act-rules.github.io git repository root (for git log)",
    defaultSibling("act-rules.github.io"),
  )
  .option(
    "-w, --wcagActRulesDir <path>",
    "Path to wcag-act-rules repository root",
    defaultSibling("wcag-act-rules"),
  )
  .option(
    "-o, --outFile <path>",
    "Output markdown file",
    path.resolve(process.cwd(), "approval-report.md"),
  )
  .option(
    "--githubOwner <owner>",
    "GitHub owner for issues lookup and commit links in report details",
    "act-rules",
  )
  .option(
    "--githubRepo <repo>",
    "GitHub repository name for issues lookup and commit links in report details",
    "act-rules.github.io",
  );

program.parse(process.argv);
const o = program.opts();

const opts: ApprovalReportOptions = {
  rulesDir: path.resolve(o.rulesDir),
  glossaryDir: path.resolve(o.glossaryDir),
  testAssetsDir: path.resolve(o.testAssetsDir),
  actRulesRepo: path.resolve(o.actRulesRepo),
  wcagActRulesDir: path.resolve(o.wcagActRulesDir),
  outFile: path.resolve(o.outFile),
  githubOwner: o.githubOwner,
  githubRepo: o.githubRepo,
};

runApprovalReport(opts).catch((e) => {
  console.error(e);
  process.exit(1);
});
