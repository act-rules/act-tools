import assert from "assert";
import fetch from "node-fetch";
import {
  TestCase as TestCaseSpec,
  ExpectedOutcome,
  RuleFrontMatter,
} from "../types";

export type Formats = "jsx";

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

  #text?: string;

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

  async fetchSource(
    options: { format?: Formats; assertNoRender?: boolean } = {}
  ): Promise<string> {
    if (!this.#text) {
      const response = await fetch(this.url);
      this.#text = await response.text();
    }
    if (options.assertNoRender) {
      assert(!this.requiresRender(), "Skip test case that requires rendering");
    }
    return sourceTransform(this.#text, options.format);
  }

  requiresRender(text?: string): boolean {
    text = this.#text ?? text;
    assert(text, "No page source available. Call .fetchSource() first");
    return testRequiresRender(text);
  }
}

export function sourceTransform(pageCode: string, format?: Formats): string {
  if (format === "jsx") {
    return htmlToJsx(pageCode);
  }
  return pageCode;
}

function htmlToJsx(pageCode: string): string {
  return `function JsxComponent() {
    return (${stripDoctype(pageCode)})
  }`;
}

function stripDoctype(pageCode: string): string {
  return pageCode.replace(/<!doctype.*>/gi, "").trim();
}

export function testRequiresRender(source: string): boolean {
  const renderIndicators = [
    "style=",
    "<style",
    "<script",
    "<audio",
    "<video",
    'rel="stylesheet"',
    `rel='stylesheet'`,
    "srcdoc=",
  ];
  return renderIndicators.some((indicator) => source.includes(indicator));
}
