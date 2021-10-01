import { EarlAssertion } from "./earl/types";
export { TestCaseJson, TestCase, ExpectedOutcome } from "../types";
import { ExpectedOutcome } from "../types";

export type SatisfiedRequirement = "satisfied" | "further testing needed";

export type UnsatisfiedRequirement = "not satisfied";

export interface AccessibilityRequirement {
  forConformance: boolean;
  failed: UnsatisfiedRequirement;
  passed: SatisfiedRequirement;
  inapplicable: SatisfiedRequirement;
}

export type ActualOutcome = ExpectedOutcome | "cantTell" | "untested";

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

export interface ToolMetadata {
  organization?: string;
  toolName?: string;
  toolVersion?: string;
}

export interface MappingSummary {
  consistent: number;
  partiallyConsistent: number;
  inconsistent: number;
  incomplete: number;
}

export interface ActImplementationMapping extends ToolMetadata {
  summary: MappingSummary;
  actMapping: ImplementationSet[];
}
