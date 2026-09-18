#!/usr/bin/env ts-node
import * as path from "node:path";
import { Octokit } from "@octokit/rest";
import { Command } from "commander";

import { OctokitActBoardClient } from "../approval-report/act-board";
import { loadRuleApprovalRows } from "../approval-report/load-rows";
import {
  OctokitActBoardProjectClient,
  syncActBoardProject,
} from "../approval-report/sync-project";

const program = new Command();
program
  .description(
    "Sync act-board GitHub Project fields from classifier RuleApprovalRow JSON",
  )
  .option(
    "-i, --input <path>",
    "Classifier RuleApprovalRow JSON file",
    path.resolve(process.cwd(), "approval-report.json"),
  )
  .option("--boardOwner <owner>", "act-board repository owner", "act-rules")
  .option("--boardRepo <repo>", "act-board repository name", "act-board")
  .option(
    "--projectOwner <owner>",
    "GitHub organization that owns the Project",
    "act-rules",
  )
  .option(
    "--projectNumber <number>",
    "GitHub Projects v2 number",
    process.env.ACT_BOARD_PROJECT_NUMBER,
  );

program.parse(process.argv);
const options = program.opts();

if (!process.env.GITHUB_TOKEN) {
  console.error(
    "GITHUB_TOKEN is required (GitHub App installation token or PAT with project write).",
  );
  process.exit(1);
}

const projectNumber = Number.parseInt(String(options.projectNumber ?? ""), 10);
if (!Number.isFinite(projectNumber) || projectNumber < 1) {
  console.error(
    "ACT_BOARD_PROJECT_NUMBER or --projectNumber is required and must be a positive integer.",
  );
  process.exit(1);
}

const inputPath = path.resolve(options.input);
const rows = loadRuleApprovalRows(inputPath);
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const issues = new OctokitActBoardClient(octokit);
const project = new OctokitActBoardProjectClient(octokit);

syncActBoardProject(
  rows,
  {
    listBoardIssues: (repository) => issues.listBoardIssues(repository),
    project,
  },
  {
    boardRepository: {
      owner: options.boardOwner,
      repo: options.boardRepo,
    },
    projectOwner: options.projectOwner,
    projectNumber,
  },
)
  .then((result) => {
    console.log(`Synced Project fields: ${JSON.stringify(result)}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
