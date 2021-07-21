import { Node, Parent, Literal } from "unist";
import { getMarkdownAstNodesOfType } from "../utils/get-markdown-ast-nodes-of-type";
import { testCaseHash } from "./test-case-hash";
import { TestCase, RulePage } from "../types";
import { addCodeTemplate } from "./add-code-template";
import assert from "assert";

type CodeSnippet = Node & {
  value: string;
  lang?: string;
};

export type TestCaseData = {
  codeSnippet: string;
  filePath: string;
  metadata: TestCase;
};

export function extractTestCases(
  { frontmatter, markdownAST }: RulePage,
  { baseUrl = "https://act-rules.github.io" }: { baseUrl: string }
): TestCaseData[] {
  const {
    id: ruleId,
    name: ruleName,
    accessibility_requirements: ruleAccessibilityRequirements,
  } = frontmatter;

  const testCaseTitles = getTestCaseTitles(markdownAST);
  const testCaseCodeSnippets = getMarkdownAstNodesOfType(markdownAST, "code");
  // Assume that each code block belongs to an example:
  assert(
    testCaseTitles.length === testCaseCodeSnippets.length,
    `Number of matching titles for code snippets is wrong. Check markdown '${ruleName}' for irregularities.`
  );

  const ruleTestCases: TestCaseData[] = [];
  for (const [index, codeBlockNode] of testCaseCodeSnippets.entries()) {
    const testcaseTitle = testCaseTitles[index];
    const { lang = `html`, value: code } = codeBlockNode as CodeSnippet;
    const expected = testcaseTitle.split(" ")[0].toLocaleLowerCase();
    const testcaseId = testCaseHash(code);
    const filePath = `testcases/${ruleId}/${testcaseId}.${lang}`;

    const metadata: TestCase = {
      ruleId,
      ruleName,
      testcaseId,
      testcaseTitle,
      expected,
      relativePath: filePath,
      url: `${baseUrl}/${filePath}`,
      rulePage: `${baseUrl}/rules/${ruleId}`,
      ruleAccessibilityRequirements,
    };

    const codeSnippet = addCodeTemplate(code, lang, testcaseTitle);
    ruleTestCases.push({ codeSnippet, filePath, metadata });
  }
  return ruleTestCases;
}

/**
 * get all titles of test case examples (eg: #### Failed Example 1)
 */
function getTestCaseTitles(markdownAST: Node): string[] {
  return getMarkdownAstNodesOfType(markdownAST, "heading")
    .filter((node) => {
      const { depth, children } = node as unknown as {
        depth: number;
        children: Parent[];
      };
      return depth === 4 && children && children.length > 0;
    })
    .map((node) => {
      const [textNode] = (node as Parent).children;
      return (textNode as Literal).value as string;
    });
}
