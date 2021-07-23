import { indent } from "../indent";

describe("utils", () => {
  describe("indent", () => {
    it("indents a string", () => {
      const indented = indent("hello\nworld");
      expect(indented).toBe("  hello\n  world");
    });

    it("can indent with tabs", () => {
      const indented = indent("hello\nworld", "\t");
      expect(indented).toBe("\t\thello\n\t\tworld");
    });

    it("can indent to a predefined depth", () => {
      const indented = indent("hello\nworld", "\t", 1);
      expect(indented).toBe("\thello\n\tworld");
    });
  });
});
