import { getCoverage } from "../get-coverage";

describe("getCoverage", () => {
  const procedureDefaults = {
    procedureName: "abc123",
    ruleId: "abc123",
    consistentRequirements: true,
  };

  it("returns testCaseTotal", () => {
    expect(
      getCoverage({
        ...procedureDefaults,
        testResults: [
          {
            testcaseId: "1",
            expected: "passed",
            outcomes: ["passed", "failed", "inapplicable"],
          },
          {
            testcaseId: "2",
            expected: "passed",
            outcomes: ["passed", "inapplicable"],
          },
        ],
      })
    ).toHaveProperty("testCaseTotal", 2);
  });

  describe("covered", () => {
    it("returns testCaseTotal, if all are covered", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "failed",
              outcomes: ["passed", "failed", "inapplicable"],
            },
            {
              testcaseId: "2",
              expected: "passed",
              outcomes: ["passed", "inapplicable"],
            },
          ],
        })
      ).toHaveProperty("covered", 2);
    });

    it("does not count any cantTell results", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed", "cantTell", "inapplicable"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["failed", "inapplicable"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["passed", "inapplicable", "cantTell"],
            },
          ],
        })
      ).toHaveProperty("covered", 1);
    });

    it("does not count untested results", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed", "untested", "inapplicable"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["failed", "inapplicable"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["passed", "inapplicable", "untested"],
            },
          ],
        })
      ).toHaveProperty("covered", 1);
    });

    it("does not count false negatives", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "failed",
              outcomes: ["inapplicable"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "3",
              expected: "failed",
              outcomes: ["passed", "failed"],
            },
          ],
        })
      ).toHaveProperty("covered", 1);
    });

    it("does not count false positives", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed", "failed"],
            },
            {
              testcaseId: "2",
              expected: "inapplicable",
              outcomes: ["inapplicable", "failed"],
            },
            {
              testcaseId: "3",
              expected: "failed",
              outcomes: ["passed", "failed"],
            },
          ],
        })
      ).toHaveProperty("covered", 1);
    });
  });
});
