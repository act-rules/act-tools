#!/usr/bin/env ts-node
import { cliProgram, CliArgs } from "../map-implementation";
import { Command } from "commander";

const program = new Command();
program
  .usage("Usage: $0 --jsonReports ./reports/**.json [options]")
  .option("-j, --jsonReports <filepath>", "Implementation report")
  .option(
    "-t, --testcases <url>",
    "ACT Rules testcases",
    "https://act-rules.github.io/testcases.json"
  )
  .option(
    "-o, --output <filepath>",
    "Output directory for mapped results",
    "./{tool}-mapping.json"
  )
  .option(
    "-O, --organization <name>",
    "Organization, submitting the implementation report",
    "unknown"
  )
  .option(
    "-T, --toolName <name>",
    "Tool which was used to generate the implementation report",
    "unknown"
  )
  .option("-V, --toolVersion <version>", "Version of the tool", "latest");

program.parse(process.argv);
const options = program.opts<CliArgs>();

cliProgram(options).catch((e) => {
  console.error(e);
  process.exit(1);
});
