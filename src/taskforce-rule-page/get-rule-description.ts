import { RuleFrontMatter } from "../types";

export function getRuleDescription({
  frontmatter,
}: {
  frontmatter: RuleFrontMatter;
}): string {
  return `## Description\n\n` + frontmatter.description.trim();
}
