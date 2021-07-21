import outdent from "outdent";
import { parsePage } from "../../../utils/parse-page";
import { getReferenceLinks } from "../get-reference-links";
import { RulePage } from "../../../types";
import { createGlossary } from "../../__test-utils";

describe("rule-content", () => {
  describe("get-reference-links", () => {
    const foo = outdent`
      Foo is great.

      [great]: https://w3.org/
    `;

    const bar = outdent`
      Bar is greater than [foo][]

      [w3c]: https://w3.org
    `;

    const page = outdent`
      [hello][], [w3c][]

      [w3c]: https://w3.org 'W3C website'
      [hello]: #hello
    `;

    it("returns a string", () => {
      const rulePage = parsePage(page) as RulePage;
      const referenceLinks = getReferenceLinks(rulePage, []);
      expect(referenceLinks).toBe(outdent`
        [hello]: #hello
        [w3c]: https://w3.org 'W3C website'
      `);
    });

    it("returns references from the glossary", () => {
      const rulePage = parsePage(page) as RulePage;
      const glossary = createGlossary({ foo });
      const referenceLinks = getReferenceLinks(rulePage, glossary);
      expect(referenceLinks).toBe(outdent`
        [great]: https://w3.org/
        [hello]: #hello
        [w3c]: https://w3.org 'W3C website'
      `);
    });

    it("removes duplicate references", () => {
      const rulePage = parsePage(page) as RulePage;
      const glossary = createGlossary({ bar });
      const referenceLinks = getReferenceLinks(rulePage, glossary);
      expect(referenceLinks).toBe(outdent`
        [hello]: #hello
        [w3c]: https://w3.org 'W3C website'
      `);
    });
  });
});
