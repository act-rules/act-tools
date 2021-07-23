import { Node, Parent } from "unist";
import unified from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import fastmatter from "fastmatter";

export type ParsedPage = {
  frontmatter: ReturnType<typeof fastmatter>["attributes"];
  body: string;
  markdownAST: ReturnType<typeof parseMarkdown>;
};

export function parsePage(fileContents: string): ParsedPage {
  const { attributes: frontmatter, body } = fastmatter(fileContents);
  const markdownAST = parseMarkdown(body);
  return { frontmatter, body, markdownAST };
}

export function parseMarkdown(markdown: string): Node | Parent {
  const unifiedProcessor = unified().use(remarkParse).use(remarkFrontmatter);
  return unifiedProcessor.parse(markdown);
}

export const isParent = (node: Node): node is Parent => "children" in node;
