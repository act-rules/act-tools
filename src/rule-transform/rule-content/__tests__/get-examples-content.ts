import outdent from "outdent";
import { Parent } from "unist";
import { parseMarkdown } from "../../../utils/parse-page";
import { getExamplesContent } from "../get-examples-content";

describe("rule-content", () => {
  const q = "```";
  describe("get-examples-content", () => {
    it("Creates cleaned up examples", () => {
      const body = outdent`
        ## Exampllse

        ### Passes
        ##### Pass Example 1
        ${q}html
        <img alt="" />
        ${q}
        
        ### Failure Test Cases
        ##### Failed Example 2
        Some problem description
        ${q}html
        <img alt="" />
        ${q}
      `;
      const markdownAST = parseMarkdown(body) as Parent;
      const examples = getExamplesContent({ body, markdownAST });
      const href =
        "/standards-guidelines/act/rules/testcases/98a6b1fc6e5d43490f9c9a7cce9676487c94d2a3.html";
      expect(examples).toBe(outdent`
        ## Test Cases

        ### Passed

        #### Pass Example 1

        <a class="example-link" title="Pass Example 1" href="${href}">Open in a new tab</a>

        ${q}html
        <img alt="" />
        ${q}

        ### Failed

        #### Failed Example 2

        <a class="example-link" title="Failed Example 2" href="${href}">Open in a new tab</a>

        Some problem description

        ${q}html
        <img alt="" />
        ${q}

        ### Inapplicable

        _There are no inapplicable examples._
      `);
    });
  });
});
