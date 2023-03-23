import { Node, Parent, Literal } from "unist";
import { outdent } from "outdent";
import { RuleFrontMatter } from "../../types";
import { parseMarkdown } from "../../utils/parse-page";
import { getFooter } from "./frontmatter/get-footer";
import { getRuleMeta } from "./frontmatter/get-rule-meta";
import { indent } from "../../utils/index";

export const getFrontmatter = (
  { frontmatter }: { frontmatter: RuleFrontMatter },
  _1?: unknown,
  _2?: unknown,
  options?: Record<string, boolean | undefined>
): string => {
  const proposed = options?.proposed;
  const filePath = frontmatter.id + (proposed ? `/proposed` : ``);
  const permalink = "/standards-guidelines/act/rules/" + filePath;
  const githubPath = `content/rules/${frontmatter.id}/${
    proposed ? "proposed" : "index"
  }.md`;

  const deprecated = !frontmatter.deprecated
    ? ""
    : `deprecated: |\n${indent(frontmatter.deprecated)}\n`;

  return outdent`
    ---
    title: "${normalizeTitle(frontmatter.name)}"
    permalink: ${permalink}/
    ref: ${permalink}/
    lang: en
    github:
      repository: w3c/wcag-act-rules
      path: ${githubPath}
    feedbackmail: public-wcag-act@w3.org
    footer: |
    ${indent(getFooter(frontmatter, options?.proposed))}
    proposed: ${options?.proposed || false}
    ${deprecated}
    rule_meta:
    ${indent(getRuleMeta(frontmatter))}
    ---
  `.replace("\n\n", "\n");
};

function normalizeTitle(str: string): string {
  const AST = parseMarkdown(str);
  return stripMarkdownFromAST(AST).replace("DEPRECATED -", "").trim();
}

function stripMarkdownFromAST(node: Node | Parent | Literal): string {
  if ("value" in node) {
    return node.value as string;
  }

  let str = "";
  if ("children" in node) {
    for (const child of node.children || []) {
      str += stripMarkdownFromAST(child);
    }
  }
  return str;
}
