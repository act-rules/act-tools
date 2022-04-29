import { readFileSync } from "fs";
import { createFile } from "../utils/create-file";
import { TestCaseJson } from "../types";
import { TestCaseData } from "./extract-test-cases";

export async function updateTestCaseJson(
  testCaseJsonPath: string,
  pageUrl: string,
  testCaseData: TestCaseData[]
): Promise<TestCaseJson> {
  let testCasesJson: TestCaseJson;
  try {
    const str = readFileSync(testCaseJsonPath, "utf8");
    testCasesJson = JSON.parse(str) as TestCaseJson;
    testCasesJson.testcases = testCasesJson.testcases.filter((testcase) => {
      return testcase.approved;
    });
  } catch {
    testCasesJson = {
      name: "ACT Task Force test cases",
      website: pageUrl,
      license: "https://act-rules.github.io/pages/license/",
      description: "Accessibility conformance testing rules for HTML",
      count: 0,
      testcases: [],
    };
  }

  testCaseData.forEach(({ metadata: testcase }) => {
    const isExistingTestCase = testCasesJson.testcases.some(
      ({ testcaseId, ruleId }) =>
        testcaseId === testcase.testcaseId && ruleId === testcase.ruleId
    );

    if (!isExistingTestCase) {
      testCasesJson.testcases.push(testcase);
    }
  });

  testCasesJson.count = testCasesJson.testcases.length;
  await createFile(testCaseJsonPath, testCasesJson);
  return testCasesJson;
}
