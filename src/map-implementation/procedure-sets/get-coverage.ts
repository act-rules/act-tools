import { ActProcedureMapping, ProcedureCoverage, TestResult } from "../types";

export function getCoverage({
  testResults,
}: ActProcedureMapping): ProcedureCoverage {
  // If there's an approved test case, ignore any proposed test cases
  if (testResults.some(isApproved)) {
    testResults = testResults.filter(isApproved);
  }

  let covered = 0;
  let untested = 0;
  let cantTell = 0;
  for (const testResult of testResults) {
    if (testResult.outcomes.includes("untested")) {
      untested++;
    } else if (testResult.outcomes.includes("cantTell")) {
      cantTell++;
    } else if (isTruePositive(testResult) || isTrueNegative(testResult)) {
      covered++;
    }
  }
  const testCaseTotal = testResults.length;
  return { covered, untested, cantTell, testCaseTotal };
}

function isTruePositive({ outcomes, expected }: TestResult): boolean {
  return expected === "failed" && outcomes.includes("failed");
}

const satisfied = ["passed", "inapplicable"];
function isTrueNegative({ outcomes, expected }: TestResult): boolean {
  return (
    satisfied.includes(expected) &&
    outcomes.every((outcome) => satisfied.includes(outcome))
  );
}

const isApproved = ({ testCaseApproved }: TestResult) => testCaseApproved;
