#!/usr/bin/env ts-node
import * as path from "node:path";
import { Octokit } from "@octokit/rest";
import { Command } from "commander";

import {
  OctokitActBoardClient,
  upsertActBoardIssues,
} from "../approval-report/act-board";
import { loadRuleApprovalRows } from "../approval-report/load-rows";

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

if (!process.env.GITHUB_TOKEN) {
  console.error(
    "GITHUB_TOKEN is required (GitHub App installation token or PAT).",
  );
  process.exit(1);
}

const inputPath = path.resolve(options.input);
const rows = loadRuleApprovalRows(inputPath);
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
