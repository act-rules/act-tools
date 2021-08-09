import { RuleFrontMatter } from "src/types";
import { Parent } from "unist";
import { getRuleExamples, Example } from "../../act/get-rule-examples";
import { joinStrings } from "../../utils/index";

export function getExamplesContent({
  frontmatter,
  markdownAST,
  body,
}: {
  frontmatter: RuleFrontMatter;
  markdownAST: Parent;
  body: string;
}): string {
  const ruleId = frontmatter.id;
  const examples = getRuleExamples({ markdownAST, body });
  const exampleStrings: Record<string, string[]> = {
    passed: [],
    failed: [],
    inapplicable: [],
  };
  examples.forEach((example) => {
    const { title, description, language, rawCode, expected } = example;
    const exampleStr = joinStrings(
      `#### ${title}`,
      getExternalLink(ruleId, example),
      description,
      ["```" + language, rawCode, "```"]
    );
    exampleStrings[expected].push(exampleStr);
  });

  const { passed, failed, inapplicable } = addDefaults(exampleStrings);
  return joinStrings(
    "## Test Cases",
    "### Passed",
    ...passed,
    "### Failed",
    ...failed,
    "### Inapplicable",
    ...inapplicable
  );
}

function addDefaults(
  exampleMap: Record<string, string[]>
): Record<string, string[]> {
  Object.entries(exampleMap).forEach(([key, value]) => {
    if (!value.length) {
      exampleMap[key] = [`_There are no ${key} examples._`];
    }
  });
  return exampleMap;
}

function getExternalLink(
  ruleId: string,
  { title, testcaseId, language }: Example
): string {
  const base = "/standards-guidelines/act/rules/testcases";
  const href = `${base}/${ruleId}/${testcaseId}.${language}`;
  return (
    '<a class="example-link" ' +
    `title="${title}" ` +
    `href="${href}">Open in a new tab</a>`
  );
}
