import { getRuleExamples } from "../act/get-rule-examples";
import { TestCase, RulePage } from "../types";

export type TestCaseData = {
  codeSnippet: string;
  filePath: string;
  deprecated?: boolean;
  metadata: TestCase;
};

export function extractTestCases(
  { frontmatter, markdownAST, body }: RulePage,
  baseUrl = "https://www.w3.org/WAI/content-assets/wcag-act-rules/",
  pageUrl = "https://www.w3.org/WAI/standards-guidelines/act/rules/",
  proposed = false
): TestCaseData[] {
  const {
    id: ruleId,
    name: ruleName,
    accessibility_requirements: ruleAccessibilityRequirements,
  } = frontmatter;
  const deprecated = typeof frontmatter.deprecated === "string";

  const ruleData = {
    ruleId,
    ruleName,
    ruleAccessibilityRequirements,
  };

  const examples = getRuleExamples({ markdownAST, body });
  return examples.map(
    ({ codeSnippet, testcaseId, expected, title, language }): TestCaseData => {
      const filePath = `testcases/${ruleId}/${testcaseId}.${language}`;
      const metadata = {
        ...ruleData,
        expected,
        testcaseId,
        testcaseTitle: title,
        relativePath: filePath,
        url: baseUrl + filePath,
        rulePage: pageUrl + ruleId + (proposed ? `/proposed/` : `/`),
      };
      return { codeSnippet, filePath, deprecated, metadata };
    }
  );
}
