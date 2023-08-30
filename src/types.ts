import { Parent } from "unist";

export type PageBase = {
  body: string;
  markdownAST: Parent;
  filename: string;
};

export type MarkdownPage = PageBase & {
  frontmatter: Record<string, unknown>;
};

export type RulePage = PageBase & {
  frontmatter: RuleFrontMatter;
};

export type DefinitionPage = PageBase & {
  frontmatter: DefinitionFrontMatter;
};

export type RuleFrontMatterBase = {
  id: string;
  name: string;
  rule_type: "atomic" | "composite";
  description: string;
  deprecated?: string;
  accessibility_requirements?: Record<string, AccessibilityRequirement>;
  acknowledgments?: Record<string, string[]>;
};

export type AtomicRuleFrontmatter = RuleFrontMatterBase & {
  rule_type: "atomic";
  input_aspects: string[];
};

export type CompositeRuleFrontmatter = RuleFrontMatterBase & {
  rule_type: "composite";
  input_rules: string[];
};

export type RuleFrontMatter = AtomicRuleFrontmatter | CompositeRuleFrontmatter;

export type DefinitionFrontMatter = {
  title: string;
  key: string;
};

export type ConformanceRequirement = {
  failed: string;
  passed: string;
  inapplicable: string;
  title?: string;
  forConformance?: boolean;
};

export type SecondaryRequirement = {
  secondary: string;
  title?: string;
};

export type AccessibilityRequirement =
  | ConformanceRequirement
  | SecondaryRequirement;

export type Contributor = { name: string; url?: string };

export type ExpectedOutcome = "passed" | "failed" | "inapplicable";
export type ActualOutcome = ExpectedOutcome | "cantTell" | "untested";

export type TestCase = {
  ruleId: string;
  ruleName: string;
  testcaseId: string;
  testcaseTitle: string;
  url: string;
  relativePath: string;
  expected: ExpectedOutcome;
  rulePage: string;
  ruleAccessibilityRequirements:
    | RuleFrontMatter["accessibility_requirements"]
    | null;
  approved?: boolean;
};

export type TestCaseJson = {
  name: string;
  website: string;
  license: string;
  description: string;
  count: number;
  testcases: TestCase[];
};

export interface Implementation {
  name: string;
  vendor: string;
  report: string;
}
