import { getConsistency } from "../get-consistency";
import { toTestResults } from "../../__test-utils__";

describe("getConsistency", () => {
  const procedureDefaults = {
    procedureName: "abc123",
    ruleId: "abc123",
    failedRequirements: [],
  };

  describe("consistency: null", () => {
    it("is null for false positives on passed", () => {
      expect(
        getConsistency({
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
      ).toBeNull();
    });

    it("is null for false positives on inapplicable", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "inapplicable", outcomes: ["passed", "inapplicable"] },
            {
              expected: "inapplicable",
              outcomes: ["passed", "failed", "inapplicable"],
            },
          ]),
        })
      ).toBeNull();
    });

    it("is null with all inapplicable", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: ["inapplicable"] },
            { expected: "failed", outcomes: ["inapplicable"] },
            { expected: "inapplicable", outcomes: ["inapplicable"] },
          ]),
        })
      ).toBeNull();
    });

    it("is null for all untested and cantTell outcomes", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: ["cantTell", "untested"] },
            { expected: "failed", outcomes: ["cantTell"] },
            {
              expected: "inapplicable",
              outcomes: ["untested", "cantTell", "untested"],
            },
          ]),
        })
      ).toBeNull();
    });

    it("is null with no true positives and cantTell on inapplicable", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: ["passed"] },
            { expected: "failed", outcomes: ["cantTell"] },
            { expected: "inapplicable", outcomes: ["cantTell"] },
            { expected: "inapplicable", outcomes: ["inapplicable"] },
          ]),
        })
      ).toBeNull();
    });
  });

  describe("complete consistency", () => {
    it("is complete when outcomes match expected, and requirements are consistent", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: ["passed"] },
            { expected: "failed", outcomes: ["failed"] },
            { expected: "inapplicable", outcomes: ["inapplicable"] },
          ]),
        })
      ).toBe("complete");
    });

    it("is complete as long as one of the failed outcomes is a true positive", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: ["passed"] },
            { expected: "failed", outcomes: ["passed", "failed"] },
            { expected: "failed", outcomes: ["failed", "passed"] },
            { expected: "inapplicable", outcomes: ["inapplicable"] },
          ]),
        })
      ).toBe("complete");
    });

    it("is complete when cantTell is mixed with correct answers", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            {
              expected: "passed",
              outcomes: ["cantTell"],
            },
            {
              expected: "failed",
              outcomes: ["failed", "cantTell"],
            },
            {
              expected: "inapplicable",
              outcomes: ["inapplicable", "cantTell"],
            },
          ]),
        })
      ).toBe("complete");
    });

    it("ignores proposed results when mixed with approved results", () => {
      const consistency = getConsistency({
        ...procedureDefaults,
        testResults: toTestResults([
          {
            expected: "passed",
            outcomes: ["cantTell"],
          },
          {
            expected: "passed",
            outcomes: ["failed"],
            testCaseApproved: false,
          },
          {
            expected: "failed",
            outcomes: ["failed", "cantTell"],
          },
          {
            expected: "inapplicable",
            outcomes: ["inapplicable", "cantTell"],
          },
        ]),
      });
      expect(consistency).toBe("complete");
    });
  });

  describe("partial consistency", () => {
    it("is partial when outcomes match expected, but requirements are inconsistent", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          failedRequirements: ["WCAG2:reflow"],
          testResults: toTestResults([
            {
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              expected: "failed",
              outcomes: ["failed"],
            },
            {
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ]),
        })
      ).toBe("partial");
    });

    it("is partial when there is a false negative", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            {
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              expected: "failed",
              outcomes: ["failed"],
            },
            {
              expected: "failed",
              outcomes: ["passed"],
            },
            {
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ]),
        })
      ).toBe("partial");
    });

    it("is partial when something is untested", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            {
              expected: "passed",
              outcomes: ["passed"],
            },
            { expected: "failed", outcomes: ["failed", "untested"] },
            { expected: "inapplicable", outcomes: ["inapplicable"] },
          ]),
        })
      ).toBe("partial");
    });

    it("is partial when outcomes is empty", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: [] },
            { expected: "failed", outcomes: ["failed"] },
            { expected: "inapplicable", outcomes: ["inapplicable"] },
          ]),
        })
      ).toBe("partial");
    });

    it('is partial if untested is mixed with "tested" outcomes', () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: ["cantTell", "passed"] },
            { expected: "failed", outcomes: ["cantTell", "failed"] },
            {
              expected: "inapplicable",
              outcomes: ["untested", "inapplicable", "cantTell"],
            },
          ]),
        })
      ).toBe("partial");
    });
  });

  describe("minimal consistency", () => {
    it("is minimal when passed has a cantTell, and no true positives", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: ["cantTell"] },
            { expected: "failed", outcomes: ["passed"] },
            { expected: "inapplicable", outcomes: ["inapplicable"] },
          ]),
        })
      ).toBe("minimal");
    });

    it("is minimal when failed has a cantTell, and no true positives", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: ["passed"] },
            { expected: "failed", outcomes: ["cantTell"] },
            { expected: "inapplicable", outcomes: ["inapplicable"] },
          ]),
        })
      ).toBe("minimal");
    });

    it("is not minimal when inapplicable has a cantTell, and no true positives", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: toTestResults([
            { expected: "passed", outcomes: ["passed"] },
            { expected: "failed", outcomes: ["cantTell"] },
            { expected: "inapplicable", outcomes: ["cantTell"] },
          ]),
        })
      ).toBeNull();
    });
  });
});
