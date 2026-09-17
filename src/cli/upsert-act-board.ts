#!/usr/bin/env ts-node
import * as fs from "node:fs";
import * as path from "node:path";
import { Octokit } from "@octokit/rest";
import { Command } from "commander";

import {
  OctokitActBoardClient,
  upsertActBoardIssues,
} from "../approval-report/act-board";
import { RuleApprovalRow } from "../approval-report/types";

const program = new Command();
program
  .description(
    "Upsert generated rule issues and blocker sub-issues in act-rules/act-board",
  )
  .option(
    "-i, --input <path>",
    "Classifier RuleApprovalRow JSON file",
    path.resolve(process.cwd(), "approval-report.json"),
  )
  .option("--boardOwner <owner>", "act-board repository owner", "act-rules")
  .option("--boardRepo <repo>", "act-board repository name", "act-board")
  .option("--cgOwner <owner>", "Community Group repository owner", "act-rules")
  .option(
    "--cgRepo <repo>",
    "Community Group repository name",
    "act-rules.github.io",
  );

program.parse(process.argv);
const options = program.opts();
const inputPath = path.resolve(options.input);
const rows = readRows(inputPath);
const client = new OctokitActBoardClient(
  new Octokit({ auth: process.env.GITHUB_TOKEN }),
);

upsertActBoardIssues(rows, client, {
  boardRepository: {
    owner: options.boardOwner,
    repo: options.boardRepo,
  },
  cgRepository: {
    owner: options.cgOwner,
    repo: options.cgRepo,
  },
})
  .then((result) => {
    console.log(`Processed ${rows.length} rules: ${JSON.stringify(result)}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

function readRows(filePath: string): RuleApprovalRow[] {
  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (
    !Array.isArray(parsed) ||
    parsed.some(
      (row) =>
        typeof row !== "object" ||
        row === null ||
        typeof (row as { ruleId?: unknown }).ruleId !== "string",
    )
  ) {
    throw new Error(`${filePath} is not a RuleApprovalRow JSON array`);
  }
  return parsed as RuleApprovalRow[];
}
