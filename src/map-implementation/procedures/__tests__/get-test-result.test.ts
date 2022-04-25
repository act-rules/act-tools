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
    } = getTestData();
    const testResults = getTestResult(testCase, [actAssertion]);
    expect(testResults).toEqual({
      outcomes: [expected],
      automatic: true,
      testcaseId,
      testCaseName,
      testCaseUrl,
      expected,
    });
  });

  it("reports an outcome for each assertion", () => {
    const {
      testCase,
      actAssertion,
      expected,
      testcaseId,
      testCaseName,
      testCaseUrl,
    } = getTestData();
    const assertions: ActAssertion[] = [
      { ...actAssertion, outcome: "failed" },
      { ...actAssertion, outcome: "passed" },
      { ...actAssertion, outcome: "cantTell" },
    ];
    const testResults = getTestResult(testCase, assertions);
    expect(testResults).toEqual({
      outcomes: ["failed", "passed", "cantTell"],
      automatic: false,
      testcaseId,
      testCaseName,
      testCaseUrl,
      expected,
    });
  });

  it("returns untested when no procedure maps to the result", () => {
    const { testCase, expected, testcaseId, testCaseName, testCaseUrl } =
      getTestData();
    const testResults = getTestResult(testCase, []);
    expect(testResults).toEqual({
      outcomes: ["untested"],
      automatic: false,
      testcaseId,
      testCaseName,
      testCaseUrl,
      expected,
    });
  });

  it("throws if on assertions if the testcaseId is a mismatch", () => {
    const { testCase, actAssertion } = getTestData();
    const badAssertion = { ...actAssertion, testCaseId: randomStr(40) };
    expect(() => {
      getTestResult(testCase, [badAssertion]);
    }).toThrow();
  });
});
