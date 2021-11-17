import markdownTable from "markdown-table";
import { outdent } from "outdent";
import { ActImplementationMapping } from "../map-implementation/types";
import { filenameEscape } from "../utils";

const urlBase = `https://act-rules.github.io/implementation/`;
const headings = ["Implementation", "Consistency", "Complete", "Report"];

export function createRuleImplementation(
  ruleId: string,
  implementationMappings: ActImplementationMapping[]
): string {
  const rows: Array<string[]> = [];
  implementationMappings.forEach(({ name, actMapping }) => {
    const procedureSet = actMapping.find(
      (procedureSet) => procedureSet.ruleId === ruleId
    );
    if (procedureSet && procedureSet.consistency !== "inconsistent" && name) {
      rows.push([
        name,
        procedureSet.consistency,
        procedureSet.complete ? "yes" : "no",
        `[View report](${urlBase}${filenameEscape(name)}#id-${
          procedureSet.ruleId
        })`,
      ]);
    }
  });
  if (rows.length === 0) {
    return noTableContent();
  }

  const table = markdownTable([headings, ...rows]);
  return outdent`
    ## Implementations

    This section is not part of the formal rule. It is populated dynamically and 
    not accounted for in the change history or the last modified date.

    ${table}
  `;
}

const noTableContent = () => outdent`
  ## Implementations

  There are currently no known implementations for this rule. If you would like to 
  contribute an implementation, please read the 
  [ACT Implementations page](https://act-rules.github.io/pages/implementations/overview/) 
  for details.
`;
