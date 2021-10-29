import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { actMapGenerator } from "./map-implementation/act-map-generator";

import { loadJson } from "./utils/load-json";
import { TestCaseJson } from "./map-implementation/types";
import { Implementation } from "./types";
import { createFile } from "./utils";

export interface CliArgs {
  testCaseJson: string;
  implementations: string;
  outDir: string;
}

export async function cliProgram({
  testCaseJson,
  implementations: implementationPath,
  outDir,
}: CliArgs): Promise<void> {
  const testCases = (await loadJson(testCaseJson)) as TestCaseJson;
  const implementations = loadImplementations(implementationPath);

  for (const { name, vendor, report } of implementations) {
    const jsonLd = await loadJson(report);
    const mapping = await actMapGenerator(jsonLd, testCases, { name, vendor });
    const filePath = path.resolve(outDir, `${name}.json`);
    console.log(`Writing file ${filePath}`);
    await createFile(filePath, mapping);
  }
}

function loadImplementations(implementationPath: string): Implementation[] {
  const yamlData = yaml.load(fs.readFileSync(implementationPath, "utf8"));
  if (typeof yamlData !== "object" || yamlData === null) {
    return [];
  }
  const implementations: Implementation[] = [];
  Object.entries(yamlData).forEach(([name, { vendor, report }]) => {
    if (typeof vendor === "string" && typeof report === "string") {
      implementations.push({ name, vendor, report });
    } else {
      console.warn(`Failed to load ${name}. Properties missing or invalid`);
    }
  });
  return implementations;
}
