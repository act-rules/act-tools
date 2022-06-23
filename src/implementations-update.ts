import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { getActImplementationReport } from "./map-implementation/get-act-implementation-report";
import { loadJson } from "./utils/load-json";
import {
  ActImplementationReport,
  TestCaseJson,
} from "./map-implementation/types";
import { Implementation } from "./types";
import { createFile, filenameEscape } from "./utils";
import { createRuleImplementation } from "./implementation-update/create-rule-implementation";

export interface CliArgs {
  testCaseJson: string;
  implementations: string;
  outDir: string;
  tableFilePattern: string;
}

export async function cliProgram({
  tableFilePattern,
  testCaseJson: testCasePath,
  implementations: implementationPath,
  outDir,
}: CliArgs): Promise<void> {
  const testCaseJson = (await loadJson(testCasePath)) as TestCaseJson;
  const implementationMappings = await createImplementationMappings(
    implementationPath,
    outDir,
    testCaseJson
  );

  for (const ruleId of getRuleIds(testCaseJson)) {
    const filePath = tableFilePattern.replace("{ruleId}", ruleId);
    const fileText = createRuleImplementation(ruleId, implementationMappings);
    await createFile(filePath, fileText);
  }
}

async function createImplementationMappings(
  implementationPath: string,
  outDir: string,
  testCasesJson: TestCaseJson
): Promise<ActImplementationReport[]> {
  const implementations = loadImplementations(implementationPath);
  const implementationMappings: ActImplementationReport[] = [];

  for (const { name, vendor, report } of implementations) {
    const jsonLd = await loadJson(report);
    const mapping = await getActImplementationReport(
      jsonLd,
      testCasesJson.testcases,
      {
        name,
        vendor,
      }
    );
    const filePath = path.resolve(outDir, `${filenameEscape(name)}.json`);
    console.log(`Writing file ${filePath}`);
    await createFile(filePath, mapping);
    implementationMappings.push(mapping);
  }
  return implementationMappings;
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

function getRuleIds({ testcases }: TestCaseJson): string[] {
  const uniqueIds = new Set<string>();
  testcases.forEach((testcase) => uniqueIds.add(testcase.ruleId));
  return Array.from(uniqueIds);
}
