import { testCaseHash } from '../test-case-hash'

describe('build-examples', () => {
  describe('test-case-hash', () => {
    it('returns a sha1 hex hash', () => {
      const hash = testCaseHash('hello world');
      expect(hash).toBe('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed');
    });

    it('is not sensitive to changes in whitespace', () => {
      const hash1 = testCaseHash(' hello\n \tworld ');
      const hash2 = testCaseHash('hello world');
      expect(hash1).toBe(hash2);
    });
  });
});