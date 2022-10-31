import { TestCaseJson } from "../types";
import { AssertionSpec } from "../EarlReport/EarlAssertion";
import { AssertorSpec } from "../EarlReport/EarlAssertor";
import type { TestCase } from "./test-case";

export type TestRunnerConfig = {
  implementor?: AssertorSpec;
  rules?: string[];
  fileTypes?: string[];
  testCaseJson?: TestCaseJson;
  log?: boolean;
  gitVersion?: string;
  testCaseJsonUrl?: string;
};

export type TestRunner = (testCase: TestCase) => Promise<TestResult[]>;

export type TestResult = string | AssertionSpec;
