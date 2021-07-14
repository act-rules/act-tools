import { Node, Parent, Literal } from "unist";
import { outdent } from "outdent";
import { RuleFrontMatter } from "../types";
import { parseMarkdown } from "../utils/parse-markdown";

export const getFrontmatter = ({
  filename,
  frontmatter,
}: {
  filename: string;
  frontmatter: RuleFrontMatter;
}): string => {
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
    # footer: > # Text in footer in HTML
    #   <p> This is the text in the footer </p>
    ---
  `;
};

function stripMarkdownFromStr(str: string) {
  const AST = parseMarkdown(str);
  return stripMarkdownFromAST(AST);
}

function stripMarkdownFromAST(markdownAST: Node): string {
  const node = markdownAST as Parent | Literal;
  if ("value" in node) {
    return node.value as string;
  }

  let str = "";
  for (const child of node.children || []) {
    str += stripMarkdownFromAST(child);
  }
  return str;
}
