import { Parent, Literal } from "unist";
import { outdent } from "outdent";
import { parseMarkdown, parsePage } from "../parse-page";

describe("utils", () => {
  describe("parseMarkdown", () => {
    it("returns a markdown AST", () => {
      const ast = parseMarkdown(outdent`
        Hello world
      `) as Parent;
      expect(ast.type).toBe("root");
      expect(ast.children).toHaveLength(1);

      const paragraph = ast.children[0] as Parent;
      expect(paragraph.type).toBe("paragraph");
      expect(paragraph.children).toHaveLength(1);

      const text = paragraph.children[0] as Literal;
      expect(text.value).toBe("Hello world");
    });
  });

  describe("parsePage", () => {
    const pageText = outdent`
      ---
      hello: world
      ---
      Hello world
    `;
    it("returns frontmatter", () => {
      const page = parsePage(pageText);
      expect(page.frontmatter).toEqual({ hello: "world" });
    });

    it("returns body", () => {
      const page = parsePage(pageText);
      expect(page.body).toBe("Hello world");
    });

    it("returns markdownAST", () => {
      const page = parsePage(pageText);
      const AST = parseMarkdown("Hello world");
      expect(page.markdownAST).toEqual(AST);
    });
  });
});
