import { EarlAssertion } from "./earl/types";
export { TestCaseJson, TestCase, ExpectedOutcome } from "../types";
import { ExpectedOutcome, ActualOutcome } from "../types";

export type SatisfiedRequirement = "satisfied" | "further testing needed";

export type UnsatisfiedRequirement = "not satisfied";

export interface AccessibilityRequirement {
  forConformance: boolean;
  failed: UnsatisfiedRequirement;
  passed: SatisfiedRequirement;
  inapplicable: SatisfiedRequirement;
}

export interface TestFindings {
  url: string;
  expected: ExpectedOutcome;
  actual: ActualOutcome;
  correct: boolean;
  testcase?: string;
}

export type Consistency =
  | "consistent"
  | "partially-consistent"
  | "inconsistent";

export interface SemiImplementation {
  complete: boolean;
  consistency: Consistency;
  findings: TestFindings[];
}

export interface Implementation extends SemiImplementation {
  implementationId: string;
}

export interface PartialImplementationSet {
  complete: boolean;
  consistency: Consistency;
  implementations: Implementation[];
}

export interface ImplementationSet extends PartialImplementationSet {
  ruleId: string;
  ruleName: string;
}

export type AssertionGroup = {
  [propName: string]: EarlAssertion[];
};

export interface ImplementationBase {
  vendor?: string;
  name?: string;
  version?: string;
}

export interface MappingSummary {
  consistent: number;
  partiallyConsistent: number;
  inconsistent: number;
  incomplete: number;
}

export interface ActImplementationMapping extends ImplementationBase {
  summary: MappingSummary;
  actMapping: ImplementationSet[];
}

export type ConsistencyLevel = 'complete' | 'partial' | 'minimal' | null;

export interface ActProcedureMapping {
  procedureName: string
  consistentRequirements: boolean
  ruleId: string,
  testResults: TestResult[]
}

export interface TestResult {
  testcaseId: string,
  expected: ExpectedOutcome
  outcomes: ActualOutcome[]
  automatic?: boolean
}

export type ProcedureCoverage = {
  testCaseTotal: number,
  covered: number,
  automatic: number
}
