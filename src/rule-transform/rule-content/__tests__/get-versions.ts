import { getVersions } from "../get-versions";

describe("rule-content", () => {
  describe("get-changelog", () => {
    it("returns a static changelog", () => {
      const log = getVersions();
      expect(log).toBe(`{% include_relative _versions.md %}`);
    });
  });
});
