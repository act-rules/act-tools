#!/usr/bin/env ts-node
import { Command } from "commander";
import { buildExamples, BuildExampleOptions } from "../build-examples";

const program = new Command();
program
  .option("-i, --ruleIds <id_list>", "comma separated list of IDs", (val) =>
    val.split(",")
  )
  .option("-r, --rulesDir <dirname>", "Path to _rules directory")
  .option("-t, --testAssetsDir <dirname>", "Path to test-assets dir")
  .option("-p, --proposed", "Add test cases as 'proposed'")
  .option("-o, --outDir <dirname>", "Path to output dir")
  .option(
    "--baseUrl <url>",
    "URL of the site where test cases are save",
    "https://www.w3.org/WAI/content-assets/wcag-act-rules/"
  )
  .option(
    "--pageUrl <url>",
    "URL of the site where rule pages are save",
    "https://www.w3.org/WAI/standards-guidelines/act/rules/"
  );

program.parse(process.argv);
const options = program.opts<BuildExampleOptions>();

buildExamples(options).catch((e) => {
  console.error(e);
  process.exit(1);
});
