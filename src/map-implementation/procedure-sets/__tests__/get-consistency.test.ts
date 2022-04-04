import { getConsistency } from "../get-consistency";

describe("getConsistency", () => {
  const procedureDefaults = {
    procedureName: "abc123",
    ruleId: "abc123",
    consistentRequirements: true,
  };

  describe("consistency: null", () => {
    it("is null for false positives on passed", () => {
      expect(
        getConsistency({
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
      ).toBeNull();
    });

    it("is null for false positives on inapplicable", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "inapplicable",
              outcomes: ["passed", "inapplicable"],
            },
            {
              testcaseId: "2",
              expected: "inapplicable",
              outcomes: ["passed", "failed", "inapplicable"],
            },
          ],
        })
      ).toBeNull();
    });

    it("is null with all inapplicable", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["inapplicable"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["inapplicable"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBeNull();
    });

    it("is null for all untested and cantTell outcomes", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["cantTell", "untested"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["cantTell"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["untested", "cantTell", "untested"],
            },
          ],
        })
      ).toBeNull();
    });

    it("is null with no true positives and cantTell on inapplicable", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["cantTell"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["cantTell"],
            },
            {
              testcaseId: "4",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBeNull();
    });
  });

  describe("complete consistency", () => {
    it("is complete when outcomes match expected, and requirements are consistent", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["failed"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBe("complete");
    });

    it("is complete as long as one of the failed outcomes is a true positive", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["passed", "failed"],
            },
            {
              testcaseId: "3",
              expected: "failed",
              outcomes: ["failed", "passed"],
            },
            {
              testcaseId: "4",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBe("complete");
    });

    it("is complete when cantTell is mixed with correct answers", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["cantTell"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["failed", "cantTell"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["inapplicable", "cantTell"],
            },
          ],
        })
      ).toBe("complete");
    });
  });

  describe("partial consistency", () => {
    it("is partial when outcomes match expected, but requirements are inconsistent", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          consistentRequirements: false,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["failed"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBe("partial");
    });

    it("is partial when there is a false negative", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["failed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["passed"], // False negative
            },
            {
              testcaseId: "4",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBe("partial");
    });

    it("is partial when something is untested", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["failed", "untested"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBe("partial");
    });

    it("is partial when outcomes is empty", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: [],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["failed"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBe("partial");
    });

    it('is partial if untested is mixed with "tested" outcomes', () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["cantTell", "passed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["cantTell", "failed"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["untested", "inapplicable", "cantTell"],
            },
          ],
        })
      ).toBe("partial");
    });
  });

  describe("minimal consistency", () => {
    it("is minimal when passed has a cantTell, and no true positives", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["cantTell"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBe("minimal");
    });

    it("is minimal when failed has a cantTell, and no true positives", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["cantTell"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["inapplicable"],
            },
          ],
        })
      ).toBe("minimal");
    });

    it("is not minimal when inapplicable has a cantTell, and no true positives", () => {
      expect(
        getConsistency({
          ...procedureDefaults,
          testResults: [
            {
              testcaseId: "1",
              expected: "passed",
              outcomes: ["passed"],
            },
            {
              testcaseId: "2",
              expected: "failed",
              outcomes: ["cantTell"],
            },
            {
              testcaseId: "3",
              expected: "inapplicable",
              outcomes: ["cantTell"],
            },
          ],
        })
      ).toBeNull();
    });
  });
});
