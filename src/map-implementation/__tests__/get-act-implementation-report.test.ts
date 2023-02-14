import { getActImplementationReport } from "../get-act-implementation-report";
import { ActImplementationReport } from "../types";
import { EarlAssertor } from "../earl/types";
import { getTestData, TestData } from "../__test-utils__";

describe("getActImplementationReport", () => {
  let implementationReport: ActImplementationReport;
  let testData: TestData;
  const metaData = {
    vendor: "cool-corp",
    name: "cooler-tooler",
  };
  const assertor: EarlAssertor = {
    "@type": "Assertor",
    name: "cool-tool",
    release: { revision: "99" },
  };

  beforeAll(async () => {
    testData = getTestData({ assertor });
    implementationReport = await getActImplementationReport(
      testData.earlReport,
      [testData.testCase],
      metaData
    );
  });

  it("returns a mapping", () => {
    const { actRuleMapping } = implementationReport;
    expect(actRuleMapping).toEqual([
      {
        ruleId: testData.ruleId,
        ruleName: testData.ruleName,
        procedureNames: [testData.procedureName],
        ruleApproved: true,
        consistency: "complete",
        coverage: {
          covered: 1,
          cantTell: 0,
          untested: 0,
          testCaseTotal: 1,
        },
        accessibilityRequirements: {
          correct: true,
          expected: testData.failedRequirements,
          reported: testData.failedRequirements,
        },
        testCaseResults: [
          {
            testcaseId: testData.testcaseId,
            testCaseName: testData.testCaseName,
            testCaseUrl: testData.testCaseUrl,
            testCaseApproved: true,
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

  it("includes assertor info not provided through metaData", () => {
    expect(implementationReport.vendor).toBe("cool-corp");
    expect(implementationReport.name).toBe("cooler-tooler");
    expect(implementationReport.version).toBe("99");
  });
});
