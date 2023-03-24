import * as path from "path";
import { readFileSync } from "fs";
import { RulePage, TestCaseJson, TestCase } from "../../types";
import { getRulePages } from "../../utils/get-page-data";
import { createFile } from "../../utils/create-file";
import { extractTestCases, TestCaseData } from "../extract-test-cases";
import { updateTestCaseJson } from "../update-test-case-json";

describe("build-examples", () => {
  describe("update-test-case-json", () => {
    let testCount = 0;
    let ruleData: RulePage;
    let testCaseData: TestCaseData[];
    const jsonPath = path.resolve(__dirname, "./assets/mock-testcases.json");
    const rulesDir = path.resolve(__dirname, "./assets/");
    const baseUrl = "https://act-rules.github.io/";
    const pageUrl = "https://act-rules.github.io/rules/";
    let oldTestCaseJson: TestCaseJson;
    let oldTestCases: TestCase[];

    beforeEach(() => {
      testCount = 0;
      const jsonText = readFileSync(jsonPath, "utf8");
      oldTestCaseJson = JSON.parse(jsonText) as TestCaseJson;
      oldTestCases = oldTestCaseJson.testcases;
      ruleData = getRulePages(rulesDir, ".", ["abc123"])[0];
      testCaseData = extractTestCases(ruleData, baseUrl, pageUrl);
      createFile.mock();
    });

    afterEach(() => {
      createFile.resetMock();
    });

    it("calls to update the testcases.json file", async () => {
      await updateTestCaseJson(jsonPath, baseUrl, testCaseData);
      const calls = createFile.calls();
      expect(calls).toHaveLength(1);
      expect(calls[0].path).toBe(jsonPath);
    });

    it("returns the updated testcases.json file", async () => {
      const tcJson = await updateTestCaseJson(jsonPath, baseUrl, testCaseData);
      const calls = createFile.calls();
      expect(calls).toHaveLength(1);
      expect(calls[0].content).toEqual(tcJson);
    });

    it("correctly updated the testcases count", async () => {
      const tcJson = await updateTestCaseJson(jsonPath, baseUrl, testCaseData);
      expect(tcJson.count).toEqual(tcJson.testcases.length);
    });

    it("adds all new test cases", async () => {
      const { testcases } = await updateTestCaseJson(
        jsonPath,
        baseUrl,
        testCaseData
      );
      const testCaseIds = testcases.map(({ testcaseId }) => testcaseId);

      testCaseData.forEach(({ metadata }) => {
        expect(testCaseIds).toContain(metadata.testcaseId);
        testCount++;
      });
      expect(testCount).toBe(3);
    });

    it("removes proposed test cases", async () => {
      const { testcases } = await updateTestCaseJson(
        jsonPath,
        baseUrl,
        testCaseData
      );
      const testcaseIds = testcases.map(({ testcaseId }) => testcaseId);
      oldTestCases.forEach(({ testcaseId, approved }) => {
        if (!approved) {
          expect(testcaseIds).not.toContain(testcaseId);
          testCount++;
        }
      });
      expect(testCount).toBe(2);
    });

    it("preserves approved test cases", async () => {
      const { testcases } = await updateTestCaseJson(
        jsonPath,
        baseUrl,
        testCaseData
      );
      const testcaseIds = testcases.map(({ testcaseId }) => testcaseId);
      oldTestCases.forEach(({ testcaseId, approved }) => {
        if (approved) {
          expect(testcaseIds).toContain(testcaseId);
          testCount++;
        }
      });
      expect(testCount).toBe(1);
    });

    it("does not add proposed test cases if they are already approved", async () => {
      const approvedRule = oldTestCases.find(
        ({ approved }) => approved
      ) as TestCase;
      testCaseData[0].metadata.testcaseId = approvedRule.testcaseId;

      const { testcases } = await updateTestCaseJson(
        jsonPath,
        baseUrl,
        testCaseData
      );
      const filteredTestCases = testcases.filter(({ testcaseId }) => {
        return testcaseId === approvedRule.testcaseId;
      });
      expect(filteredTestCases).toHaveLength(1);
      expect(filteredTestCases[0]).toEqual(approvedRule);
    });

    it("skips tests from deprecated rules", async () => {
      const { testcases } = await updateTestCaseJson(
        jsonPath,
        baseUrl,
        testCaseData.map((testCase) => ({
          ...testCase,
          deprecated: true,
        }))
      );
      expect(testcases).toHaveLength(1);
    });

    it("removes tests from deprecated approved rules", async () => {
      testCaseData = [
        {
          ...testCaseData[0],
          deprecated: true,
          metadata: {
            ...testCaseData[0].metadata,
            ruleId: "abc123",
            testcaseId: "261dcd3214e87532fc2f9c8db7fdce05de9e07f0",
          },
        },
      ];
      const { testcases } = await updateTestCaseJson(
        jsonPath,
        baseUrl,
        testCaseData
      );
      expect(testcases).toHaveLength(0);
    });
  });
});
