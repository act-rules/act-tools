import { toTestResults } from "../../__test-utils__";
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
        testResults: toTestResults([
          {
            expected: "passed",
            outcomes: ["passed", "failed", "inapplicable"],
          },
          {
            expected: "passed",
            outcomes: ["passed", "inapplicable"],
          },
        ]),
      })
    ).toHaveProperty("testCaseTotal", 2);
  });

  describe("covered", () => {
    it("returns testCaseTotal, if all are covered", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: toTestResults([
            {
              expected: "failed",
              outcomes: ["passed", "failed", "inapplicable"],
            },
            {
              expected: "passed",
              outcomes: ["passed", "inapplicable"],
            },
          ]),
        })
      ).toHaveProperty("covered", 2);
    });

    it("does not count any cantTell results", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: toTestResults([
            {
              expected: "passed",
              outcomes: ["passed", "cantTell", "inapplicable"],
            },
            {
              expected: "failed",
              outcomes: ["failed", "inapplicable"],
            },
            {
              expected: "inapplicable",
              outcomes: ["passed", "inapplicable", "cantTell"],
            },
          ]),
        })
      ).toHaveProperty("covered", 1);
    });

    it("does not count untested results", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: toTestResults([
            {
              expected: "passed",
              outcomes: ["passed", "untested", "inapplicable"],
            },
            {
              expected: "failed",
              outcomes: ["failed", "inapplicable"],
            },
            {
              expected: "inapplicable",
              outcomes: ["passed", "inapplicable", "untested"],
            },
          ]),
        })
      ).toHaveProperty("covered", 1);
    });

    it("does not count false negatives", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: toTestResults([
            {
              expected: "failed",
              outcomes: ["inapplicable"],
            },
            {
              expected: "failed",
              outcomes: ["passed"],
            },
            {
              expected: "failed",
              outcomes: ["passed", "failed"],
            },
          ]),
        })
      ).toHaveProperty("covered", 1);
    });

    it("does not count false positives", () => {
      expect(
        getCoverage({
          ...procedureDefaults,
          testResults: toTestResults([
            {
              expected: "passed",
              outcomes: ["passed", "failed"],
            },
            {
              expected: "inapplicable",
              outcomes: ["inapplicable", "failed"],
            },
            {
              expected: "failed",
              outcomes: ["passed", "failed"],
            },
          ]),
        })
      ).toHaveProperty("covered", 1);
    });
  });
});
