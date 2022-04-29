import { ActAssertion, TestCase, TestResult } from "../types";
import assert from "assert";

export function getTestResult(
  ruleTestCase: TestCase,
  actAssertions: ActAssertion[]
): TestResult {
  const testResult: TestResult = {
    testcaseId: ruleTestCase.testcaseId,
    testCaseName: ruleTestCase.testcaseTitle,
    testCaseUrl: ruleTestCase.url,
    testCaseApproved: ruleTestCase.approved,
    expected: ruleTestCase.expected,
    outcomes: [],
    automatic: true,
  };
  for (const testCaseAssertion of actAssertions) {
    assert(
      testCaseAssertion.testCaseId === ruleTestCase.testcaseId,
      `Assertion is for testcase ${testCaseAssertion.testCaseId}, not for ${ruleTestCase.testcaseId}`
    );

    testResult.automatic &&=
      testCaseAssertion.automatic &&
      !["cantTell", "untested"].includes(testCaseAssertion.outcome);
    testResult.outcomes.push(testCaseAssertion.outcome);
  }
  if (testResult.outcomes.length === 0) {
    testResult.automatic = false;
    testResult.outcomes.push("untested");
  }
  return testResult;
}
