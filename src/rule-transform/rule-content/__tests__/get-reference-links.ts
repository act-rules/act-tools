import outdent from "outdent";
import { parsePage } from "../../../utils/parse-page";
import { getReferenceLinks } from "../get-reference-links";
import { RulePage } from "../../../types";

describe("rule-content", () => {
  describe("get-reference-links", () => {
    it("returns a string", () => {
      const rulePage = parsePage(outdent`
        [hello][], [w3c][]

        [hello]: #hello
        [w3c]: //w3.org 'W3C website'
      `) as RulePage;

      const referenceLinks = getReferenceLinks(rulePage);
      expect(referenceLinks).toBe(outdent`
        [hello]: #hello
        [w3c]: //w3.org 'W3C website'
      `);
    });
  });
});
