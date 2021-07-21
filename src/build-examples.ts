import * as path from "path";
import { createFile } from "./utils/create-file";
import { getRulePages } from "./utils/get-markdown-data";
import {
  extractTestCases,
  TestCaseData,
} from "./build-examples/extract-test-cases";
import { updateTestCaseJson } from "./build-examples/update-test-case-json";

export type BuildExampleOptions = Partial<{
  rulesDir: string;
  outDir: string;
  ruleIds: string[];
  baseUrl: string;
  testCaseJson: string;
}>;

export async function buildExamples({
  rulesDir = ".",
  ruleIds,
  outDir = ".",
  baseUrl = "https://act-rules.github.io",
  testCaseJson,
}: BuildExampleOptions): Promise<void> {
  const rulesData = getRulePages(rulesDir, ruleIds);
  const testCaseData: TestCaseData[] = [];
  for (const ruleData of rulesData) {
    const extractedCases = extractTestCases(ruleData, { baseUrl });
    testCaseData.push(...extractedCases);
  }

  // Create testcase files
  for (const { codeSnippet, filePath } of testCaseData) {
    const testCasePath = path.resolve(outDir, "content", filePath);
    await createFile(testCasePath, codeSnippet);
  }
  console.log(
    `created ${testCaseData.length} test cases in ${path.resolve(
      outDir,
      "content/testcases/"
    )}`
  );

  // Write testcases.json
  if (testCaseJson) {
    await updateTestCaseJson(testCaseJson, baseUrl, testCaseData, ruleIds);
    console.log(`Updated ${testCaseJson}`);
  }
}
