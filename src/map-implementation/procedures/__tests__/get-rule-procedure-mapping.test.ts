import { getRuleProcedureMapping } from "../get-rule-procedure-mapping";
import { getTestData, randomStr } from "../../__test-utils__";
import { getTestResult } from "../get-test-result";
import { ActAssertion } from "../../types";

describe("getRuleProcedureMapping", () => {
  it("returns a procedure mapping for a single procedure", () => {
    const { testCase, actAssertion, procedureName, failedRequirements } =
      getTestData();
    const mappings = getRuleProcedureMapping([testCase], [actAssertion]);
    const testResult = getTestResult(testCase, [actAssertion]);
    expect(mappings).toEqual([
      {
        procedureName,
        failedRequirements,
        testResults: [testResult],
      },
    ]);
  });

  it("returns a single procedure mapping for a procedure with multiple assertions", () => {
    const { testCase, actAssertion, procedureName, failedRequirements } =
      getTestData();
    const assertions: ActAssertion[] = [
      actAssertion,
      { ...actAssertion, outcome: "passed" },
    ];
    const mappings = getRuleProcedureMapping([testCase], assertions);
    const testResult = getTestResult(testCase, assertions);

    expect(mappings).toEqual([
      {
        procedureName,
        failedRequirements,
        testResults: [testResult],
      },
    ]);
  });

  it("returns a procedure mapping for each procedure", () => {
    const { testCase, actAssertion, failedRequirements } = getTestData();
    const assertion2 = { ...actAssertion, procedureName: "other procedure" };
    const mappings = getRuleProcedureMapping(
      [testCase],
      [actAssertion, assertion2]
    );

    expect(mappings).toEqual([
      {
        procedureName: actAssertion.procedureName,
        failedRequirements,
        testResults: [getTestResult(testCase, [actAssertion])],
      },
      {
        procedureName: assertion2.procedureName,
        failedRequirements,
        testResults: [getTestResult(testCase, [assertion2])],
      },
    ]);
  });

  it("returns a test result for each test case", () => {
    const { testCase, actAssertion, procedureName, failedRequirements } =
      getTestData();
    const testCaseId2 = randomStr(60);
    const testCases = [testCase, { ...testCase, testcaseId: testCaseId2 }];
    const assertion2 = { ...actAssertion, testCaseId: testCaseId2 };
    const mappings = getRuleProcedureMapping(testCases, [
      actAssertion,
      assertion2,
    ]);

    expect(mappings).toEqual([
      {
        procedureName,
        failedRequirements,
        testResults: [
          getTestResult(testCases[0], [actAssertion]),
          getTestResult(testCases[1], [assertion2]),
        ],
      },
    ]);
  });

  it("reports failed requirements", () => {
    const failedRequirements = ["WCAG2:info-and-relationships"];
    const { testCase, actAssertion } = getTestData({ failedRequirements });
    const mapping = getRuleProcedureMapping([testCase], [actAssertion])[0];
    expect(mapping.failedRequirements).toEqual(failedRequirements);
  });
});
