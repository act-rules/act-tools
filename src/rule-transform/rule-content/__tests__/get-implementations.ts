import { getImplementations } from "../get-implementations";
import { RuleFrontMatter } from "src/types";

describe("rule-content", () => {
  const frontmatter = { id: 'abc123' } as RuleFrontMatter;
  describe("get-implementations", () => {
    it('is empty when `matrix` is undefined', () => {
      const out = getImplementations({ frontmatter }, null, { });
      expect(out).toEqual('');
    });

    it('is empty for `matrix: false`', () => {
      const out = getImplementations({ frontmatter }, null, { matrix: false });
      expect(out).toEqual('');
    });

    it('returns includes the implementation file for `matrix:true`', () => {
      const out = getImplementations({ frontmatter }, null, { matrix: true });
      expect(out).toContain('implementations/abc123.md');
    });
  });
});
