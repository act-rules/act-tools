import { joinStrings } from "../join-strings";

describe("utils", () => {
  describe("joinStrings", () => {
    it("joins strings a double line breaks", () => {
      const out = joinStrings("foo", "bar");
      expect(out).toBe("foo\n\nbar");
    });

    it("joins nested arrays with a single line break", () => {
      const out = joinStrings(["foo", "bar"]);
      expect(out).toBe("foo\nbar");
    });

    it("can join strings and arrays of strings", () => {
      const out = joinStrings("foo", ["bar", "baz"]);
      expect(out).toBe("foo\n\nbar\nbaz");
    });
  });
});
