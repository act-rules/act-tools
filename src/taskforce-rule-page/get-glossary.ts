import { DefinitionPage } from "../types";
import { getRuleGlossary } from "../utils/get-rule-glossary";
import { Node } from "unist";

export const getGlossary = (
  { markdownAST }: { markdownAST: Node },
  glossary: DefinitionPage[]
): string => {
  const ruleGlossary = getRuleGlossary(markdownAST, glossary);
  const glossaryIncludes = ruleGlossary.map(getGlossaryMarkdown).join("\n");

  return `## Glossary\n\n` + glossaryIncludes;
};

type Definition = ReturnType<typeof getRuleGlossary>[0];

function getGlossaryMarkdown({ frontmatter }: Definition) {
  return `{% include_relative glossary/${frontmatter.key}.md %}`;
}
