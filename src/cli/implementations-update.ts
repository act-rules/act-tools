#!/usr/bin/env ts-node
import { cliProgram, CliArgs } from "../implementations-update";
import { Command } from "commander";

const program = new Command();
program
  .usage("Usage: $0 --jsonReports ./reports/**.json [options]")
  .option(
    "-t, --testCaseJson <url>",
    "ACT Rules testcases",
    "https://act-rules.github.io/testcases.json"
  )
  .option(
    "-i, --implementations <path>",
    "Implementations YAML file path",
    "./implementations.yml"
  )
  .option(
    "-p, --tableFilePattern <path>",
    "Pattern for the filename of implementation tables",
    "./implementations/{ruleId}.md"
  )
  .option("-o, --outDir <dirname>", "Path to output dir");

program.parse(process.argv);
const options = program.opts<CliArgs>();

cliProgram(options).catch((e) => {
  console.error(e);
  process.exit(1);
});
