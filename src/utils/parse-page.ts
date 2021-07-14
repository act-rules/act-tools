import fastmatter from "fastmatter";
import { parseMarkdown } from "./parse-markdown";

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
