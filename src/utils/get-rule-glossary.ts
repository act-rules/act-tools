import { Node } from "unist";
import { DefinitionPage } from "../types";
import { getMarkdownAstNodesOfType } from "./get-markdown-ast-nodes-of-type";

export function getRuleGlossary(
  markdownAST: Node,
  glossary: DefinitionPage[]
): DefinitionPage[] {
  const keysSearched: Record<string, DefinitionPage | undefined> = {
    outcome: getDefinition("outcome", glossary),
  };
  const keysToSearch = getDefinitionLinks(markdownAST);

  while (keysToSearch.length > 0) {
    // Move the key to the "searched" list
    const currentKey = keysToSearch.pop();
    if (!currentKey) continue;

    // Find all keys in the current definition
    const definition = getDefinition(currentKey, glossary);
    if (!definition) continue;

    const newKeys = getDefinitionLinks(definition.markdownAST);
    keysSearched[currentKey] = definition;

    // Add new keys to the search list
    newKeys.forEach((definitionKey) => {
      if (
        !keysSearched[definitionKey] &&
        !keysToSearch.includes(definitionKey)
      ) {
        keysToSearch.push(definitionKey);
      }
    });
  }

  const definitions: DefinitionPage[] = [];
  Object.values(keysSearched).forEach((definition) => {
    if (definition) {
      definitions.push(definition);
    }
  });

  return definitions.sort((a, b) =>
    a.frontmatter.key > b.frontmatter.key ? 1 : -1
  );
}

type LinkNode = Node & { url: string };

function getDefinitionLinks(markdownAST: Node): string[] {
  // get all links -> eg: [Alpha](https://....) or [Beta](#semantic-role)
  const pageLinks = getMarkdownAstNodesOfType(markdownAST, "link").map(getUrl);
  // get all definition links  -> eg: [alpha]: https:// 'Link to something' or [beta]: #some-glossary 'Def to some glossary'
  const definitionLinks = getMarkdownAstNodesOfType(
    markdownAST,
    "definition"
  ).map(getUrl);

  const allLinks = [...pageLinks, ...definitionLinks];
  const localLinks = allLinks.filter((dfnTerm) => dfnTerm[0] === "#");
  return localLinks.map((dfnTerm) => dfnTerm.substr(1));
}

function getDefinition(
  dfnLink: string,
  glossary: DefinitionPage[]
): DefinitionPage | undefined {
  return glossary.find((dfn) => dfn.frontmatter.key === dfnLink);
}

const getUrl = (node: Node): string => (node as LinkNode).url || "";
