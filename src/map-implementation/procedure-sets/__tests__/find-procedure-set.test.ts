import { findProcedureSet } from "../find-procedure-set";
import { ActProcedureMapping, TestResult } from "../../types";

describe("findProcedureSet", () => {
  const procedureDefaults = {
    procedureName: "abc123",
    ruleId: "abc123",
    consistentRequirements: true,
  };
  const correctPass: TestResult = {
    testcaseId: "p/p",
    expected: "passed",
    outcomes: ["passed"],
  };
  const correctFail: TestResult = {
    testcaseId: "f/f",
    expected: "failed",
    outcomes: ["failed"],
  };
  const correctInapplicable: TestResult = {
    testcaseId: "na/na",
    expected: "inapplicable",
    outcomes: ["inapplicable"],
  };
  const falseNegativeFail: TestResult = {
    testcaseId: "f/p",
    expected: "failed",
    outcomes: ["passed"],
  };
  const cantTellPass: TestResult = {
    testcaseId: "p/ct",
    expected: "passed",
    outcomes: ["cantTell"],
  };
  const falsePositivePass: TestResult = {
    testcaseId: "f/p",
    expected: "passed",
    outcomes: ["failed"],
  };
  const completeProcedure1: ActProcedureMapping = {
    ...procedureDefaults,
    testResults: [correctPass, correctFail, correctInapplicable],
  };
  const completeProcedure2: ActProcedureMapping = {
    ...procedureDefaults,
    testResults: [correctPass, correctFail],
  };
  const partialProcedure1: ActProcedureMapping = {
    ...procedureDefaults,
    testResults: [correctPass, correctFail, falseNegativeFail],
  };
  const partialProcedure2: ActProcedureMapping = {
    ...procedureDefaults,
    consistentRequirements: false,
    testResults: [correctPass, correctFail],
  };
  const minimalProcedure: ActProcedureMapping = {
    ...procedureDefaults,
    testResults: [cantTellPass, correctInapplicable],
  };
  const inconsistentProcedure: ActProcedureMapping = {
    ...procedureDefaults,
    testResults: [falsePositivePass, correctFail],
  };

  it("returns an empty set when no procedures are given", () => {
    const procedureSet = findProcedureSet([]);
    expect(procedureSet).toEqual({
      procedureSetName: "",
      consistency: null,
      coverage: null,
      procedures: [],
    });
  });

  it("reports inconsistent results if nothing better exists", () => {
    const procedureSet = findProcedureSet([inconsistentProcedure]);
    expect(procedureSet).toHaveProperty("consistency", null);
    expect(procedureSet.procedures).toEqual([inconsistentProcedure]);
  });

  it("reports minimal over inconsistent", () => {
    const procedureSet = findProcedureSet([
      minimalProcedure,
      inconsistentProcedure,
    ]);
    expect(procedureSet).toHaveProperty("consistency", "minimal");
    expect(procedureSet.procedures).toEqual([minimalProcedure]);
  });

  it("reports partial over minimal or inconsistent", () => {
    const procedureSet = findProcedureSet([
      partialProcedure1,
      partialProcedure2,
      minimalProcedure,
      inconsistentProcedure,
    ]);
    expect(procedureSet).toHaveProperty("consistency", "partial");
    expect(procedureSet.procedures).toEqual([
      partialProcedure1,
      partialProcedure2,
    ]);
  });

  it("reports complete consistency over partial, minimal or inconsistent", () => {
    const procedureSet = findProcedureSet([
      completeProcedure1,
      completeProcedure2,
      partialProcedure1,
      partialProcedure2,
      minimalProcedure,
      inconsistentProcedure,
    ]);
    expect(procedureSet).toHaveProperty("consistency", "complete");
    expect(procedureSet.procedures).toEqual([
      completeProcedure1,
      completeProcedure2,
    ]);
  });

  describe("combining partials", () => {
    it("can become complete", () => {
      const procedureSet = findProcedureSet([
        {
          ...procedureDefaults,
          testResults: [
            { ...correctFail, testcaseId: "fail1" },
            { ...falseNegativeFail, testcaseId: "fail2" },
          ],
        },
        {
          ...procedureDefaults,
          testResults: [
            { ...falseNegativeFail, testcaseId: "fail1" },
            { ...correctFail, testcaseId: "fail2" },
          ],
        },
      ]);
      expect(procedureSet).toHaveProperty("consistency", "complete");
    });

    it("is not complete with consistentRequirements: false", () => {
      const procedureSet = findProcedureSet([
        {
          ...procedureDefaults,
          testResults: [
            { ...correctFail, testcaseId: "fail1" },
            { ...falseNegativeFail, testcaseId: "fail2" },
          ],
        },
        {
          ...procedureDefaults,
          consistentRequirements: false,
          testResults: [
            { ...falseNegativeFail, testcaseId: "fail1" },
            { ...correctFail, testcaseId: "fail2" },
          ],
        },
      ]);
      expect(procedureSet).toHaveProperty("consistency", "partial");
    });
  });
});
