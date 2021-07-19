import assert from "assert";
import { Node, Parent } from 'unist';
import { DefinitionPage } from "../types";

export function getDefinitionContent(
  dfnKey: string,
  glossary: DefinitionPage[]
): string {
  const definition = glossary.find(({ frontmatter }) => frontmatter.key === dfnKey);
  assert(definition, `Unable to find definition ${dfnKey} in glossary`);
  
  const heading = `### ${definition.frontmatter.title} {#${dfnKey}}`;
  const lines = definition.body.split('\n');
  const headingLineNum = lines.findIndex(line => line.match(/^##/));
  if (headingLineNum === -1) {
    return joinStrings(heading, definition.body);
  }

  lines.splice(headingLineNum);
  const references = getReferences(definition);
  return joinStrings(heading, lines, references);
}


function getReferences(
  { markdownAST, body }: { markdownAST: Node, body: string }
): string {
  const AST = (markdownAST as Parent)
  const firstRefLink = AST.children.find(({ type }) => type === 'definition');
  const refLinkOffset = firstRefLink?.position?.start?.offset;

  return (typeof refLinkOffset === 'number'
    ? body.substr(refLinkOffset)
    : ''
  );
}

function joinStrings(...items: Array<string | string[]>): string {
  const blocks = items.map(item => (Array.isArray(item)
    ? item.join('\n').trim()
    : item.trim()
  ))
  const textBlocks = blocks.filter(block => block !== '');
  return textBlocks.join('\n\n') + '\n'
}
