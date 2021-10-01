#!/usr/bin/env ts-node
import { Command } from "commander";
import { buildExamples, BuildExampleOptions } from "../build-examples";

const program = new Command();
program
  .option("-i, --ruleIds <id_list>", "comma separated list of IDs", (val) =>
    val.split(",")
  )
  .option("-r, --rulesDir <dirname>", "Path to _rules directory")
  .option("-o, --outDir <dirname>", "Path to output dir")
  .option("-t, --testCaseJson <filepath>", "Path to testcase.json")
  .option(
    "--baseUrl <url>",
    "URL of the site where test cases are save",
    "https://act-rules.github.io"
  );

program.parse(process.argv);
const options = program.opts<BuildExampleOptions>();

buildExamples(options).catch((e) => {
  console.error(e);
  process.exit(1);
});
