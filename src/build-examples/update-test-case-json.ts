import { readFileSync } from "fs";
import { createFile } from "../utils/create-file";
import { TestCase, TestCaseJson } from "../types";
import { TestCaseData } from "./extract-test-cases";

export async function updateTestCaseJson(
  testCaseJsonPath: string,
  pageUrl: string,
  testCaseData: TestCaseData[]
): Promise<TestCaseJson> {
  let testCasesJson: TestCaseJson;
  let approvedTestCases: TestCase[] = [];
  const approvedRules = new Set<string>();
  try {
    const str = readFileSync(testCaseJsonPath, "utf8");
    testCasesJson = JSON.parse(str) as TestCaseJson;
    console.log(testCasesJson.testcases.length);
    approvedTestCases = testCasesJson.testcases.filter((testcase) => {
      if (!testcase.approved) {
        return false;
      }
      approvedRules.add(testcase.ruleId);
      return true;
    });
    // eslint-disable-next-line no-empty
  } catch {}

  testCasesJson ??= {
    name: "ACT Task Force test cases",
    website: pageUrl,
    license: "https://act-rules.github.io/pages/license/",
    description: "Accessibility conformance testing rules for HTML",
    count: 0,
    testcases: [],
  };

  const newTestCases = testCaseData
    .map(({ metadata }) => metadata)
    // TEMPORARY; Until we can track approved and proposed test cases
    // of the same rule separately, only include approved test cases
    .filter((testcase) => !approvedRules.has(testcase.ruleId));

  testCasesJson.testcases = approvedTestCases.concat(newTestCases);
  testCasesJson.count = testCasesJson.testcases.length;

  await createFile(testCaseJsonPath, testCasesJson);
  return testCasesJson;
}
