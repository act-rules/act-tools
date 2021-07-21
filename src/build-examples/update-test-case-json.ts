import { readFileSync } from 'fs'
import { createFile } from '../utils/create-file';
import { TestCaseJson } from '../types'
import { TestCaseData } from "./extract-test-cases"

export async function updateTestCaseJson(
  testCaseJsonPath: string,
  baseUrl: string,
  testCaseData: TestCaseData[]
): Promise<TestCaseJson> {
  let testCasesJson: TestCaseJson
  try {
    const str = readFileSync(testCaseJsonPath, 'utf8');
    testCasesJson = JSON.parse(str) as TestCaseJson;
  } catch {
    testCasesJson = {
      name: "ACT-Rules Community test cases",
      website: baseUrl,
      license: "https://act-rules.github.io/pages/license/",
      description: "Accessibility conformance testing rules for HTML",
      count: 0,
      testcases: []
    }
  }

  testCasesJson.testcases = testCasesJson.testcases.concat(
    testCaseData.map(({ metadata }) => metadata)
  );
  testCasesJson.count = testCasesJson.testcases.length;

  await createFile(testCaseJsonPath, testCasesJson);
  return testCasesJson;
}
