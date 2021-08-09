import { Parent } from "unist";
import outdent from "outdent";
import { getRuleExamples } from "../get-rule-examples";
import { parseMarkdown } from "../../utils/index";
import { addCodeTemplate } from "../examples/add-code-template";
import { testCaseHash } from "../examples/test-case-hash";

describe("act", () => {
  const quotes = "```";
  describe("getRuleExamples", () => {
    it("returns examples", () => {
      const rawCode = '<img src="" />';
      const title = "Passed Example 3";
      const description = "Some description";
      const language = "html";
      const body = outdent`
        ### ${title}
        ${"\n\n" + description + "\n\n"}
        ${quotes}${language}
        ${rawCode}
        ${quotes}
      `;
      const page = parseMarkdown(body) as Parent;
      const examples = getRuleExamples({ markdownAST: page, body });
      expect(examples).toEqual([
        {
          title,
          description,
          language,
          rawCode,
          expected: "passed",
          testcaseId: testCaseHash(rawCode),
          codeSnippet: addCodeTemplate(rawCode, language, title),
        },
      ]);
    });

    it("handles missing descriptions", () => {
      const body = outdent`
        ### Inapplicable Example 1\n\n
        ${quotes}html
        <img src="" />
        ${quotes}
      `;
      const page = parseMarkdown(body) as Parent;
      const examples = getRuleExamples({ markdownAST: page, body });
      expect(examples[0].description).toBe("");
    });

    it("handles multi-paragraph descriptions", () => {
      const description = "Some description\n\n- hello\n-world";
      const body = outdent`
        ### Passed Example 1
        ${"\n\n" + description + "\n\n"}
        ${quotes}html
        <img src="" />
        ${quotes}
      `;
      const page = parseMarkdown(body) as Parent;
      const examples = getRuleExamples({ markdownAST: page, body });
      expect(examples[0].description).toBe(description);
    });

    it("is not sensitive to the heading level", () => {
      const body = outdent`
        ##### Failed Example 3\n\n
        ${quotes}html
        <img src="" />
        ${quotes}
      `;
      const page = parseMarkdown(body) as Parent;
      const examples = getRuleExamples({ markdownAST: page, body });
      expect(examples).toHaveLength(1);
    });

    it("ignores headings that have no code block", () => {
      const body = outdent`
        ## Failed Example 2

        Some information

        ### Failed Example 3\n\n
        ${quotes}html
        <img src="" />
        ${quotes}
      `;
      const page = parseMarkdown(body) as Parent;
      const examples = getRuleExamples({ markdownAST: page, body });
      expect(examples).toHaveLength(1);
    });

    it("allows variations on the heading text", () => {
      const body = outdent`
        ## Failing Test Case 1\n\n
        ${quotes}html
        <img src="" />
        ${quotes}

        ## Pass Example A\n\n
        ${quotes}html
        <img src="" />
        ${quotes}

        ## Inapplicable Case\n\n
        ${quotes}html
        <img src="" />
        ${quotes}
      `;
      const page = parseMarkdown(body) as Parent;
      const examples = getRuleExamples({ markdownAST: page, body });
      const titles = examples.map(({ title }) => title);
      expect(titles).toEqual([
        "Failing Test Case 1",
        "Pass Example A",
        "Inapplicable Case",
      ]);
    });

    it("ignores headings with an incorrect text", () => {
      const body = outdent`
        ## Failed Scenario\n\n
        ${quotes}html
        <img src="" />
        ${quotes}

        ## Issue Example\n\n
        ${quotes}html
        <img src="" />
        ${quotes}
      `;
      const page = parseMarkdown(body) as Parent;
      const examples = getRuleExamples({ markdownAST: page, body });
      expect(examples).toHaveLength(0);
    });
  });
});
