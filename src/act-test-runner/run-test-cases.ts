import assert from "assert";
import { TestRunner, TestResult } from "./types";
import { TestCase } from "./test-case";
import EarlReport, {
  EarlSubject,
  AssertionSpec,
} from "../EarlReport/EarlReport";
import { getAssertor } from "./get-assertor";
import type { ActTestRunner } from "./act-test-runner";

const uniqueKey = "::ActRunner:CannotTell::";

export async function runTestCases(
  actRunner: ActTestRunner,
  testCases: TestCase[],
  testRunner: TestRunner
): Promise<EarlReport> {
  const assertor = getAssertor(actRunner.config.implementor);
  const earlReport = new EarlReport(assertor);
  const testCasesByRules = groupTestCasesByRule(testCases);

  for (const ruleTestCases of Object.values(testCasesByRules)) {
    await runRuleTestCases(actRunner, earlReport, testRunner, ruleTestCases);
  }
  return earlReport;
}

async function runRuleTestCases(
  actRunner: ActTestRunner,
  earlReport: EarlReport,
  testRunner: TestRunner,
  ruleTestCases: TestCase[]
): Promise<void> {
  const testCaseRuns: EarlSubject[] = [];
  const proceduresIds = new Set<string>();
  for (const testCase of ruleTestCases) {
    const testCaseRun = await runTestCase(
      actRunner,
      earlReport,
      testRunner,
      testCase
    );
    testCaseRuns.push(testCaseRun);
    testCaseRun.assertions.forEach(({ procedureId }) => {
      if (procedureId !== uniqueKey) {
        proceduresIds.add(procedureId);
      }
    });
  }
  // For each skipped test case, set cantTell for all relevant procedure
  resolveSkippedTests(testCaseRuns, proceduresIds);
  // Ensure that every procedure has an assertion for every test case
  addDefaultAssertions(testCaseRuns, proceduresIds);
}

async function runTestCase(
  actRunner: ActTestRunner,
  earlReport: EarlReport,
  testRunner: TestRunner,
  testCase: TestCase
): Promise<EarlSubject> {
  const testRun = earlReport.addTestRun(testCase.url);
  const procedureIds = actRunner.getProcedureIds(testCase.ruleId);
  const ignoredProcedures = actRunner.getIgnoredProcedures(testCase.ruleId);

  if (
    isSkippedFileType(testCase, actRunner.config.fileTypes) ||
    procedureIds?.length === 0
  ) {
    actRunner.log(`Skipped: ${testCase.testcaseTitle} (${testCase.ruleName})`);
    const cantTellAssertion = getRulelessCantTell();
    return testRun.addAssertion(cantTellAssertion);
  }

  try {
    actRunner.log(`Testing: ${testCase.testcaseTitle} (${testCase.ruleName})`);
    const testRunResults = await testRunner(testCase, procedureIds);
    for (const testRunResult of testRunResults ?? []) {
      const assertionSpec = await testResultToAssertion(
        actRunner,
        testRunResult
      );
      if (!ignoredProcedures.includes(assertionSpec.procedureId)) {
        testRun.addAssertion(assertionSpec);
      }
    }
    return testRun;
  } catch {
    const cantTellAssertion = getRulelessCantTell();
    return testRun.addAssertion(cantTellAssertion);
  }
}

/**
 * Ensure every test case has an assertion for every rule
 */
function addDefaultAssertions(
  testCaseRuns: EarlSubject[],
  proceduresIds: Set<string>
): void {
  for (const testRun of testCaseRuns) {
    for (const procedureId of proceduresIds) {
      if (
        testRun.assertions.every(
          (assertion) => assertion.procedureId !== procedureId
        )
      ) {
        testRun.addAssertion({ outcome: "passed", procedureId });
      }
    }
  }
}

function resolveSkippedTests(
  testCaseRuns: EarlSubject[],
  procedureIds: Set<string>
): void {
  for (const testRun of testCaseRuns) {
    if (
      testRun.assertions.some(({ procedureId }) => procedureId === uniqueKey)
    ) {
      testRun.assertions = []; // Get rid of it
      for (const procedureId of procedureIds) {
        testRun.addAssertion({ outcome: "cantTell", procedureId });
      }
    }
  }
}

async function testResultToAssertion(
  actRunner: ActTestRunner,
  testResult: TestResult
): Promise<AssertionSpec> {
  assertTestResult(testResult);
  if (typeof testResult === "string") {
    return { procedureId: testResult, outcome: "failed" };
  }

  if ("requirementsFromDocs" in testResult) {
    const { outcome, procedureId, requirementsFromDocs } = testResult;
    const requirements = await actRunner.scrapeRequirementsFromDocs(
      requirementsFromDocs
    );
    return { outcome, procedureId, requirements };
  }

  return testResult;
}

function groupTestCasesByRule(
  testCases: TestCase[]
): Record<string, TestCase[]> {
  const testCaseGroups: Record<string, TestCase[]> = {};
  for (const testCase of testCases) {
    testCaseGroups[testCase.ruleId] ??= [];
    testCaseGroups[testCase.ruleId].push(testCase);
  }
  return testCaseGroups;
}

export const getRulelessCantTell = (): AssertionSpec => ({
  procedureId: uniqueKey,
  outcome: "cantTell",
});

function isSkippedFileType(testCase: TestCase, fileTypes?: string[]): boolean {
  const ext = testCase.relativePath.split(".")?.[1];
  return Array.isArray(fileTypes) && fileTypes.includes(ext) === false;
}

function assertTestResult(testResult: any): asserts testResult is TestResult {
  if (typeof testResult === "string") return;
  assert(
    typeof testResult === "object",
    "testResults should be an object or string"
  );
  assert(testResult !== null, "testResults cannot be null");
  assert(
    typeof testResult.outcome === "string",
    "testResults.outcome should be a string"
  );
  const outcomes = ["passed", "failed", "cantTell", "inapplicable"] as const;
  assert(
    outcomes.includes(testResult.outcome),
    `testResults.outcome ${testResult.outcome} must be one of: "${outcomes.join(
      '", "'
    )}"`
  );
  assert(
    typeof testResult.procedureId === "string",
    "testResults.procedureId should be a string"
  );

  if (testResult.wcag2) {
    assert(
      Array.isArray(testResult.wcag2),
      "testResult.wcag2 must be an array of strings"
    );
    assert(
      testResult.wcag2.every((sc: any) => typeof sc === "string"),
      "testResult.wcag2 must be an array of strings"
    );
  }
  if (testResult.requirements) {
    assert(
      Array.isArray(testResult.requirements),
      "testResult.requirements must be an array of strings"
    );
    assert(
      testResult.requirements.every((sc: any) => typeof sc === "string"),
      "testResult.requirements must be an array of strings"
    );
  }
  if (testResult.requirementsFromDocs) {
    assert(
      typeof testResult.requirementsFromDocs === "string",
      "testResults.requirementsFromDocs should be a string"
    );
  }
}
