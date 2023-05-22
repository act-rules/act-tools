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
    const ruleData = getRulePages(rulesDir, "unused", [ruleId])[0];
    const testcaseId = "8d5356fac10c2a57a5d97d934e786e756e12a232";

    it("extracts test cases from rule data", () => {
      const filePath = `testcases/${ruleId}/${testcaseId}.html`;
      const testCases = extractTestCases(ruleData, baseUrl, pageUrl);
      expect(testCases).toHaveLength(3);

      expect(testCases[0].filePath).toBe(filePath);
      expect(testCases[0].codeSnippet).toBe(outdent`
        <!DOCTYPE html>
        <html>
          <img src="/WAI/content-assets/wcag-act-rules/test-assets/alt.jpg" alt="">
        </html>
      `);
      expect(testCases[0].metadata).toEqual({
        ruleId,
        testcaseId,
        expected: "passed",
        relativePath: filePath,
        ruleAccessibilityRequirements: undefined,
        ruleName: undefined,
        rulePage: pageUrl + ruleId + "/",
        testcaseTitle: "Passed Example 1",
        url: baseUrl + filePath,
      });
    });

    it("can report proposed rules", () => {
      const filePath = `testcases/${ruleId}/${testcaseId}.html`;
      const testCases = extractTestCases(ruleData, baseUrl, pageUrl, true);
      expect(testCases).toHaveLength(3);

      expect(testCases[0].filePath).toBe(filePath);
      expect(testCases[0].codeSnippet).toBe(outdent`
        <!DOCTYPE html>
        <html>
          <img src="/WAI/content-assets/wcag-act-rules/test-assets/alt.jpg" alt="">
        </html>
      `);
      expect(testCases[0].metadata).toEqual({
        ruleId,
        testcaseId,
        expected: "passed",
        relativePath: filePath,
        ruleAccessibilityRequirements: undefined,
        ruleName: undefined,
        rulePage: pageUrl + ruleId + "/proposed/",
        testcaseTitle: "Passed Example 1",
        url: baseUrl + filePath,
      });
    });
  });
});
