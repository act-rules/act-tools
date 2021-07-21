import * as path from 'path'
import { TestCaseJson } from '../../types';
import { getRulePages } from '../../utils/get-markdown-data';
import { createFile } from '../../utils/create-file'
import { extractTestCases } from '../extract-test-cases';
import { updateTestCaseJson } from '../update-test-case-json';

describe('build-examples', () => {
  describe('update-test-case-json', () => {
    const jsonPath = path.resolve(__dirname, './assets/mock-testcases.json');
    const rulesDir = path.resolve(__dirname, './assets/')
    const baseUrl = 'https://act-rules.github.io'
    const ruleData = getRulePages(rulesDir, ['abc123'])[0]
    const testCases = extractTestCases(ruleData, { baseUrl })
    
    it('updates the testcases.json file', () => {
      createFile.mock();
      updateTestCaseJson(jsonPath, baseUrl, testCases)
      const calls = createFile.calls();
      expect(calls).toHaveLength(1);
      expect(calls[0].path).toBe(jsonPath)

      const update = calls[0].content as TestCaseJson
      expect(update.count).toBe(4)
      expect(update.testcases.length).toBe(4)
    });
  })
})
