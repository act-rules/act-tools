import fs from "fs";
import path from "path";
import { promisify } from "util";
import debug from "debug";
import { actMapGenerator } from "./map-implementation/act-map-generator";
import { loadJson } from "./map-implementation/load-json";
import { ToolMetadata, TestCaseJson } from "./map-implementation/types";

const writeFile = promisify(fs.writeFile);

export type CliArgs = ToolMetadata & {
  jsonReports: string[];
  testcases: string;
  output: string;
};

export async function cliProgram({
  organization,
  toolName,
  jsonReports,
  testcases,
  output,
  toolVersion,
}: CliArgs): Promise<void> {
  output = output
    .replace("{organization}", organization || "{organization}")
    .replace("{tool}", toolName || "{tool}");
  const outputPath = path.resolve(process.cwd(), output);
  const meta = { organization, toolName, toolVersion };

  // Load all the JSON files
  const jsonldFiles: object[] = [];
  await Promise.all(
    jsonReports.map(async (report) => {
      try {
        jsonldFiles.push(await loadJson(report));
      } catch (error) {
        debug("loadJson")(
          `Unable to load '${report}', received error:\n${error}`
        );
      }
    })
  );

  const testcaseFile = (await loadJson(testcases)) as TestCaseJson;

  console.log("Loading files");
  const implementationMapping = await actMapGenerator(
    jsonldFiles,
    testcaseFile,
    meta
  );
  const fileContent = JSON.stringify(implementationMapping, null, 2);

  // Save the report
  console.log(`Saved report to ${outputPath}`);
  await writeFile(outputPath, fileContent);
}
