import { outdent } from "outdent";
import { getNodesByType } from "../get-nodes-by-type";
import { parseMarkdown } from "../parse-page";

describe("utils", () => {
  describe("getNodesByType", () => {
    it("returns a list of AST nodes by type", () => {
      const ast = parseMarkdown(outdent`
        hello

        world
      `);
      const out = getNodesByType(ast, "paragraph");
      expect(out).toHaveLength(2);
    });

    it("returns inline nodes", () => {
      const ast = parseMarkdown(outdent`
        [hello](/) to the [world](/).

        Welcome [to mars](/).
      `);
      const out = getNodesByType(ast, "link");
      expect(out).toHaveLength(3);
    });
  });
});
