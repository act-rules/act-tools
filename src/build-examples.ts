import * as path from "path";
import { createFile } from "./utils/create-file";
import { getRulePages } from "./utils/get-page-data";
import { copySync } from "fs-extra";
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
  pageUrl: string;
  proposed: boolean;
  testAssetsDir?: string;
}>;

export async function buildExamples({
  rulesDir = ".",
  ruleIds,
  outDir = ".",
  baseUrl = "https://www.w3.org/WAI/content-assets/wcag-act-rules/",
  pageUrl = "https://www.w3.org/WAI/standards-guidelines/act/rules/",
  proposed = false,
  testAssetsDir = ".",
}: BuildExampleOptions): Promise<void> {
  const rulesData = getRulePages(rulesDir, testAssetsDir, ruleIds);
  const testCaseData: TestCaseData[] = [];
  const assetsPath = path.resolve(outDir, "content-assets", "wcag-act-rules");
  for (const ruleData of rulesData) {
    const extractedCases = extractTestCases(
      ruleData,
      baseUrl,
      pageUrl,
      proposed
    );
    testCaseData.push(...extractedCases);
  }

  // Create testcase files
  for (const { codeSnippet, filePath } of testCaseData) {
    const testCasePath = path.resolve(assetsPath, filePath);
    await createFile(testCasePath, codeSnippet);
  }
  console.log(
    `created ${testCaseData.length} test cases in ${path.resolve(
      outDir,
      "content/testcases/"
    )}`
  );

  // Write testcases.json
  const testCasesJson = path.resolve(assetsPath, "testcases.json");
  await updateTestCaseJson(testCasesJson, pageUrl, testCaseData);
  console.log(`Updated ${testCasesJson}`);

  // Copy test assets
  if (testAssetsDir) {
    const targetDir = path.resolve(assetsPath, "test-assets");
    copySync(testAssetsDir, targetDir);
    console.log(`Copied test assets to  ${targetDir}`);
  }
}
