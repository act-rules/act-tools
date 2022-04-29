import { getTestResult } from "../get-test-result";
import { ActAssertion } from "../../types";
import { getTestData, randomStr } from "../../__test-utils__";

describe("getTestResult", () => {
  it("returns a single test result", () => {
    const {
      testCase,
      actAssertion,
      expected,
      testcaseId,
      testCaseName,
      testCaseUrl,
      testCaseApproved,
    } = getTestData();
    const testResults = getTestResult(testCase, [actAssertion]);
    expect(testResults).toEqual({
      outcomes: [expected],
      automatic: true,
      testcaseId,
      testCaseName,
      testCaseUrl,
      testCaseApproved,
      expected,
    });
  });

  it("reports an outcome for each assertion", () => {
    const { testCase, actAssertion } = getTestData();
    const assertions: ActAssertion[] = [
      { ...actAssertion, outcome: "failed" },
      { ...actAssertion, outcome: "passed" },
      { ...actAssertion, outcome: "cantTell" },
    ];
    const testResults = getTestResult(testCase, assertions);
    expect(testResults.outcomes).toEqual(["failed", "passed", "cantTell"]);
  });

  it("returns untested when no procedure maps to the result", () => {
    const { testCase } = getTestData();
    const testResults = getTestResult(testCase, []);
    expect(testResults.outcomes).toEqual(["untested"]);
  });

  it("throws if on assertions if the testcaseId is a mismatch", () => {
    const { testCase, actAssertion } = getTestData();
    const badAssertion = { ...actAssertion, testCaseId: randomStr(40) };
    expect(() => {
      getTestResult(testCase, [badAssertion]);
    }).toThrow();
  });
});
