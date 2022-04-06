import { TestCaseResult, ActProcedureMapping } from "../types";

export function getTestCaseResults(
  procedures: ActProcedureMapping[]
): TestCaseResult[] {
  const testCaseResults: TestCaseResult[] = [];
  procedures.forEach(({ procedureName, testResults }) => {
    testResults.forEach(
      (
        { testcaseId, testCaseName, expected, outcomes, testCaseUrl },
        index
      ) => {
        testCaseResults[index] ??= {
          testcaseId,
          testCaseName,
          testCaseUrl,
          expected,
          procedureResults: [],
        };
        testCaseResults[index].procedureResults.push({
          procedureName,
          outcomes,
        });
      }
    );
  });
  return testCaseResults;
}
