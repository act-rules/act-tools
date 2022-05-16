import { EarlAssertion } from "./earl/types";
import { ExpectedOutcome, ActualOutcome } from "../types";

export {
  TestCaseJson,
  TestCase,
  ExpectedOutcome,
  ActualOutcome,
  AccessibilityRequirement,
} from "../types";

export type ConsistencyTypes = "complete" | "partial" | "minimal";

export type ConsistencyLevel = ConsistencyTypes | null;

export type SatisfiedRequirement = "satisfied" | "further testing needed";

export type UnsatisfiedRequirement = "not satisfied";

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

export interface ActAssertion {
  ruleId: string;
  testCaseId: string;
  testCaseUrl: string;
  outcome: ActualOutcome;
  automatic: boolean;
  procedureName: string;
  accessibilityRequirements?: string[];
}

export interface ActImplementationMeta {
  name?: string;
  vendor?: string;
  version?: string;
}

export type RuleStats = Record<
  ConsistencyTypes | "inconsistent" | "untested",
  number
>;

export interface ActImplementationReport extends ActImplementationMeta {
  approvedRules: RuleStats;
  proposedRules: RuleStats;
  actRuleMapping: ActProcedureSet[];
}

export interface ActProcedureSet extends PartialActProcedureSet {
  ruleId: string;
  ruleName: string;
  ruleApproved: boolean;
}

export interface PartialActProcedureSet {
  procedureNames: string[];
  consistency: ConsistencyLevel | null;
  accessibilityRequirements?: {
    correct?: boolean; // TODO, not optional
    expected: string[];
    reported: string[];
  };
  coverage: ProcedureCoverage | null;
  testCaseResults: TestCaseResult[];
}

export interface TestCaseResult {
  testCaseName: string;
  testcaseId: string;
  testCaseUrl: string;
  testCaseApproved: boolean;
  expected: string;
  procedureResults: {
    procedureName: string;
    outcomes: ActualOutcome[];
  }[];
}

export interface ActProcedureMapping {
  procedureName: string;
  failedRequirements: string[];
  testResults: TestResult[];
}

export interface TestResult {
  testcaseId: string;
  testCaseName: string;
  testCaseUrl: string;
  testCaseApproved?: boolean;
  expected: ExpectedOutcome;
  outcomes: ActualOutcome[];
  automatic?: boolean;
}

export type ProcedureCoverage = {
  testCaseTotal: number;
  covered: number;
  untested: number;
  cantTell: number;
};
