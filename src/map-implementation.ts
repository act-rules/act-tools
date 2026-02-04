import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { getActImplementationReport } from "./map-implementation/get-act-implementation-report";
import { loadJson } from "./utils/load-json";
import { ImplementationBase, TestCaseJson } from "./map-implementation/types";

const writeFile = promisify(fs.writeFile);

export type CliArgs = ImplementationBase & {
  jsonReport: string;
  testCaseJson: string;
  output: string;
};

export async function cliProgram({
  vendor,
  name,
  jsonReport,
  testCaseJson,
  output,
  version,
}: CliArgs): Promise<void> {
  output = output
    .replace("{vendor}", vendor || "{vendor}")
    .replace("{name}", name || "{name}");
  const outputPath = path.resolve(process.cwd(), output);
  const meta = { vendor, name, version };

  const earlReportFile = await loadJson(jsonReport);

  const testCaseFile = await loadJson<TestCaseJson>(testCaseJson);

  console.log("Loading files");
  const implementationReport = await getActImplementationReport(
    earlReportFile,
    testCaseFile.testcases,
    meta
  );
  const fileContent = JSON.stringify(implementationReport, null, 2);

  // Save the report
  console.log(`Saved report to ${outputPath}`);
  await writeFile(outputPath, fileContent, "utf8");
}
