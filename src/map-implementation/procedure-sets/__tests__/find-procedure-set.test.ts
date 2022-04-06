import { findProcedureSet } from "../find-procedure-set";
import { ActProcedureMapping, TestResult } from "../../types";
import { getTestCaseResults } from "../get-test-case-results";
import { toTestResult } from "../../__test-utils__";

describe("findProcedureSet", () => {
  const procedureDefaults = {
    procedureName: "abc123",
    ruleId: "abc123",
    consistentRequirements: true,
  };
  const correctPass: TestResult = toTestResult({
    testcaseId: "p/p",
    expected: "passed",
    outcomes: ["passed"],
  });
  const correctFail: TestResult = toTestResult({
    testcaseId: "f/f",
    expected: "failed",
    outcomes: ["failed"],
  });
  const correctInapplicable: TestResult = toTestResult({
    testcaseId: "na/na",
    expected: "inapplicable",
    outcomes: ["inapplicable"],
  });
  const falseNegativeFail: TestResult = toTestResult({
    testcaseId: "f/p",
    expected: "failed",
    outcomes: ["passed"],
  });
  const cantTellPass: TestResult = toTestResult({
    testcaseId: "p/ct",
    expected: "passed",
    outcomes: ["cantTell"],
  });
  const falsePositivePass: TestResult = toTestResult({
    testcaseId: "f/p",
    expected: "passed",
    outcomes: ["failed"],
  });
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
      procedureNames: [],
      consistency: null,
      coverage: null,
      testCaseResults: [],
    });
  });

  it("reports inconsistent results if nothing better exists", () => {
    const procedureSet = findProcedureSet([inconsistentProcedure]);
    expect(procedureSet).toHaveProperty("consistency", null);
    expect(procedureSet.testCaseResults).toEqual(
      getTestCaseResults([inconsistentProcedure])
    );
  });

  it("reports minimal over inconsistent", () => {
    const procedureSet = findProcedureSet([
      minimalProcedure,
      inconsistentProcedure,
    ]);
    expect(procedureSet).toHaveProperty("consistency", "minimal");
    expect(procedureSet.testCaseResults).toEqual(
      getTestCaseResults([minimalProcedure])
    );
  });

  it("reports partial over minimal or inconsistent", () => {
    const procedureSet = findProcedureSet([
      partialProcedure1,
      partialProcedure2,
      minimalProcedure,
      inconsistentProcedure,
    ]);
    expect(procedureSet).toHaveProperty("consistency", "partial");
    expect(procedureSet.testCaseResults).toEqual(
      getTestCaseResults([partialProcedure1, partialProcedure2])
    );
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
