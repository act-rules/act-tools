import fetch from "node-fetch";
import { TestCaseJson } from "../types";
import { TestRunnerConfig, TestRunner, TestResult } from "./types";
import { ActReport } from "./act-report";
import { TestCase } from "./test-case";
import { EarlSubject } from "../EarlReport/EarlSubject";
import EarlReport from "../EarlReport/EarlReport";
import assert from "assert";
import type { AssertionSpec } from "../EarlReport/EarlAssertion";

const uniqueKey = ":;:cantTell:;:";

export class ActTestRunner {
  testCaseJson?: TestCaseJson;
  #config: TestRunnerConfig;
  #earlReport?: EarlReport;

  constructor(config: TestRunnerConfig = {}) {
    this.#config = config;
  }

  async run(testRunner: TestRunner): Promise<ActReport> {
    const testCases = await this.loadTestCases();
    const testCasesByRules = groupTestCasesByRule(testCases);
    this.#earlReport = new EarlReport(this.#config.implementor);
    for (const ruleTestCases of Object.values(testCasesByRules)) {
      await this.#runRuleTestCases(testRunner, ruleTestCases);
    }
    return new ActReport(this.#earlReport, testCases);
  }

  async #runRuleTestCases(
    testRunner: TestRunner,
    ruleTestCases: TestCase[]
  ): Promise<void> {
    const testCaseRuns: EarlSubject[] = [];
    const proceduresIds = new Set<string>();
    for (const testCase of ruleTestCases) {
      const testCaseRun = await this.#runTestCase(testRunner, testCase);
      testCaseRuns.push(testCaseRun);
      testCaseRun.assertions.forEach(({ procedureId }) =>
        proceduresIds.add(procedureId)
      );
    }
    // For each skipped test case, set cantTell for all relevant procedure
    this.#resolveSkippedTests(testCaseRuns, proceduresIds);
    // Ensure that every procedure has an assertion for every test case
    this.#addDefaultAssertions(testCaseRuns, proceduresIds);
  }

  async #runTestCase(
    testRunner: TestRunner,
    testCase: TestCase
  ): Promise<EarlSubject> {
    assert(this.#earlReport);
    const testRun = this.#earlReport.addTestRun(testCase.url);
    if (isSkippedFileType(testCase, this.#config.fileTypes)) {
      this.#log(`Skipped: ${testCase.testcaseTitle} (${testCase.ruleName})`);
      const cantTellAssertion = getRulelessCantTell();
      return testRun.addAssertion(cantTellAssertion);
    }

    try {
      this.#log(`Testing: ${testCase.testcaseTitle} (${testCase.ruleName})`);
      const testRunResults = await testRunner(testCase);
      for (const testRunResult of testRunResults) {
        const assertionSpec = testResultToAssertion(testRunResult);
        testRun.addAssertion(assertionSpec);
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
  #addDefaultAssertions(
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

  #resolveSkippedTests(
    testCaseRuns: EarlSubject[],
    procedureIds: Set<string>
  ): void {
    for (const testRun of testCaseRuns) {
      if (
        testRun.assertions.length !== 1 ||
        testRun.assertions[0].procedureId !== uniqueKey
      ) {
        continue;
      }
      testRun.assertions.shift(); // Get rid of it
      for (const procedureId of procedureIds) {
        testRun.addAssertion({ outcome: "cantTell", procedureId });
      }
    }
  }

  #log(...logMsg: any[]): void {
    if (this.#config.log !== false) {
      console.log(...logMsg);
    }
  }

  async loadTestCases(): Promise<TestCase[]> {
    let testCaseJson = this.#config.testCaseJson;
    if (!testCaseJson) {
      try {
        const response = await fetch(this.getTestCaseJsonUrl());
        testCaseJson = (await response.json()) as TestCaseJson;
      } catch (e) {
        const loadError = new Error(
          `Failed to load test cases from ${this.getTestCaseJsonUrl()}`
        );
        // @ts-ignore
        loadError.cause = e;
        throw loadError;
      }
    }

    const testCases: TestCase[] = [];
    for (const testCaseSpec of testCaseJson.testcases) {
      const testCase = new TestCase(testCaseSpec);
      if (this.testCaseShouldRun(testCase)) {
        testCases.push(testCase);
      }
    }
    return testCases;
  }

  getTestCaseJsonUrl(): string {
    if (this.#config.testCaseJsonUrl) {
      return this.#config.testCaseJsonUrl;
    }
    return [
      "https://raw.githubusercontent.com",
      "w3c/wcag-act-rules",
      this.#config.gitVersion || `publication`, // Branch or hash
      "content-assets/wcag-act-rules/testcases.json",
    ].join("/");
  }

  testCaseShouldRun(testCase: TestCase): boolean {
    if (
      Array.isArray(this.#config.rules) &&
      this.#config.rules.includes(testCase.ruleId) === false
    ) {
      return false;
    }
    return true;
  }
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

const getRulelessCantTell = (): AssertionSpec => ({
  procedureId: uniqueKey,
  outcome: "cantTell",
  wcag2: [],
});

function isSkippedFileType(testCase: TestCase, fileTypes?: string[]): boolean {
  const ext = testCase.relativePath.split(".")?.[1];
  return Array.isArray(fileTypes) && fileTypes.includes(ext) === false;
}

function testResultToAssertion(testResult: TestResult): AssertionSpec {
  if (typeof testResult === "string") {
    return {
      procedureId: testResult,
      outcome: "failed",
      wcag2: [],
    };
  }
  return testResult;
}
