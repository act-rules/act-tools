import { getTestCaseResults } from "../get-test-case-results";
import { getTestData, randomStr } from "../../__test-utils__";

describe("getTestCaseResults", () => {
  it("maps a single procedure to a single test result", () => {
    const {
      procedure,
      expected,
      outcomes,
      procedureName,
      testcaseId,
      testCaseName,
      testCaseUrl,
    } = getTestData();
    const mapping = getTestCaseResults([procedure]);
    expect(mapping).toEqual([
      {
        testcaseId,
        testCaseName,
        testCaseUrl,
        expected,
        procedureResults: [{ procedureName, outcomes }],
      },
    ]);
  }),
    it("maps a single procedure to multiple test results", () => {
      const {
        procedure,
        expected,
        outcomes,
        procedureName,
        testcaseId,
        testCaseName,
        testCaseUrl,
      } = getTestData();
      const testcaseId2 = randomStr(40);
      procedure.testResults.push({
        ...procedure.testResults[0],
        testcaseId: testcaseId2,
      });

      const mapping = getTestCaseResults([procedure]);
      expect(mapping).toEqual([
        {
          testcaseId,
          testCaseName,
          testCaseUrl,
          expected,
          procedureResults: [{ procedureName, outcomes }],
        },
        {
          testcaseId: testcaseId2,
          testCaseName,
          testCaseUrl,
          expected,
          procedureResults: [{ procedureName, outcomes }],
        },
      ]);
    });

  it("maps multiple procedure to a single test result", () => {
    const {
      procedure,
      expected,
      outcomes,
      procedureName,
      testcaseId,
      testCaseName,
      testCaseUrl,
    } = getTestData();
    const procedure2 = { ...procedure, procedureName: "procedure-2" };

    const mapping = getTestCaseResults([procedure, procedure2]);
    expect(mapping).toEqual([
      {
        testcaseId,
        testCaseName,
        testCaseUrl,
        expected,
        procedureResults: [
          { procedureName, outcomes },
          { procedureName: "procedure-2", outcomes },
        ],
      },
    ]);
  });

  it("maps multiple procedure to multiple test results", () => {
    const {
      procedure,
      expected,
      outcomes,
      procedureName,
      testcaseId,
      testCaseName,
      testCaseUrl,
    } = getTestData();
    const testcaseId2 = randomStr(40);
    procedure.testResults.push({
      ...procedure.testResults[0],
      testcaseId: testcaseId2,
    });
    const procedure2 = { ...procedure, procedureName: "procedure-2" };

    const mapping = getTestCaseResults([procedure, procedure2]);
    expect(mapping).toEqual([
      {
        testcaseId,
        testCaseName,
        expected,
        testCaseUrl,
        procedureResults: [
          { procedureName, outcomes },
          { procedureName: "procedure-2", outcomes },
        ],
      },
      {
        testcaseId: testcaseId2,
        testCaseName,
        testCaseUrl,
        expected,
        procedureResults: [
          { procedureName, outcomes },
          { procedureName: "procedure-2", outcomes },
        ],
      },
    ]);
  });
});
