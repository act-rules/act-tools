import { RulePage, TestAssets } from "src/types";
import { getRuleExamples, Example } from "../../act/get-rule-examples";
import { joinStrings } from "../../utils/index";

type Options = Record<string, boolean | undefined>;

export function getExamplesContent(
  { frontmatter, markdownAST, body, assets }: RulePage,
  _1?: unknown,
  _2?: unknown,
  options: Options = {}
): string {
  const ruleId = frontmatter.id;
  const examples = getRuleExamples({ markdownAST, body });
  const exampleStrings: Record<string, string[]> = {
    passed: [],
    failed: [],
    inapplicable: [],
  };

  examples.forEach((example) => {
    const { title, description, language, rawCode, expected } = example;
    const externalLink = !options.noExampleLinks
      ? getExternalLink(ruleId, example)
      : "";
    const exampleStr = joinStrings(`#### ${title}`, externalLink, description, [
      "```" + language,
      rawCode,
      "```",
    ]);
    exampleStrings[expected].push(exampleStr);
  });

  const { passed, failed, inapplicable } = addDefaults(exampleStrings);
  const assetsString = getAssetsString(assets);

  return joinStrings(
    "## Test Cases",
    assetsString,
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
  const base = "https://w3.org/WAI/content-assets/wcag-act-rules/testcases";
  const href = `${base}/${ruleId}/${testcaseId}.${language}`;
  return (
    '<a class="example-link" ' +
    `title="${title}" ` +
    `target="_blank" ` +
    `href="${href}">Open in a new tab</a> `
  );
}

function getAssetsString(assets: TestAssets): string {
  const sorted = Object.entries(assets).sort((a, b) => comparer(a[0], b[0]));

  const plural = sorted.length === 0 ? ["This", " is"] : ["These", "s are"];
  const hasJS =
    sorted.find(([filename]) => filename.endsWith(".js")) !== undefined;
  const js = hasJS ? "Javascript " : "";
  const hasCSS =
    sorted.find(([filename]) => filename.endsWith(".css")) !== undefined;
  const css = hasCSS ? "CSS " : "";
  const both = hasJS && hasCSS ? "and " : "";

  const header = `${plural[0]} ${js}${both}${css}file${plural[1]} used in several examples:`;

  let result = `<details>
<summary>
${header}
</summary>
  `;

  const assetsBase = "/WAI/content-assets/wcag-act-rules";

  for (const [filename, content] of sorted) {
    const truePath = filename.replace(
      /\/test-assets\//g,
      `${assetsBase}/test-assets/`
    );

    result += `\nFile [\`${filename}\`](${truePath}):\n\n`;
    result += "```" + (filename.endsWith(".js") ? "javascript" : "css") + "\n";
    result += content;
    result += "```\n\n";
  }

  result += `</details>`;

  return result;
}

function comparer(a: string, b: string): number {
  if (a.endsWith(".js") && b.endsWith(".css")) {
    return -1;
  }

  if (a.endsWith(".css") && b.endsWith(".js")) {
    return 1;
  }

  return a.localeCompare(b);
}
