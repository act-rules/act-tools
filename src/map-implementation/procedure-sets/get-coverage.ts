import { ActProcedureMapping, ProcedureCoverage, TestResult } from "../types";

export function getCoverage({
  testResults,
}: ActProcedureMapping): ProcedureCoverage {
  const testCaseTotal = testResults.length;
  let covered = 0;
  for (const testResult of testResults) {
    if (isCovered(testResult)) {
      covered++;
    }
  }
  return { covered, testCaseTotal };
}

function isCovered({ outcomes, expected }: TestResult): boolean {
  if (expected === "failed" && outcomes.includes("failed")) {
    return true; // True positive
  }
  const satisfied = ["passed", "inapplicable"];
  if (
    satisfied.includes(expected) &&
    outcomes.every((outcome) => satisfied.includes(outcome))
  ) {
    return true; // True negative
  }
  return false;
  // return !outcomes.some(outcome => ['cantTell', 'untested'].includes(outcome))
}
