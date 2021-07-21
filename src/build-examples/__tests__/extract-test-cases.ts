import outdent from 'outdent';
import * as path from 'path'
import { getRulePages } from '../../utils/get-markdown-data';
import { extractTestCases } from '../extract-test-cases';

describe('build-examples', () => {
  describe('extract-test-cases', () => {
    const rulesDir = path.resolve(__dirname, './assets/')
    const baseUrl = 'https://act-rules.github.io'
    const ruleId = 'abc123';
    const ruleData = getRulePages(rulesDir, [ruleId])[0]
    const testcaseId = 'ab063d4db6744b2f662f151660b025d3b0625a62';
    
    it('extracts test cases from rule data', () => {
      const filePath = `testcases/${ruleId}/${testcaseId}.html`
      const testCases = extractTestCases(ruleData, { baseUrl })
      expect(testCases).toHaveLength(3);

      expect(testCases[0].filePath).toBe(filePath);
      expect(testCases[0].codeSnippet).toBe(outdent`
        <!DOCTYPE html>
        <html>
        <p>hello world</p>
      `);
      expect(testCases[0].metadata).toEqual({
        ruleId,
        testcaseId,
        expected: "passed",
        relativePath: filePath,
        ruleAccessibilityRequirements: undefined,
        ruleName: undefined,
        rulePage: `https://act-rules.github.io/rules/${ruleId}`,
        testcaseTitle: "Passed Example 1",
        url: `${baseUrl}/${filePath}`,
      })
    });
  })
})
