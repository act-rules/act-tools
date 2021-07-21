import { Parent } from "unist";
import { PageBase } from "../../types";

export function getReferenceLinks(
  page: PageBase,
  glossary: PageBase[]
): string {
  let references: Record<string, string> = getReferences(page);
  glossary.forEach((definition) => {
    references = { ...getReferences(definition), ...references };
  });

  const lines = Object.entries(references).map(
    ([key, value]) => `${key}: ${value}`
  );

  lines.sort();
  return lines.join("\n");
}

function getReferences(page: PageBase): Record<string, string> {
  const references: Record<string, string> = {};
  const children = (page.markdownAST as Parent).children;
  const firstDfn = children.find(({ type }) => type === "definition");
  const offset = firstDfn?.position?.start?.offset;
  if (typeof offset !== "number") {
    return references;
  }
  const lines = page.body.substr(offset).split("\n");
  lines.forEach((line) => {
    const [key, url] = line.split(": ");
    if (key.match(/^\[.+\]$/)) {
      references[key.toLocaleLowerCase()] = url || "";
    }
  });
  return references;
}
