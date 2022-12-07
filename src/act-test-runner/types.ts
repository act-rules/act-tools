import { TestCaseJson } from "../types";
import { AssertionSpec } from "../EarlReport/EarlAssertion";
import { AssertorSpec } from "../EarlReport/EarlAssertor";
import type { TestCase } from "./test-case";

export { TestCaseJson } from "../types";

export type ReportOptions = {
  earlReport?: string;
  actReport?: string;
  ruleMapping?: string;
  noSummary?: boolean;
};

export type TestRunnerConfig = {
  implementor?: AssertorSpec | string;
  rules?: string[];
  fileTypes?: string[];
  testCaseJson?: TestCaseJson;
  log?: boolean;
  gitVersion?: string;
  testCaseJsonUrl?: string;
};

export type TestRunner = (
  testCase: TestCase,
  procedureIds?: string[]
) => Promise<TestResult[] | void | undefined>;

export type AssertionFromDocs = {
  outcome: AssertionSpec["outcome"];
  procedureId: AssertionSpec["procedureId"];
  requirementsFromDocs: string;
};

export type TestResult = string | AssertionSpec | AssertionFromDocs;
