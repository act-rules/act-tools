import { Node, Parent, Literal, Point } from "unist";
import { addCodeTemplate } from "./examples/add-code-template";
import { testCaseHash } from "./examples/test-case-hash";

export type Example = {
  title: string;
  expected: "passed" | "failed" | "inapplicable";
  description: string;
  testcaseId: string;
  codeSnippet: string;
  rawCode: string;
  language: string;
};

type Code = Node & {
  lang: string;
  value: string;
};

export function getRuleExamples({
  markdownAST,
  body,
}: {
  markdownAST: Parent;
  body: string;
}): Example[] {
  const examples: Example[] = [];
  const sections = getExampleSections(markdownAST);
  sections.forEach(({ heading, code }) => {
    const headingPos = heading.position;
    const codePos = code.position;
    const headingText = getText(body, headingPos?.start, headingPos?.end);
    const title = headingText.replace(/^#+/, "").trim();

    examples.push({
      title,
      expected: getExpected(title),
      description: getText(body, headingPos?.end, codePos?.start).trim(),
      language: code.lang,
      rawCode: code.value,
      codeSnippet: addCodeTemplate(code.value, code.lang, title),
      testcaseId: testCaseHash(code.value),
    });
  });

  return examples;
}

type ExampleSection = { heading: Node; code: Code };
function getExampleSections(markdownAST: Parent): ExampleSection[] {
  const exampleSections: ExampleSection[] = [];
  let heading: Node | null = null;
  for (const node of markdownAST.children) {
    if (isExampleHeading(node)) {
      heading = node;
      continue;
    }
    if (heading && node.type === "code") {
      exampleSections.push({ heading, code: node as Code });
      heading = null;
    }
  }
  return exampleSections;
}

function isExampleHeading(node: Node | Parent): boolean {
  if (node.type !== "heading") {
    return false;
  }
  if ("children" in node && node.children.length === 1) {
    const textNode = node.children[0] as Literal;
    const text = (textNode?.value as string)?.toLowerCase() || "";
    return (
      textNode.type === "text" &&
      !!text.match(/example|case/) &&
      !!text.match(/pass|fail|inapplicable/)
    );
  }
  return false;
}

function getExpected(headingText: string): Example["expected"] {
  if (headingText.match(/pass/i)) {
    return "passed";
  }
  if (headingText.match(/fail/i)) {
    return "failed";
  }
  if (headingText.match(/inapplicable/i)) {
    return "inapplicable";
  }
  throw new Error(`Expected value not known in heading text`);
}

function getText(
  str: string,
  start: Point | undefined,
  end: Point | undefined
): string {
  if (!start || !end) {
    return "";
  }
  const startPos = getOffset(str, start);
  const endPos = getOffset(str, end);

  return str.substr(startPos, endPos - startPos);
}

function getOffset(str: string, pos: Point): number {
  if (typeof pos.offset === "number") {
    return pos.offset;
  }
  let lineIndex = 0;
  for (let i = 1; i < pos.line; i++) {
    lineIndex = str.indexOf("\n", lineIndex);
  }
  return lineIndex + (pos.column - 1);
}
