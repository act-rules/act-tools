import { getActImplementationReport } from "../get-act-implementation-report";
import { ActImplementationReport } from "../types";
import { getTestData, TestData } from "../__test-utils__";

describe("getActImplementationReport", () => {
  let implementationReport: ActImplementationReport;
  let testData: TestData;

  beforeAll(async () => {
    testData = getTestData();
    implementationReport = await getActImplementationReport(
      testData.earlReport,
      [testData.testCase]
    );
  });

  it("returns a mapping", () => {
    const { actRuleMapping } = implementationReport;
    expect(actRuleMapping).toEqual([
      {
        ruleId: testData.ruleId,
        ruleName: testData.ruleName,
        procedureNames: [testData.procedureName],
        consistency: "complete",
        coverage: {
          covered: 1,
          testCaseTotal: 1,
        },
        accessibilityRequirements: {
          expected: testData.failedRequirements,
          reported: testData.failedRequirements,
        },
        testCaseResults: [
          {
            testcaseId: testData.testcaseId,
            testCaseName: testData.testCaseName,
            testCaseUrl: testData.testCaseUrl,
            expected: testData.expected,
            procedureResults: [
              {
                outcomes: [testData.expected],
                procedureName: testData.procedureName,
              },
            ],
          },
        ],
      },
    ]);
  });

  it("reports stats on approved rules", () => {
    const { approvedRules } = implementationReport;
    expect(approvedRules).toEqual({
      complete: 1,
      partial: 0,
      minimal: 0,
      inconsistent: 0,
      untested: 0,
    });
  });

  it("reports stats on proposed rules", () => {
    const { proposedRules } = implementationReport;
    expect(proposedRules).toEqual({
      complete: 0,
      partial: 0,
      minimal: 0,
      inconsistent: 0,
      untested: 0,
    });
  });
});
