import { ActProcedureMapping, ConsistencyLevel, TestResult } from "./types";

export function getConsistency(
  { testResults, consistentRequirements }: ActProcedureMapping
): ConsistencyLevel {
  if (hasFalsePositives(testResults)) {
    return null;
  }
  const applicableOutcomes = hasApplicableOutcomes(testResults);

  if (
    consistentRequirements &&
    applicableOutcomes &&
    noFalseNegatives(testResults) && 
    noUntested(testResults)
  ) {
    return 'complete'
  }
  if (applicableOutcomes) {
    return 'partial'
  }
  if (hasInapplicableOutcomes(testResults)) {
    return 'minimal';
  }
  return null;
}

export function hasFalsePositives(testResults: TestResult[]) {
  return testResults.some(({ expected, outcomes }) => (
    ['passed', 'inapplicable'].includes(expected) &&
    outcomes.includes('failed')
  ));
}

function noFalseNegatives(testResults: TestResult[]) {
  const falseNegatives = testResults.some(({ expected, outcomes }) => (
    expected === 'failed' && 
    outcomes.every(actual => ['passed', 'inapplicable', 'untested'].includes(actual))
  ))
  return falseNegatives === false;
}

function noUntested(testResults: TestResult[]) {
  const untested = testResults.some(({ outcomes }) => (
    outcomes.includes('untested') || outcomes.length === 0
  ))
  return untested === false;
}

function hasApplicableOutcomes(testResults: TestResult[]) {
  return testResults.some(({ expected, outcomes }) => (
    ['passed', 'failed'].includes(expected) &&
    outcomes.some(actual => !['untested', 'cantTell'].includes(actual))
  ));
}

function hasInapplicableOutcomes(testResults: TestResult[]) {
  return testResults.some(({ expected, outcomes }) => (
    expected === 'inapplicable' &&
    outcomes.some(actual => !['untested', 'cantTell'].includes(actual))
  ));
}
