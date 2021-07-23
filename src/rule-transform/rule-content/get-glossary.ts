import { DefinitionPage } from "../../types";
import { joinStrings } from "../../utils/join-strings";

export const getGlossary = (_: unknown, glossary: DefinitionPage[]): string => {
  const glossaryTexts = glossary.map(getGlossaryMarkdown);
  return joinStrings(`## Glossary`, ...glossaryTexts);
};

function getGlossaryMarkdown(definition: DefinitionPage): string {
  const { title, key } = definition.frontmatter;
  const heading = `### ${title} {#${key}}`;
  const body = getDefinitionBody(definition);
  return joinStrings(heading, body);
}

function getDefinitionBody(definition: DefinitionPage): string | string[] {
  // Delete all lines after the first heading
  // References are mixed into the bottom of the rule page later
  const lines = definition.body.split("\n");
  const headingLineNum = lines.findIndex((line) => line.match(/^##/));
  if (headingLineNum === -1) {
    return stripDefinitions(definition);
  }

  lines.splice(headingLineNum);
  return lines;
}

function stripDefinitions({ body, markdownAST }: DefinitionPage): string {
  const firstRefLink = markdownAST.children.find(
    ({ type }) => type === "definition"
  );
  const refLinkOffset = firstRefLink?.position?.start?.offset;

  return !refLinkOffset ? body : body.substr(0, refLinkOffset);
}
