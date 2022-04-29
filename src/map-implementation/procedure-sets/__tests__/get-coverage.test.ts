import { toTestResults } from "../../__test-utils__";
import { getCoverage } from "../get-coverage";

describe("getCoverage", () => {
  const procedureDefaults = {
    procedureName: "abc123",
    ruleId: "abc123",
    failedRequirements: [],
  };

  it("returns testCaseTotal", () => {
    const coverage = getCoverage({
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
    });
    expect(coverage.testCaseTotal).toBe(2);
  });

  describe("untested", () => {
    it("returns the number of outcomes with cantTell in it", () => {
      const coverage = getCoverage({
        ...procedureDefaults,
        testResults: toTestResults([
          {
            expected: "passed",
            outcomes: ["failed"],
          },
          {
            expected: "failed",
            outcomes: ["failed", "untested"],
          },
          {
            expected: "passed",
            outcomes: ["untested", "cantTell"],
          },
        ]),
      });
      expect(coverage.untested).toBe(2);
    });
  });

  describe("cantTell", () => {
    it("returns the number of outcomes with cantTell in it", () => {
      const { cantTell } = getCoverage({
        ...procedureDefaults,
        testResults: toTestResults([
          {
            expected: "passed",
            outcomes: ["failed"],
          },
          {
            expected: "failed",
            outcomes: ["failed", "cantTell"],
          },
          {
            expected: "passed",
            outcomes: ["cantTell", "passed"],
          },
        ]),
      });
      expect(cantTell).toBe(2);
    });

    it("ignores cantTells when there is also untested", () => {
      const { cantTell } = getCoverage({
        ...procedureDefaults,
        testResults: toTestResults([
          {
            expected: "passed",
            outcomes: ["cantTell", "untested"],
          },
        ]),
      });
      expect(cantTell).toBe(0);
    });
  });

  describe("covered", () => {
    it("ignores proposed results when there are approved results", () => {
      const { covered } = getCoverage({
        ...procedureDefaults,
        testResults: toTestResults([
          {
            expected: "failed",
            outcomes: ["failed"],
          },
          {
            expected: "failed",
            outcomes: ["failed"],
            testCaseApproved: false,
          },
          {
            expected: "passed",
            outcomes: ["passed"],
          },
        ]),
      });
      expect(covered).toBe(2);
    });

    it("returns testCaseTotal, if all are covered", () => {
      const { covered } = getCoverage({
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
      });
      expect(covered).toBe(2);
    });

    it("does not count any cantTell results", () => {
      const { covered } = getCoverage({
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
      });
      expect(covered).toBe(1);
    });

    it("does not count untested results", () => {
      const { covered } = getCoverage({
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
      });
      expect(covered).toBe(1);
    });

    it("does not count false negatives", () => {
      const { covered } = getCoverage({
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
      });
      expect(covered).toBe(1);
    });

    it("does not count false positives", () => {
      const { covered } = getCoverage({
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
      });
      expect(covered).toBe(1);
    });
  });
});
