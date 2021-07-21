import outdent from "outdent";
import { addCodeTemplate } from "../add-code-template";

describe("build-examples", () => {
  describe("add-code-template", () => {
    const code = "<p>Hello</p>\n</p>World</p>";

    it("does nothing to non-html code", () => {
      const snippet1 = addCodeTemplate(code, "css", "foo");
      const snippet2 = addCodeTemplate(code, "xml", "foo");
      const snippet3 = addCodeTemplate(code, "svg", "foo");

      expect(snippet1).toBe(code);
      expect(snippet2).toBe(code);
      expect(snippet3).toBe(code);
    });

    it("returns HTML that has a doctype as is", () => {
      const input = `<!DOCTYPE html>\n${code}`;
      const snippet = addCodeTemplate(input, "html", "foo");
      expect(snippet).toBe(input);
    });

    it("uses the template if there is no doctype or HTML element", () => {
      const snippet = addCodeTemplate(code, "html", "foo");
      expect(snippet).toBe(outdent`
        <!DOCTYPE html>
        <html lang="en">
        <head>
        \t<title>foo</title>
        </head>
        <body>
        \t<p>Hello</p>
        \t</p>World</p>
        </body>
        </html>
      `);
    });

    it("adds an HTML 5 doctype to HTML", () => {
      const snippet = addCodeTemplate(
        `<html>\n${code}\n</html>`,
        "html",
        "foo"
      );
      expect(snippet).toBe(outdent`
        <!DOCTYPE html>
        <html>
        <p>Hello</p>
        </p>World</p>
        </html>
      `);
    });

    it("adds an XHTML 1.1 doctype to XHTML documents", () => {
      const snippet = addCodeTemplate(
        `<html>\n${code}\n</html>`,
        "xhtml",
        "foo"
      );
      expect(snippet).toBe(outdent`
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
        <html>
        <p>Hello</p>
        </p>World</p>
        </html>
      `);
    });
  });
});
