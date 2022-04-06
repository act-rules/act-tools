import { getActImplementationReport } from "../get-act-implementation-report";
import { getTestData } from "../__test-utils__";

describe("getActImplementationReport", () => {
  it("returns a mapping", async () => {
    const data = getTestData();
    const mapping = await getActImplementationReport(data.earlReport, [
      data.testCase,
    ]);
    expect(mapping["actRuleMapping"]).toEqual([
      {
        ruleId: data.ruleId,
        ruleName: data.ruleName,
        procedureNames: [data.procedureName],
        consistency: "complete",
        coverage: {
          covered: 1,
          testCaseTotal: 1,
        },
        testCaseResults: [
          {
            testcaseId: data.testcaseId,
            testCaseName: data.testCaseName,
            testCaseUrl: data.testCaseUrl,
            expected: data.expected,
            procedureResults: [
              {
                outcomes: [data.expected],
                procedureName: data.procedureName,
              },
            ],
          },
        ],
      },
    ]);
  });
});
