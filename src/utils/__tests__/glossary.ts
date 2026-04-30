import outdent from "outdent";
import {
  getGlossaryHeading,
  normalizeHeadingLevels,
  getGlossaryBody,
} from "../glossary";

describe("utils", () => {
  describe("getGlossaryHeading", () => {
    it("returns a heading with the correct level", () => {
      const heading = getGlossaryHeading(
        { title: "Outcome", key: "outcome" },
        2,
      );
      expect(heading).toBe("## Outcome {#outcome}");
    });

    it("returns a level-3 heading when level is 3", () => {
      const heading = getGlossaryHeading(
        { title: "Visible", key: "visible" },
        3,
      );
      expect(heading).toBe("### Visible {#visible}");
    });
  });

  describe("normalizeHeadingLevels", () => {
    it("decrements all heading levels by one", () => {
      const input = "#### Item\n##### Subitem\n###### Deep";
      expect(normalizeHeadingLevels(input)).toBe(
        "### Item\n#### Subitem\n##### Deep",
      );
    });

    it("does not decrement level-1 headings", () => {
      const input = "# Top\n## Section";
      expect(normalizeHeadingLevels(input)).toBe("# Top\n# Section");
    });

    it("preserves leading spaces before headings", () => {
      expect(normalizeHeadingLevels("  #### indented")).toBe("  ### indented");
    });
  });

  describe("getGlossaryBody", () => {
    const noMarkdownAST = { children: [] };

    describe('mode: "full"', () => {
      it("returns the trimmed full body", () => {
        const definition = {
          body: "  Some content\n\n### Sub\n\nMore.  ",
          markdownAST: noMarkdownAST,
        };
        expect(getGlossaryBody(definition, { mode: "full" })).toBe(
          "Some content\n\n### Sub\n\nMore.",
        );
      });

      it("normalizes heading levels when normalizeHeadings is true", () => {
        const definition = {
          body: "First.\n\n### Sub\n",
          markdownAST: noMarkdownAST,
        };
        expect(
          getGlossaryBody(definition, {
            mode: "full",
            normalizeHeadings: true,
          }),
        ).toBe("First.\n\n## Sub");
      });
    });

    describe('mode: "rule"', () => {
      it("strips content from the first ## heading onwards", () => {
        const definition = {
          body: outdent`
            You can see it.

            ## References

            Ignore me
          `,
          markdownAST: noMarkdownAST,
        };
        expect(getGlossaryBody(definition, { mode: "rule" })).toBe(
          "You can see it.",
        );
      });

      it("strips trailing reference definitions when there is no heading", () => {
        const refOffset = "You can see [it][].\n\n".length;
        const definition = {
          body: "You can see [it][].\n\n[it]: https://w3.org/\n",
          markdownAST: {
            children: [
              {
                type: "definition",
                position: { start: { offset: refOffset } },
              },
            ],
          },
        };
        expect(getGlossaryBody(definition, { mode: "rule" })).toBe(
          "You can see [it][].",
        );
      });

      it("returns full trimmed body when there is no heading and no reference definitions", () => {
        const definition = {
          body: "  Plain content.  ",
          markdownAST: noMarkdownAST,
        };
        expect(getGlossaryBody(definition, { mode: "rule" })).toBe(
          "Plain content.",
        );
      });
    });
  });
});
