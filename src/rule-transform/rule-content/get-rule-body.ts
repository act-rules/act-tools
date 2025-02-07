import { Parent } from "unist";
import {
  AccessibilitySupport,
  AtomicRuleFrontmatter,
  RuleFrontMatter,
} from "../../types";

type Args = {
  body: string;
  markdownAST: Parent;
  frontmatter: RuleFrontMatter;
};

export function getRuleBody(
  { body, markdownAST, frontmatter }: Args,
  _1: unknown,
  _2: unknown,
  _3: unknown,
  supportKeys: AccessibilitySupport
): string {
  body = stripExamples({ body });
  body = stripReferences({ body, markdownAST });
  if ("input_aspects" in frontmatter) {
    body = addInputAspects(frontmatter, body, supportKeys);
  }
  return body.trim();
}

function stripExamples({ body }: { body: string }): string {
  /* eslint-disable no-useless-escape */
  const headingPrefix = "\n##+\\s+";
  const singleCaseMatch =
    "(passed|failed|inapplicable)\\s+(example|case|tests+case)";
  const index = body.search(
    new RegExp(
      `${headingPrefix}(examples|(test\\s+)?cases|${singleCaseMatch})`,
      "i"
    )
  );
  if (index === -1) {
    return body;
  }
  return body.substr(0, index);
}

function stripReferences({
  body,
  markdownAST,
}: {
  body: string;
  markdownAST: Parent;
}): string {
  const children = markdownAST.children;
  const firstDfn = children.find(({ type }) => type === "definition");
  const offset = firstDfn?.position?.start.offset;
  if (!offset) {
    return body;
  }
  return body.substr(0, offset);
}

function addInputAspects(
  frontmatter: AtomicRuleFrontmatter,
  body: string,
  supportKeys: AccessibilitySupport
): string {
  frontmatter.input_aspects.forEach((aspect) => {
    if (aspect.toLowerCase() in supportKeys) {
      body = updateAccessibilitySupportInBody(
        body,
        supportKeys[aspect.toLowerCase()]
      );
    }
  });
  return body;
}

function updateAccessibilitySupportInBody(
  body: string,
  support: string
): string {
  const supportIndex = body.search(/\n###\s+Accessibility\s+Support\b/m);
  if (supportIndex === -1) {
    console.log("no support index");
    return body;
  }
  const startOfNextHeading = body.indexOf("#", supportIndex + 4);
  if (body.substring(supportIndex, startOfNextHeading).includes(support)) {
    // already exists, do nothing
    return body;
  }
  const currentSupportText = body.substring(supportIndex, startOfNextHeading);
  if (
    currentSupportText.includes(
      "There are no accessibility support issues known."
    )
  ) {
    // no support issues, replace with new support issue
    return (
      body.substring(0, supportIndex) +
      `\n### Accessibility Support\n\n${support}\n\n` +
      body.substring(startOfNextHeading)
    );
  }
  // add new support issue to existing support issues
  return (
    body.substring(0, startOfNextHeading - 1) +
    `\n${support}\n\n` +
    body.substring(startOfNextHeading)
  );
}
