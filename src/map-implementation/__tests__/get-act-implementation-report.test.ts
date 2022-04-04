import { getActImplementationReport } from "../get-act-implementation-report";
import { getTestData } from "../__test-utils__";

describe("getActImplementationReport", () => {
  it("returns a mapping", async () => {
    const data = getTestData();
    const mapping = await getActImplementationReport(data.earlReport, [
      data.testCase,
    ]);
    expect(mapping["procedureSets"]).toEqual([
      {
        ruleId: data.ruleId,
        ruleName: data.ruleName,
        procedureSetName: data.procedureName,
        consistency: "complete",
        coverage: {
          covered: 1,
          testCaseTotal: 1,
        },
        procedures: [
          {
            consistentRequirements: true,
            procedureName: data.procedureName,
            testResults: [
              {
                automatic: true,
                expected: data.expected,
                outcomes: [data.expected],
                testcaseId: data.testcaseId,
              },
            ],
          },
        ],
      },
    ]);
  });

  it.todo("returns a summary");
});
