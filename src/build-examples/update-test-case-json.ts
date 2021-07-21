import { readFileSync } from "fs";
import { createFile } from "../utils/create-file";
import { TestCaseJson } from "../types";
import { TestCaseData } from "./extract-test-cases";

export async function updateTestCaseJson(
  testCaseJsonPath: string,
  baseUrl: string,
  testCaseData: TestCaseData[],
  ruleIds?: string[]
): Promise<TestCaseJson> {
  let testCasesJson: TestCaseJson;
  try {
    if (ruleIds && ruleIds.length) {
      const str = readFileSync(testCaseJsonPath, "utf8");
      testCasesJson = JSON.parse(str) as TestCaseJson;
    }
    // eslint-disable-next-line no-empty
  } catch {}

  testCasesJson ??= {
    name: "ACT-Rules Community test cases",
    website: baseUrl,
    license: "https://act-rules.github.io/pages/license/",
    description: "Accessibility conformance testing rules for HTML",
    count: 0,
    testcases: [],
  };

  const newTestCases = testCaseData.map(({ metadata }) => metadata);
  const filteredTestCases = testCasesJson.testcases.filter((testcase) => {
    return !ruleIds || !ruleIds.includes(testcase.ruleId);
  });

  testCasesJson.testcases = filteredTestCases.concat(newTestCases);
  testCasesJson.count = testCasesJson.testcases.length;

  await createFile(testCaseJsonPath, testCasesJson);
  return testCasesJson;
}
