import { RulePage, TestAssets } from "src/types";
import { getRuleExamples, Example } from "../../act/get-rule-examples";
import { joinStrings } from "../../utils/index";

type Options = Record<string, boolean | undefined>;

export function getExamplesContent(
  { frontmatter, markdownAST, body, assets }: RulePage,
  _?: unknown,
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

function getAssetsString(assets: TestAssets = {}): string {
  const sorted = Object.entries(assets)
    // Extract the extensions
    .map(([fileName, content]) => [
      fileName,
      fileName.split(".").pop() ?? "",
      content,
    ])
    // Sort by extension
    .sort((a, b) => comparer(a[1], b[1]));

  if (sorted.length === 0) {
    return "";
  }

  const plural = sorted.length === 1 ? ["This", " is"] : ["These", "s are"];
  const hasHTML =
    sorted.find(([, extension]) => extension === "html") !== undefined;
  const html = hasHTML ? "HTML" : "";
  const hasJS =
    sorted.find(([, extension]) => extension === "js") !== undefined;
  const js = hasJS ? "Javascript" : "";
  const hasCSS =
    sorted.find(([, extension]) => extension === "css") !== undefined;
  const css = hasCSS ? "CSS" : "";

  // "foo " / "foo and bar " / "foo, bar, and baz "
  const kinds = [html, js, css, " "].filter((str) => str !== "");
  if (kinds.length === 4) {
    // ["foo", "bar", "baz", " "] => ["foo", ", ", "bar", ", and ", "baz", " "]
    kinds.splice(2, 0, ", and ");
    kinds.splice(1, 0, ", ");
  } else if (kinds.length === 3) {
    // ["foo", "bar", " "] => ["foo", " and ", "bar", " "]
    kinds.splice(1, 0, " and ");
  }

  const header = `${plural[0]} ${kinds.join("")}file${
    plural[1]
  } used in several examples:`;

  const assetsBase = "https://w3.org/WAI/content-assets/wcag-act-rules";
  const blocks: string[] = [];

  for (const [filename, extension, content] of sorted) {
    const truePath = filename.replace(
      /\/test-assets\//g,
      `${assetsBase}/test-assets/`
    );

    blocks.push(
      joinStrings(`File [\`${filename}\`](${truePath}):`, [
        "```" + (extension === "js" ? "javascript" : extension),
        content + (content.endsWith("\n") ? "" : "\n") + "```",
      ])
    );
  }

  return joinStrings(
    [
      `<details class="act-inline-assets" markdown="block">`,
      `<summary>${header}</summary>`,
    ],
    ...blocks,
    "</details>"
  );
}

/**
 * We want to order the test assets as HTML, JS, CSS
 * Assets with the same file type are order alphabetically.
 */
const fileOrder = ["html", "js", "css"];
function comparer(a: string, b: string): number {
  const aOrder = fileOrder.indexOf(a);
  const bOrder = fileOrder.indexOf(b);

  if (aOrder < bOrder) {
    return -1;
  }

  if (aOrder > bOrder) {
    return 1;
  }

  return a.localeCompare(b);
}
