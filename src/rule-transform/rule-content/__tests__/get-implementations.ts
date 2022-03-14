import { getImplementations } from "../get-implementations";

describe("rule-content", () => {
  describe("get-implementations", () => {
    it("is empty when `matrix` is undefined", () => {
      const out = getImplementations(null, null, {});
      expect(out).toEqual("");
    });

    it("is empty for `matrix: false`", () => {
      const out = getImplementations(null, null, { matrix: false });
      expect(out).toEqual("");
    });

    it("returns an approved the implementation file for `matrix:true`", () => {
      const out = getImplementations(null, null, { matrix: true });
      expect(out).toContain("_implementation-approved.md");
    });

    it("returns includes the implementation file for `matrix:true, proposed: true`", () => {
      const out = getImplementations(null, null, {
        matrix: true,
        proposed: true,
      });
      expect(out).toContain("_implementation-proposed.md");
    });
  });
});
