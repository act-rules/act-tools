import outdent from "outdent";
import { parseMarkdown } from "../../../utils/parse-markdown";
import { getRuleBody } from "../get-rule-body";

describe("rule-content", () => {
  describe("get-rule-body", () => {
    it("returns the trimmed body if there are no reference links", () => {
      const body = outdent`
        ## Hello world

      `; // indent is intentional
      const markdownAST = parseMarkdown(body);
      const stripped = getRuleBody({ body, markdownAST });

      expect(stripped).toBe(body.trim());
    });

    it("returns content without reference links", () => {
      const content = outdent`
        ## Hello
        Welcome to the [party][] [time][] in the [ACT Taskforce][]!

        ## Shopping list
        - cake
        - chips
        - party hats

      `;
      const references = outdent`
        [party]: http://w3.org
        [time]: <http://w3.org> 'hello world'

        [act-taskforce]: https://act-rules.github.io/

      `; // blank line is intentional
      const body = content + "\n" + references;
      const markdownAST = parseMarkdown(body);

      const stripped = getRuleBody({ body, markdownAST });
      expect(stripped).toBe(content.trim());
    });
  });
});
