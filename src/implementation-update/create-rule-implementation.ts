import markdownTable from "markdown-table";
import { outdent } from "outdent";
import {
  ActImplementationReport,
  ActProcedureSet,
} from "../map-implementation/types";
import { filenameEscape } from "../utils";

const urlBase = `https://act-rules.github.io/implementation/`;
const headings = ["Implementation", "Consistency", "Coverage", "Report"];

export function createRuleImplementation(
  ruleId: string,
  implementationMappings: ActImplementationReport[]
): string {
  const rows: Array<string[]> = [];
  implementationMappings.forEach(({ name, actRuleMapping }) => {
    const procedureSet = actRuleMapping.find(
      (procedureSet) => procedureSet.ruleId === ruleId
    );
    if (
      procedureSet?.consistency &&
      procedureSet.consistency !== "complete" &&
      name
    ) {
      rows.push([
        name,
        procedureSet.consistency,
        coverage(procedureSet),
        procedureSet ? "yes" : "no",
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

function coverage(procedureSet: ActProcedureSet): string {
  if (!procedureSet.coverage) {
    return "";
  }
  return `${procedureSet.coverage.covered} / ${procedureSet.coverage.testCaseTotal}`;
}
