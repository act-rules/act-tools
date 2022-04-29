import {
  ActAssertion,
  ActProcedureMapping,
  ActualOutcome,
  ExpectedOutcome,
  TestCase,
  TestResult,
} from "./types";
import { EarlAssertion } from "./earl/types";
import earlContext from "./earl/earl-context.json";

export type TestData = {
  ruleId: string;
  testcaseId: string;
  testCaseName: string;
  testCaseApproved: boolean;
  testResult: TestResult;
  ruleName: string;
  procedureName: string;
  testCaseUrl: string;
  earlReport: object;
  assertion: EarlAssertion;
  testCase: TestCase;
  expected: ExpectedOutcome;
  actAssertion: ActAssertion;
  outcomes: ActualOutcome[];
  procedure: ActProcedureMapping;
  failedRequirements: string[];
};

export function getTestData(input: Partial<TestData> = {}): TestData {
  const ruleId = input.ruleId ?? randomStr(6);
  const ruleName = input.ruleName ?? `Rule ${ruleId}}`;
  const expected: ExpectedOutcome = input.expected ?? "failed";
  const procedureName = input.procedureName ?? "procedure-a";
  const testcaseId = input.testcaseId ?? randomStr(40);
  const testCaseApproved = input.testCaseApproved ?? true;
  const failedRequirements = input.failedRequirements ?? [
    "WCAG2:name-role-value",
  ];
  const testCaseName = `${expected} example X`;
  const testCaseUrl =
    input.testCaseUrl ??
    `https://act-rules.github.io/testcases/${ruleId}/${testcaseId}.html`;
  const assertion: EarlAssertion = input.assertion ?? {
    "@type": "Assertion",
    test: { title: procedureName, isPartOf: failedRequirements },
    subject: { source: testCaseUrl },
    result: { outcome: `earl:${expected}` },
  };
  const earlReport = input.earlReport ?? {
    "@context": earlContext["@context"],
    "@type": "TestSubject",
    "@graph": [assertion],
  };
  const testCase: TestCase = input.testCase ?? {
    ruleId,
    testcaseId,
    ruleName,
    expected,
    approved: testCaseApproved,
    url: testCaseUrl,
    testcaseTitle: testCaseName,
    relativePath: `/${ruleId}/${testcaseId}.html`,
    rulePage: `http://act-rules.github.io/rules/${ruleId}}`,
    ruleAccessibilityRequirements: {
      "wcag20:4.1.2": {
        failed: "not satisfied",
        passed: "further testing needed",
        inapplicable: "further testing needed",
      },
    },
  };
  const actAssertion: ActAssertion = {
    ruleId,
    testCaseId: testcaseId,
    testCaseUrl,
    outcome: expected,
    automatic: true,
    procedureName,
    accessibilityRequirements: failedRequirements,
  };
  const outcomes = [expected];
  const automatic = true;
  const testResult: TestResult = {
    testcaseId,
    testCaseName,
    testCaseApproved,
    expected,
    outcomes,
    automatic,
    testCaseUrl,
  };
  const procedure: ActProcedureMapping = {
    procedureName,
    failedRequirements,
    testResults: [testResult],
  };
  return {
    ruleId,
    actAssertion,
    testcaseId,
    testCaseName,
    testCaseUrl,
    testCaseApproved,
    testResult,
    earlReport,
    assertion,
    testCase,
    ruleName,
    expected,
    procedureName,
    outcomes,
    procedure,
    failedRequirements,
  };
}

export function toTestResult(partial: Partial<TestResult>): TestResult {
  return {
    testcaseId: randomStr(40),
    testCaseName: "Passed example 1",
    testCaseUrl: "",
    expected: "passed",
    testCaseApproved: partial.testCaseApproved ?? true,
    outcomes: [partial.expected ?? "passed"],
    ...partial,
  };
}

export function toTestResults(partials: Partial<TestResult>[]): TestResult[] {
  return partials.map(toTestResult);
}

export function randomStr(
  length: number,
  chars = "0123456789abcdefghijklmnopqrstuvwxyz"
): string {
  let randStr = "";
  for (let i = length; i > 0; i--) {
    randStr += chars[Math.floor(Math.random() * chars.length)];
  }
  return randStr;
}
