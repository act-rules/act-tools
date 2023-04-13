import { findProcedureSet } from "../find-procedure-set";
import { ActProcedureMapping, TestResult } from "../../types";
import { getTestCaseResults } from "../get-test-case-results";
import { toTestResult } from "../../__test-utils__";

describe("findProcedureSet", () => {
  const procedureDefaults = {
    procedureName: "abc123",
    ruleId: "abc123",
    failedRequirements: [],
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
    failedRequirements: ["WCAG2:foo"],
    testResults: [correctPass, correctFail],
  };
  const cantTellOnlyProcedure: ActProcedureMapping = {
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

  it("reports partially consistent (cantTell only) over inconsistent", () => {
    const procedureSet = findProcedureSet([
      cantTellOnlyProcedure,
      inconsistentProcedure,
    ]);
    expect(procedureSet).toHaveProperty("consistency", "partial");
    expect(procedureSet.testCaseResults).toEqual(
      getTestCaseResults([cantTellOnlyProcedure])
    );
  });

  it("reports both partial with failed, and partial due to canTells over inconsistent", () => {
    const procedureSet = findProcedureSet([
      partialProcedure1,
      partialProcedure2,
      cantTellOnlyProcedure,
      inconsistentProcedure,
    ]);
    expect(procedureSet).toHaveProperty("consistency", "partial");
    expect(procedureSet.testCaseResults).toEqual(
      getTestCaseResults([
        partialProcedure1,
        partialProcedure2,
        cantTellOnlyProcedure,
      ])
    );
  });

  it("reports complete consistency over partial, or inconsistent", () => {
    const procedureSet = findProcedureSet([
      completeProcedure1,
      completeProcedure2,
      partialProcedure1,
      partialProcedure2,
      cantTellOnlyProcedure,
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
          failedRequirements: ["WCAG2:whatever"],
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
