import {
  ActProcedureMapping,
  ActAssertion,
  TestCase,
  TestResult,
} from "../types";
import { getTestResult } from "./get-test-result";

/**
 * Get an ACT procedure mapping for test cases belonging to the same rule
 */
export function getRuleProcedureMapping(
  ruleTestCases: TestCase[],
  ruleAssertions: ActAssertion[]
): ActProcedureMapping[] {
  const procedureMappings: ActProcedureMapping[] = [];
  const assertionGroups = groupAssertionsByProcedure(ruleAssertions);
  for (const [procedureName, procedureAssertions] of assertionGroups) {
    const testResults = getTestResults(ruleTestCases, procedureAssertions);
    const consistentRequirements = true; // Assumed true for now
    procedureMappings.push({
      procedureName,
      consistentRequirements,
      testResults,
    });
  }
  return procedureMappings;
}

export function getTestResults(
  ruleTestCases: TestCase[],
  procedureAssertions: ActAssertion[]
): TestResult[] {
  const testResults: TestResult[] = [];
  for (const ruleTestCase of ruleTestCases) {
    const testCaseAssertions = procedureAssertions.filter(
      (actAssertion) => actAssertion.testCaseId === ruleTestCase.testcaseId
    );
    const testResult = getTestResult(ruleTestCase, testCaseAssertions);
    testResults.push(testResult);
  }
  return testResults;
}

export function groupAssertionsByProcedure(
  actAssertions: ActAssertion[]
): [string, ActAssertion[]][] {
  const assertionGroup: Record<string, ActAssertion[]> = {};
  actAssertions.forEach((actAssertions) => {
    assertionGroup[actAssertions.procedureName] ??= [];
    assertionGroup[actAssertions.procedureName].push(actAssertions);
  });
  return Object.entries(assertionGroup);
}
