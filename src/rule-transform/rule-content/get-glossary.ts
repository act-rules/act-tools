import { DefinitionPage } from "../../types";
import { getGlossaryBody, getGlossaryHeading } from "../../utils/glossary";
import { joinStrings } from "../../utils/join-strings";

export const getGlossary = (_: unknown, glossary: DefinitionPage[]): string => {
  const glossaryTexts = glossary.map(getGlossaryMarkdown);
  return joinStrings(`## Glossary`, ...glossaryTexts);
};

function getGlossaryMarkdown(definition: DefinitionPage): string {
  const heading = getGlossaryHeading(definition.frontmatter, 3);
  const body = getGlossaryBody(definition, { mode: "rule" });
  return joinStrings(heading, body);
}
