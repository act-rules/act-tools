import { TestCaseResult, ActProcedureMapping } from "../types";

export function getTestCaseResults(
  procedures: ActProcedureMapping[]
): TestCaseResult[] {
  const testCaseResults: TestCaseResult[] = [];
  procedures.forEach(({ procedureName, testResults }) => {
    testResults.forEach((testResult, index) => {
      testCaseResults[index] ??= {
        testcaseId: testResult.testcaseId,
        testCaseName: testResult.testCaseName,
        testCaseUrl: testResult.testCaseUrl,
        testCaseApproved: !!testResult.testCaseApproved,
        expected: testResult.expected,
        procedureResults: [],
      };

      testCaseResults[index].procedureResults.push({
        procedureName,
        outcomes: testResult.outcomes,
      });
    });
  });
  return testCaseResults;
}
