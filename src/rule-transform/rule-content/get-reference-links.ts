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
  const { children } = page.markdownAST;
  const firstDfn = children.find(({ type }) => type === "definition");
  const offset = firstDfn?.position?.start?.offset;
  if (typeof offset !== "number") {
    return references;
  }
  const lines = page.body.substr(offset).split("\n");
  lines.forEach((line) => {
    const index = line.indexOf(": ");
    const key = line.substr(0, index);
    const url = line.substr(index + 2);
    // const [key, ...rest] = line.split(": ");
    // const url = rest.join(': ')
    if (key.match(/^\[.+\]$/)) {
      references[key.toLocaleLowerCase()] = url || "";
    }
  });
  return references;
}
