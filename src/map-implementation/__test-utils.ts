import * as earlContext from "./earl/earl-context.json";
import { EarlAssertion, EarlOutcome } from "./earl/types";
import { getImplementation } from "./get-implementation";
import {
  ExpectedOutcome,
  TestCase,
  Implementation,
  ActualOutcome,
} from "./types.js";

export type TestDataTable = {
  expected: ExpectedOutcome[];
  testcaseIds?: string[];
  ruleId?: string;
  [propName: string]: any; // But really `ActualOutcome[]`
};

/**
 * Create test data from a table of expected / actual(s): Example:
 *
 * testDataFromTables({ // rule0Table
 *   ruleId: 'myRule', // optional
 *   testcaseIds: ['foo', 'bar', 'baz'],
 *   expected: ['passed', 'failed', 'inapplicable'],
 *   impl0: ['passed', 'failed', 'cantTell'],
 * }, rule1Table, rule2Table, ...)
 */
export function testDataFromTables(...args: TestDataTable[]): {
  assertions: EarlAssertion[];
  testcases: TestCase[];
  earl: ReturnType<typeof assertionsToEarl>;
  implementationMaps: ImplementationMap[];
} {
  const assertions: EarlAssertion[] = [];
  const testcases: TestCase[] = [];
  const implementationMaps: ImplementationMap[] = [];

  args.forEach((arg) => {
    const testdata = testDataFromTable(arg);
    assertions.push(...testdata.assertions);
    testcases.push(...testdata.testcases);
    implementationMaps.push(testdata.implementationMap);
  });

  const earl = assertionsToEarl(assertions);
  return { assertions, testcases, earl, implementationMaps };
}

type ImplementationMap = { [propName: string]: Implementation };

/**
 * As testDataFromTables, but for a single table
 */
function testDataFromTable(argsTable: TestDataTable): {
  testcases: TestCase[];
  assertions: EarlAssertion[];
  implementationMap: ImplementationMap;
} {
  const { expected } = argsTable;
  const ruleId = argsTable.ruleId || randomChars();
  const testcaseIds =
    argsTable.testcaseIds || expected.map(() => randomChars());
  const urls = testcaseIds.map((url) => toTestcaseUrl(url, ruleId));

  const testcaseArgs = expected.map(
    (expected, i): SimpleTestcase => [urls[i], expected, ruleId]
  );
  const cases: TestCase[] = toTestcases(...testcaseArgs);
  const asserts: EarlAssertion[] = [];
  const implementationMap: ImplementationMap = {};

  Object.entries(argsTable).forEach(([implementationId, outcomes]) => {
    if (["testcaseIds", "expected", "ruleId"].includes(implementationId)) {
      return; // skip, reserved keys
    }
    const assertArgs = (<ActualOutcome[]>outcomes).map(
      (outcome, i): SimpleAssert => [urls[i], outcome, implementationId]
    );
    const newAsserts = toAssertions(...assertArgs);
    asserts.push(...newAsserts);
    implementationMap[implementationId] = {
      implementationId,
      ...getImplementation(cases, newAsserts),
    };
  });

  return { testcases: cases, assertions: asserts, implementationMap };
}

type SimpleAssert = [string, ActualOutcome, string?];

/**
 * Take [testcaseId, outcome, implementationId][] and create EarlAssertion[]
 */
export function toAssertions(...asserts: SimpleAssert[]): EarlAssertion[] {
  return asserts.map(
    ([testcaseId, outcome, implementationId = "foo"]): EarlAssertion => ({
      "@type": "earl:Assertion",
      subject: { source: toTestcaseUrl(testcaseId) },
      result: { outcome: <EarlOutcome>`earl:${outcome}` },
      test: { title: implementationId },
    })
  );
}

type SimpleTestcase = [string, ExpectedOutcome, string?];

/**
 * Take [testcaseId, expected][] and turn it into { url, expected }[]
 */
export function toTestcases(...cases: SimpleTestcase[]): TestCase[] {
  return cases.map(
    ([testcaseId, expected, ruleId]) =>
      ({
        url: toTestcaseUrl(testcaseId),
        expected,
        ruleId,
      } as TestCase)
  );
}

/**
 * Take testcaseId, ruleId?, and return a valid testcase URL
 */
export function toTestcaseUrl(testcaseId: string, ruleId = "5f99a7"): string {
  if (testcaseId.includes(".html")) {
    return testcaseId;
  }
  const hash = "55f3ed0ec0f324514a0d223b737bc1e4c81593c7";
  return `/${ruleId}/${testcaseId + hash.substr(testcaseId.length)}.html`;
}

/**
 * Convert EarlAssertion[] into JSON-LD
 */
function assertionsToEarl(assertions: EarlAssertion[]): {
  "@context": typeof earlContext;
  "@graph": EarlAssertion[];
} {
  return {
    "@context": earlContext,
    "@graph": assertions,
  };
}

/**
 * Generate a random rule ID
 */
function randomChars(
  length = 6,
  chars = "012356789abcdefghijklmnopqrstuwvxyz"
): string {
  let result = "";
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
