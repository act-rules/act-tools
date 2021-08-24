import { Node, Parent, Literal } from "unist";
import { outdent } from "outdent";
import { RuleFrontMatter } from "../../types";
import { parseMarkdown } from "../../utils/parse-page";
import { getFooter } from "./frontmatter/get-footer";
import { getRuleMeta } from "./frontmatter/get-rule-meta";
import { indent } from "../../utils/index";

export const getFrontmatter = (
  { filename, frontmatter }: { filename: string; frontmatter: RuleFrontMatter },
  _?: unknown,
  options?: Record<string, boolean | undefined>
): string => {
  const permalink =
    "/standards-guidelines/act/rules/" + filename.replace(".md", "");
  const githubPath = `content/${filename}`;
  return outdent`
    ---
    title: "${stripMarkdownFromStr(frontmatter.name)}"
    permalink: ${permalink}/
    ref: ${permalink}/
    lang: en
    github:
      repository: w3c/wcag-act-rules
      path: ${githubPath}
    footer: |
    ${indent(getFooter(frontmatter.acknowledgments))}
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
