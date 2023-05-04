import assert from "assert";
import { writeFileSync, existsSync, readFileSync } from "fs";
import fetch from "node-fetch";
import {
  TestRunnerConfig,
  TestRunner,
  ReportOptions,
  TestCaseJson,
} from "./types";
import { ActReport } from "./act-report";
import { TestCase } from "./test-case";
import EarlReport from "../EarlReport/EarlReport";
import { scrapeRequirements } from "./scrape-requirements";
import { getRulelessCantTell, runTestCases } from "./run-test-cases";
import { getRuleMapping, RuleMapping } from "./get-rule-mapping";

export class ActTestRunner {
  testCaseJson?: TestCaseJson;
  #config: TestRunnerConfig;
  #earlReport?: EarlReport;
  #scrapeCache: Record<string, string[]> = {};
  #ignoredProcedures: Record<string, string[]> = {};
  #reportOptions: ReportOptions = { noSummary: true };
  #ruleMapping?: RuleMapping;

  constructor(config: TestRunnerConfig = {}) {
    this.#config = config;
  }

  get config(): TestRunnerConfig {
    return this.#config;
  }

  setRules(rules: string[] | undefined): void {
    this.#config.rules = rules;
  }

  ignoreProcedures(procedureIds: string[]): void {
    this.#ignoredProcedures["*"] = procedureIds;
  }

  ignoreProceduresForRule(ignoredProcedures: Record<string, string[]>): void {
    this.#ignoredProcedures = {
      "*": this.#ignoredProcedures["*"],
      ...ignoredProcedures,
    };
  }

  getIgnoredProcedures(actRuleId: string): string[] {
    return [
      ...(this.#ignoredProcedures["*"] ?? []),
      ...(this.#ignoredProcedures[actRuleId] ?? []),
    ];
  }

  async run(testRunner: TestRunner): Promise<ActReport> {
    testRunner = wrapWithTimeout(testRunner, this.#config.timeout);
    const ruleMappingPath = this.#reportOptions.ruleMapping;

    if (ruleMappingPath && existsSync(ruleMappingPath)) {
      this.#ruleMapping = JSON.parse(
        readFileSync(ruleMappingPath, "utf8")
      ) as RuleMapping;
    }

    const testCases = await this.loadTestCases();
    this.#earlReport = await runTestCases(this, testCases, testRunner);
    return this.#runReporting(testCases);
  }

  setReporting(options: ReportOptions): void {
    this.#reportOptions = options;
  }

  getProcedureIds(ruleId: string): string[] | undefined {
    if (!this.#ruleMapping?.[ruleId]) {
      return undefined;
    }
    return this.#ruleMapping[ruleId].procedureNames;
  }

  #runReporting(testCases: TestCase[]): ActReport {
    assert(this.#earlReport, "earlReport must exist before creating report");
    const options = this.#reportOptions;
    const actReport = new ActReport(this.#earlReport, testCases);
    const implReport = actReport.getImplementationMapping();

    if (options.earlReport) {
      const earlText = JSON.stringify(actReport.getEarlReport(), null, 2);
      writeFileSync(options.earlReport, earlText, "utf8");
      console.log(`Created EARL report at ${options.earlReport}`);
    }

    if (options.actReport) {
      const mappingText = JSON.stringify(implReport, null, 2);
      writeFileSync(options.actReport, mappingText, "utf8");
      console.log(`Created ACT mapping at ${options.actReport}`);
    }

    if (options.ruleMapping) {
      const ruleMapping = getRuleMapping(implReport);
      const ruleMappingJson = JSON.stringify(ruleMapping, null, 2);
      writeFileSync(options.ruleMapping, ruleMappingJson, "utf8");
    }

    if (!options.noSummary) {
      const { approvedRules, proposedRules } = implReport;
      console.table({
        "Approved rules": approvedRules,
        "Proposed rules": proposedRules,
      });
    }
    return actReport;
  }

  log(...logMsg: any[]): void {
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

  /**
   * Scrape a rule documentation page to work out which WCAG criteria and
   * other accessibility requirements are referenced. Scraping is done by
   * looking for links to WCAG understanding documents.
   *
   * @param {string} url
   * @returns {Promise<string[]>}
   */
  async scrapeRequirementsFromDocs(url: string): Promise<string[]> {
    if (!this.#scrapeCache[url]) {
      try {
        this.#scrapeCache[url] = await scrapeRequirements(url);
      } catch {
        this.#scrapeCache[url] = [];
      }
    }
    return this.#scrapeCache[url];
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

function wrapWithTimeout(testRunner: TestRunner, timeout = 2000): TestRunner {
  return async (testCase, procedureIds) => {
    const runner = testRunner(testCase, procedureIds);
    const timer: ReturnType<TestRunner> = new Promise((resolve) => {
      setTimeout(() => {
        resolve([getRulelessCantTell()]);
      }, timeout);
    });
    return Promise.race([runner, timer]);
  };
}
