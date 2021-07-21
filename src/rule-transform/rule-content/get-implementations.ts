import { RuleFrontMatter } from "../../types";

export const getImplementations = (
  { frontmatter }: { frontmatter: RuleFrontMatter },
  _: unknown,
  options: Record<string, boolean | undefined>
): string => {
  return options.matrix
    ? `{% include implementations/${frontmatter.id}.md %}`
    : "";
};
