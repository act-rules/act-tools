#!/usr/bin/env ts-node
import { cliProgram, CliArgs } from "../map-implementation";
import { Command } from "commander";

const program = new Command();
program
  .usage("Usage: $0 --jsonReports ./reports/**.json [options]")
  .option("-j, --jsonReports <filepath>", "Implementation report", (val) =>
    Array.isArray(val) ? val : [val]
  )
  .option(
    "-t, --testCaseJson <url>",
    "ACT Rules testcases",
    "https://act-rules.github.io/testcases.json"
  )
  .option(
    "-o, --output <filepath>",
    "Output directory for mapped results",
    "./{name}-mapping.json"
  )
  .option(
    "-v, --vendor <name>",
    "Organization, submitting the implementation report",
    "unknown"
  )
  .option("-n, --name <name>", "Name of the implementation", "unknown")
  .option(
    "-V, --version <version.number>",
    "Version of the implementation",
    "latest"
  );

program.parse(process.argv);
const options = program.opts<CliArgs>();

cliProgram(options).catch((e) => {
  console.error(e);
  process.exit(1);
});
