import outdent from "outdent";
import * as path from "path";
import { getRulePages } from "../../utils/get-page-data";
import { extractTestCases } from "../extract-test-cases";

describe("build-examples", () => {
  describe("extract-test-cases", () => {
    const rulesDir = path.resolve(__dirname, "./assets/");
    const baseUrl = "https://act-rules.github.io/";
    const pageUrl = "https://act-rules.github.io/rules/";
    const ruleId = "abc123";
    const ruleData = getRulePages(rulesDir, [ruleId])[0];
    const testcaseId = "0d9b8f03360c4eb9a9fa11cc07e7cc9e78192403";

    it("extracts test cases from rule data", () => {
      const filePath = `testcases/${ruleId}/${testcaseId}.html`;
      const testCases = extractTestCases(ruleData, baseUrl, pageUrl);
      expect(testCases).toHaveLength(3);

      expect(testCases[0].filePath).toBe(filePath);
      expect(testCases[0].codeSnippet).toBe(outdent`
        <!DOCTYPE html>
        <html>
          <p>hello world</p>
        </html>
      `);
      expect(testCases[0].metadata).toEqual({
        ruleId,
        testcaseId,
        expected: "passed",
        relativePath: filePath,
        ruleAccessibilityRequirements: undefined,
        ruleName: undefined,
        rulePage: pageUrl + ruleId,
        testcaseTitle: "Passed Example 1",
        url: baseUrl + filePath,
      });
    });
  });
});
