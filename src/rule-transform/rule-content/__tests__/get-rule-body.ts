import outdent from "outdent";
import { Parent } from "unist";
import { parseMarkdown } from "../../../utils/parse-page";
import { getRuleBody } from "../get-rule-body";
import { RuleFrontMatter } from "../../../types";

describe("rule-content", () => {
  describe("get-rule-body", () => {
    it("returns the trimmed body if there are no reference links", () => {
      const body = outdent`
        ## Hello world

      `; // indent is intentional
      const markdownAST = parseMarkdown(body) as Parent;
      const frontmatter = {
        rule_type: "atomic",
        input_aspects: [""],
      } as RuleFrontMatter;
      const stripped = getRuleBody({ body, markdownAST, frontmatter });

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
      const markdownAST = parseMarkdown(body) as Parent;
      const frontmatter = {
        rule_type: "atomic",
        input_aspects: [""],
      } as RuleFrontMatter;

      const stripped = getRuleBody({ body, markdownAST, frontmatter });
      expect(stripped).toBe(content.trim());
    });

    it("returns content without examples", () => {
      const content = outdent`
        ## Hello
        Welcome to the [party][] [time][] in the [ACT Taskforce][]!

        ## Shopping list
        - cake
        - chips
        - party hats

      `;
      const examples = outdent`
        ## Examples

        ### Passed

        ...
      `; // blank line is intentional
      const body = content + "\n" + examples;
      const markdownAST = parseMarkdown(body) as Parent;
      const frontmatter = {
        rule_type: "atomic",
        input_aspects: [""],
      } as RuleFrontMatter;

      const stripped = getRuleBody({ body, markdownAST, frontmatter });
      expect(stripped).toBe(content.trim());
    });

    it("removed individual test cases", () => {
      const content = outdent`
        ## Hello
        Welcome to the [party][] [time][] in the [ACT Taskforce][]!

        ## Shopping list
        - cake
        - chips
        - party hats

      `;
      const examples = outdent`
        ### Passed Example 1

        ...
      `; // blank line is intentional
      const body = content + "\n" + examples;
      const markdownAST = parseMarkdown(body) as Parent;
      const frontmatter = {
        rule_type: "atomic",
        input_aspects: [""],
      } as RuleFrontMatter;

      const stripped = getRuleBody({ body, markdownAST, frontmatter });
      expect(stripped).toBe(content.trim());
    });

    it("added accessibility support note for accessibility tree input aspect", () => {
      const content = outdent`
        ## Hello
        Welcome to the [party][] [time][] in the [ACT Taskforce][]!

        ### Accessibility Support

        There are no accessibility support issues known.

        ### Bibliography

      `;
      const output = outdent`
        ## Hello
        Welcome to the [party][] [time][] in the [ACT Taskforce][]!

        ### Accessibility Support

        \`aria-busy\` exists but, currently, is not widely supported, so the rule ignores it.

        ### Bibliography

      `;
      const body = content + "\n";
      const markdownAST = parseMarkdown(body) as Parent;
      const frontmatter = {
        rule_type: "atomic",
        input_aspects: ["Accessibility tree"],
      } as RuleFrontMatter;

      const stripped = getRuleBody({ body, markdownAST, frontmatter });
      expect(stripped).toBe(output.trim());
    });

    it("added accessibility support note for accessibility tree input aspect to existing notes", () => {
      const content = outdent`
        ## Hello
        Welcome to the [party][] [time][] in the [ACT Taskforce][]!

        ### Accessibility Support

        This is a support note.

        ### Bibliography

      `;
      const output = outdent`
        ## Hello
        Welcome to the [party][] [time][] in the [ACT Taskforce][]!

        ### Accessibility Support

        This is a support note.

        \`aria-busy\` exists but, currently, is not widely supported, so the rule ignores it.

        ### Bibliography

      `;
      const body = content + "\n";
      const markdownAST = parseMarkdown(body) as Parent;
      const frontmatter = {
        rule_type: "atomic",
        input_aspects: ["Accessibility tree"],
      } as RuleFrontMatter;

      const stripped = getRuleBody({ body, markdownAST, frontmatter });
      expect(stripped).toBe(output.trim());
    });

    it("don't change accessibility support note", () => {
      const content = outdent`
        ## Hello
        Welcome to the [party][] [time][] in the [ACT Taskforce][]!

        ### Accessibility Support

        There are no accessibility support issues known.

        ### Bibliography

      `;
      const body = content + "\n";
      const markdownAST = parseMarkdown(body) as Parent;
      const frontmatter = {
        rule_type: "atomic",
        input_aspects: [""],
      } as RuleFrontMatter;

      const stripped = getRuleBody({ body, markdownAST, frontmatter });
      expect(stripped).toBe(content.trim());
    });
  });
});
