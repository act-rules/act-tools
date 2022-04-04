import { ActProcedureMapping, ConsistencyLevel, TestResult } from "../types";

export function getConsistency({
  testResults,
  consistentRequirements,
}: ActProcedureMapping): ConsistencyLevel {
  if (hasFalsePositives(testResults)) {
    return null;
  }
  if (
    consistentRequirements &&
    noUntested(testResults) &&
    noFalseNegatives(testResults) &&
    hasTruePositives(testResults)
  ) {
    return "complete";
  }
  if (hasTruePositives(testResults)) {
    return "partial";
  }
  if (hasCantTell(testResults) && inapplicableAllTruePositive(testResults)) {
    return "minimal";
  }
  return null;
}

export function hasFalsePositives(testResults: TestResult[]): boolean {
  return testResults.some(
    ({ expected, outcomes }) =>
      ["passed", "inapplicable"].includes(expected) &&
      outcomes.includes("failed")
  );
}

function noFalseNegatives(testResults: TestResult[]): boolean {
  const falseNegatives = testResults.some(
    ({ expected, outcomes }) =>
      expected === "failed" &&
      outcomes.every((actual) =>
        ["passed", "inapplicable", "untested"].includes(actual)
      )
  );
  return falseNegatives === false;
}

function noUntested(testResults: TestResult[]): boolean {
  const untested = testResults.some(
    ({ outcomes }) => outcomes.includes("untested") || outcomes.length === 0
  );
  return untested === false;
}

function hasCantTell(testResults: TestResult[]): boolean {
  return testResults.some(({ outcomes }) => outcomes.includes("cantTell"));
}

function inapplicableAllTruePositive(testResults: TestResult[]): boolean {
  return testResults.every(
    ({ expected, outcomes }) =>
      expected !== "inapplicable" ||
      outcomes.every((outcome) => ["passed", "inapplicable"].includes(outcome))
  );
}

function hasTruePositives(testResults: TestResult[]): boolean {
  return testResults.some(
    ({ expected, outcomes }) =>
      expected === "failed" && outcomes.includes("failed")
  );
}
