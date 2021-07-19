import outdent from "outdent";
import { getChangelog } from "../get-changelog";

describe("rule-content", () => {
  describe("get-changelog", () => {
    it("returns a static changelog", () => {
      const log = getChangelog();
      expect(log).toBe(outdent`
        ## Changelog

        This is the first version of this ACT rule.
      `);
    });
  });
});
