import fs from "fs";
import path from "path";
import { promisify } from "util";
import debug from "debug";
import { actMapGenerator } from "./map-implementation/act-map-generator";
import { loadJson } from "./utils/load-json";
import { ImplementationBase, TestCaseJson } from "./map-implementation/types";

const writeFile = promisify(fs.writeFile);

export type CliArgs = ImplementationBase & {
  jsonReports: string[];
  testCaseJson: string;
  output: string;
};

export async function cliProgram({
  vendor,
  name,
  jsonReports,
  testCaseJson,
  output,
  version,
}: CliArgs): Promise<void> {
  output = output
    .replace("{vendor}", vendor || "{vendor}")
    .replace("{name}", name || "{name}");
  const outputPath = path.resolve(process.cwd(), output);
  const meta = { vendor, name, version };

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

  const testCaseFile = (await loadJson(testCaseJson)) as TestCaseJson;

  console.log("Loading files");
  const implementationMapping = await actMapGenerator(
    jsonldFiles,
    testCaseFile,
    meta
  );
  const fileContent = JSON.stringify(implementationMapping, null, 2);

  // Save the report
  console.log(`Saved report to ${outputPath}`);
  await writeFile(outputPath, fileContent, "utf8");
}
