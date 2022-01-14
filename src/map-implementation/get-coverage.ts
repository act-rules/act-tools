import { ActualOutcome } from "src/types";
import { ActProcedureMapping, ProcedureCoverage } from "./types";

export function getCoverage(
  { testResults }: ActProcedureMapping
): ProcedureCoverage {
  const testCaseTotal = testResults.length;
  let covered = 0;
  let automatic = 0;
  for (const testResult of testResults) {
    if (isCovered(testResult.outcomes)) {
      covered++;
      if (testResult.outcomes.length !== 0 && !!testResult.automatic) {
        automatic++;
      }
    }
  }
  return { covered, automatic, testCaseTotal }
}

function isCovered(outcomes: ActualOutcome[]): boolean {
  return !outcomes.some(outcome => ['cantTell', 'untested'].includes(outcome))
}