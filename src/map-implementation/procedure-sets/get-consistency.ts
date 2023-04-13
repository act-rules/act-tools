import {
  ActProcedureMapping,
  ConsistencyLevel,
  TestResult,
  AccessibilityRequirement,
} from "../types";
import { mapsAllRequirements } from "./accessibility-requirements";

export function getConsistency(
  { testResults, failedRequirements }: ActProcedureMapping,
  ruleAccessibilityRequirements?: Record<
    string,
    AccessibilityRequirement
  > | null
): ConsistencyLevel {
  // If there's an approved test case, ignore any proposed test cases
  if (testResults.some(isApproved)) {
    testResults = testResults.filter(isApproved);
  }

  if (hasFalsePositives(testResults)) {
    return null;
  }
  if (
    mapsAllRequirements(failedRequirements, ruleAccessibilityRequirements) &&
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
    return "partial";
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

const isApproved = ({ testCaseApproved }: TestResult) => testCaseApproved;
