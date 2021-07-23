import { outdent } from "outdent";
import { getMarkdownAstNodesOfType } from "../get-markdown-ast-nodes-of-type";
import { parseMarkdown } from "../parse-page";

describe("utils", () => {
  describe("getMarkdownAstNodesOfType", () => {
    it("returns a list of AST nodes by type", () => {
      const ast = parseMarkdown(outdent`
        hello

        world
      `);
      const out = getMarkdownAstNodesOfType(ast, "paragraph");
      expect(out).toHaveLength(2);
    });
  });
});
