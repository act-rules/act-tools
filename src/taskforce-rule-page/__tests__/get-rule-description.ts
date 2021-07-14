import { RuleFrontMatter } from "src/types";
import { getRuleDescription } from "../get-rule-description";

describe("taskforce-markdown", () => {
  describe("get-rule-description", () => {
    const frontmatter = {
      description: "hello world\nwelcome to act",
    } as RuleFrontMatter;

    it('starts with a "description" heading', () => {
      const lines = getRuleDescription({ frontmatter }).split("\n");
      expect(lines[0]).toBe("## Description");
    });

    it("has an empty line after the heading", () => {
      const lines = getRuleDescription({ frontmatter }).split("\n");
      expect(lines[1]).toBe("");
    });

    it("has has the description after the empty line", () => {
      const lines = getRuleDescription({ frontmatter }).split("\n");
      const restLines = lines.splice(2);
      expect(restLines.join("\n")).toBe(frontmatter.description);
    });
  });
});
