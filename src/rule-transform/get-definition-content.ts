import assert from "assert";
import { DefinitionPage } from "../types";

export function getDefinitionContent(
  definitionKey: string,
  glossary: DefinitionPage[]
): string {
  const definition = glossary.find(
    (dfn) => dfn.frontmatter.key === definitionKey
  );
  assert(
    definition,
    `Unable to find definition for ${definitionKey} in glossary`
  );

  const heading = `### ${definition.frontmatter.title} {#${definitionKey}}\n`;
  return heading + definition.body;
}
