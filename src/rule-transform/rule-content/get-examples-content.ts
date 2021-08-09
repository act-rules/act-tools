import { Parent } from "unist";
import { getRuleExamples, Example } from "../../act/get-rule-examples";
import { joinStrings } from "../../utils/index";

export function getExamplesContent({
  markdownAST,
  body,
}: {
  markdownAST: Parent;
  body: string;
}): string {
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
      getExternalLink(example),
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

function getExternalLink({ title, testcaseId, language }: Example): string {
  const href = `/standards-guidelines/act/rules/testcases/${testcaseId}.${language}`;
  return (
    '<a class="example-link" ' +
    `title="${title}" ` +
    `href="${href}">Open in a new tab</a>`
  );
}
