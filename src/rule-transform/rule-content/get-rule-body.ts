import { Parent } from "unist";

type Args = { body: string; markdownAST: Parent };

export function getRuleBody({ body, markdownAST }: Args): string {
  body = stripExamples({ body });
  body = stripReferences({ body, markdownAST });
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

function stripReferences({ body, markdownAST }: Args): string {
  const children = markdownAST.children;
  const firstDfn = children.find(({ type }) => type === "definition");
  const offset = firstDfn?.position?.start.offset;
  if (!offset) {
    return body;
  }
  return body.substr(0, offset);
}
