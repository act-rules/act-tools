import {
  TestCase as TestCaseSpec,
  ExpectedOutcome,
  RuleFrontMatter,
} from "../types";
import fetch from "node-fetch";

export class TestCase {
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

  constructor(spec: TestCaseSpec) {
    this.ruleId = spec.ruleId;
    this.ruleName = spec.ruleName;
    this.testcaseId = spec.testcaseId;
    this.testcaseTitle = spec.testcaseTitle;
    this.url = spec.url;
    this.relativePath = spec.relativePath;
    this.expected = spec.expected;
    this.rulePage = spec.rulePage;
    this.ruleAccessibilityRequirements = spec.ruleAccessibilityRequirements;
    this.approved = spec.approved;
  }

  async fetchSource(): Promise<string> {
    const response = await fetch(this.url);
    return response.text();
  }
}
