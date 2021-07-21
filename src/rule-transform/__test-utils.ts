import outdent from "outdent";
import { DefinitionPage } from "../types";
import { parsePage } from "../utils/parse-page";

export function createGlossary(
  dfnObj: Record<string, string>
): DefinitionPage[] {
  const dfnEntries = Object.entries(dfnObj);
  const dfnStrings = dfnEntries.map(dfnFileContent);
  return dfnStrings.map(parsePage) as DefinitionPage[];
}

export function dfnFileContent([term, content]: [string, string]): string {
  const title = term[0].toUpperCase() + term.substr(1);
  return outdent`
    ---
    title: ${title}
    key: ${term}
    ---
    ${content}
  `;
}
