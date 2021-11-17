import { createRuleImplementation } from "../create-rule-implementation";
import * as report from "./sample-report.json";
import { ActImplementationMapping } from "../../map-implementation/types";

const sampleReport = report as ActImplementationMapping;

describe("createRuleImplementation", () => {
  it("returns an Implementations heading", () => {
    const table = createRuleImplementation("abc123", []);
    expect(table.indexOf("## Implementations")).toBe(0);
  });

  it("returns not able if there is no reports", () => {
    const table = createRuleImplementation("abc123", []);
    expect(table).not.toContain("|----");
  });

  it("returns a report", () => {
    const content = createRuleImplementation("abc123", [sampleReport]);
    const strippedContent = content.replace(/[-|]/g, "").replace(/\s+/g, " ");
    // headings:
    expect(strippedContent).toContain(
      "Implementation Consistency Complete Report"
    );
    // Single row
    expect(strippedContent).toContain("Acme Corp Test Tool consistent no");
  });
});
