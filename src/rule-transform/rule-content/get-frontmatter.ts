import { Node, Parent, Literal } from "unist";
import { outdent } from "outdent";
import { RuleFrontMatter } from "../../types";
import { parseMarkdown } from "../../utils/parse-page";
import { getFooter } from "./frontmatter/get-footer";
import { getRuleMeta } from "./frontmatter/get-rule-meta";
import { indent } from "../../utils/index";

export const getFrontmatter = (
  { frontmatter }: { frontmatter: RuleFrontMatter },
  _?: unknown,
  options?: Record<string, boolean | undefined>
): string => {
  const proposed = options?.proposed;
  const filePath = frontmatter.id + (proposed ? `/proposed` : ``);
  const permalink = "/standards-guidelines/act/rules/" + filePath;
  const githubPath = `content/rules/${frontmatter.id}/${
    proposed ? "proposed" : "index"
  }.md`;

  return outdent`
    ---
    title: "${stripMarkdownFromStr(frontmatter.name)}"
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
    rule_meta:
    ${indent(getRuleMeta(frontmatter))}
    ---
  `;
};

function stripMarkdownFromStr(str: string): string {
  const AST = parseMarkdown(str);
  return stripMarkdownFromAST(AST);
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
