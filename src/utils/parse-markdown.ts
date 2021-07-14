import { Node } from "unist";
import unified from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";

export function parseMarkdown(markdown: string): Node {
  const unifiedProcessor = unified().use(remarkParse).use(remarkFrontmatter);
  return unifiedProcessor.parse(markdown);
}
