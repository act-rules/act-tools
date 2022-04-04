import { ActAssertion, ExpectedOutcome, TestCase } from "./types";
import { EarlAssertion } from "./earl/types";
import earlContext from "../map-implementation/earl/earl-context.json";

export type TestData = {
  ruleId: string;
  testcaseId: string;
  ruleName: string;
  procedureName: string;
  testCaseUrl: string;
  earlReport: object;
  assertion: EarlAssertion;
  testCase: TestCase;
  expected: ExpectedOutcome;
  actAssertion: ActAssertion;
};

export function getTestData(input: Partial<TestData> = {}): TestData {
  const ruleId = input.ruleId ?? randomStr(6);
  const ruleName = input.ruleName ?? `Rule ${ruleId}}`;
  const expected: ExpectedOutcome = input.expected ?? "failed";
  const procedureName = input.procedureName ?? "procedure-a";
  const testcaseId = input.testcaseId ?? randomStr(40);
  const testCaseUrl =
    input.testCaseUrl ??
    `https://act-rules.github.io/testcases/${ruleId}/${testcaseId}.html`;
  const assertion: EarlAssertion = input.assertion ?? {
    "@type": "Assertion",
    test: { title: procedureName },
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
    url: testCaseUrl,
    testcaseTitle: `${expected} example 1`,
    relativePath: `/${ruleId}/${testcaseId}.html`,
    rulePage: `http://act-rules.github.io/rules/${ruleId}}`,
    ruleAccessibilityRequirements: {},
  };
  const actAssertion: ActAssertion = {
    ruleId,
    testCaseId: testcaseId,
    testCaseUrl,
    outcome: expected,
    automatic: true,
    procedureName,
  };
  return {
    ruleId,
    actAssertion,
    testcaseId,
    testCaseUrl,
    earlReport,
    assertion,
    testCase,
    ruleName,
    expected,
    procedureName,
  };
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
