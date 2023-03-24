import outdent from "outdent";
import { Parent } from "unist";
import { RuleFrontMatter } from "../../../types";
import { parseMarkdown } from "../../../utils/parse-page";
import { getExamplesContent } from "../get-examples-content";

describe("rule-content", () => {
  const q = "```";
  const frontmatter = { id: "abc123" } as RuleFrontMatter;
  const href1 =
    "https://w3.org/WAI/content-assets/wcag-act-rules/testcases/abc123/f8fcab4462dd8a68a5cb3ff11b02480e84f627ad.html";
  const href2 =
    "https://w3.org/WAI/content-assets/wcag-act-rules/testcases/abc123/6b8c89adf4f288cfc6b3e757f279e83ffdc2f5e5.html";

  describe("get-examples-content", () => {
    const body = outdent`
        ## Exampllse

        ### Passes
        ##### Pass Example 1
        ${q}html
        <link rel="stylesheet" type="text/css" href="/test-assets/mystyle.css" />
        ${q}
        
        ### Failure Test Cases
        ##### Failed Example 2
        Some problem description
        ${q}html
        <script src="/test-assets/script1.js"></script>
        <script src="/test-assets/script2.js"></script>
        ${q}
      `;
    const markdownAST = parseMarkdown(body) as Parent;

    it("Creates cleaned up examples", () => {
      const examples = getExamplesContent({
        filename: "unused",
        frontmatter,
        markdownAST,
        body,
        assets: {},
      });
      expect(examples).toBe(outdent`
        ## Test Cases

        ### Passed

        #### Pass Example 1

        <a class="example-link" title="Pass Example 1" target="_blank" href="${href1}">Open in a new tab</a>

        ${q}html
        <link rel="stylesheet" type="text/css" href="/test-assets/mystyle.css" />
        ${q}

        ### Failed

        #### Failed Example 2

        <a class="example-link" title="Failed Example 2" target="_blank" href="${href2}">Open in a new tab</a>

        Some problem description

        ${q}html
        <script src="/test-assets/script1.js"></script>
        <script src="/test-assets/script2.js"></script>
        ${q}

        ### Inapplicable

        _There are no inapplicable examples._
      `);
    });

    it("Leaves out links with noExampleLinks", () => {
      const examples = getExamplesContent(
        { filename: "unused", frontmatter, markdownAST, body, assets: {} },
        null,
        { noExampleLinks: true }
      );
      expect(examples).toBe(outdent`
        ## Test Cases

        ### Passed

        #### Pass Example 1

        ${q}html
        <link rel="stylesheet" type="text/css" href="/test-assets/mystyle.css" />
        ${q}

        ### Failed

        #### Failed Example 2

        Some problem description

        ${q}html
        <script src="/test-assets/script1.js"></script>
        <script src="/test-assets/script2.js"></script>
        ${q}

        ### Inapplicable

        _There are no inapplicable examples._
      `);
    });

    it("Includes specified test assets", () => {
      const assets = { "/test-assets/script1.js": "console.log('hello');" };
      const examples = getExamplesContent({
        filename: "unused",
        frontmatter,
        markdownAST,
        body,
        assets,
      });
      expect(examples).toBe(outdent`
        ## Test Cases

        <details>
        <summary>
        This Javascript file is used in several examples:
        </summary>
    
        File [\`/test-assets/script1.js\`](/WAI/content-assets/wcag-act-rules/test-assets/script1.js):
    
        ${q}javascript
        console.log('hello');
        ${q}
    
        </details>

        ### Passed

        #### Pass Example 1

        <a class="example-link" title="Pass Example 1" target="_blank" href="${href1}">Open in a new tab</a>

        ${q}html
        <link rel="stylesheet" type="text/css" href="/test-assets/mystyle.css" />
        ${q}

        ### Failed

        #### Failed Example 2

        <a class="example-link" title="Failed Example 2" target="_blank" href="${href2}">Open in a new tab</a>

        Some problem description

        ${q}html
        <script src="/test-assets/script1.js"></script>
        <script src="/test-assets/script2.js"></script>
        ${q}

        ### Inapplicable

        _There are no inapplicable examples._
      `);
    });

    it("Correctly pluralise test assets header", () => {
      const assets = {
        "/test-assets/script1.js": "console.log('hello');",
        "/test-assets/script2.js": "console.log('world');",
      };
      const examples = getExamplesContent({
        filename: "unused",
        frontmatter,
        markdownAST,
        body,
        assets,
      });
      expect(examples).toBe(outdent`
        ## Test Cases

        <details>
        <summary>
        These Javascript files are used in several examples:
        </summary>
    
        File [\`/test-assets/script1.js\`](/WAI/content-assets/wcag-act-rules/test-assets/script1.js):
    
        ${q}javascript
        console.log('hello');
        ${q}

        File [\`/test-assets/script2.js\`](/WAI/content-assets/wcag-act-rules/test-assets/script2.js):
    
        ${q}javascript
        console.log('world');
        ${q}

        </details>

        ### Passed

        #### Pass Example 1

        <a class="example-link" title="Pass Example 1" target="_blank" href="${href1}">Open in a new tab</a>

        ${q}html
        <link rel="stylesheet" type="text/css" href="/test-assets/mystyle.css" />
        ${q}

        ### Failed

        #### Failed Example 2

        <a class="example-link" title="Failed Example 2" target="_blank" href="${href2}">Open in a new tab</a>

        Some problem description

        ${q}html
        <script src="/test-assets/script1.js"></script>
        <script src="/test-assets/script2.js"></script>
        ${q}

        ### Inapplicable

        _There are no inapplicable examples._
      `);
    });

    it("Place JS assets before CSS", () => {
      const assets = {
        "/test-assets/mystyle.css": "div { color: blue; }",
        "/test-assets/script1.js": "console.log('hello');",
      };
      const examples = getExamplesContent({
        filename: "unused",
        frontmatter,
        markdownAST,
        body,
        assets,
      });
      expect(examples).toBe(outdent`
        ## Test Cases

        <details>
        <summary>
        These Javascript and CSS files are used in several examples:
        </summary>
    
        File [\`/test-assets/script1.js\`](/WAI/content-assets/wcag-act-rules/test-assets/script1.js):
    
        ${q}javascript
        console.log('hello');
        ${q}

        File [\`/test-assets/mystyle.css\`](/WAI/content-assets/wcag-act-rules/test-assets/mystyle.css):
    
        ${q}css
        div { color: blue; }
        ${q}

        </details>

        ### Passed

        #### Pass Example 1

        <a class="example-link" title="Pass Example 1" target="_blank" href="${href1}">Open in a new tab</a>

        ${q}html
        <link rel="stylesheet" type="text/css" href="/test-assets/mystyle.css" />
        ${q}

        ### Failed

        #### Failed Example 2

        <a class="example-link" title="Failed Example 2" target="_blank" href="${href2}">Open in a new tab</a>

        Some problem description

        ${q}html
        <script src="/test-assets/script1.js"></script>
        <script src="/test-assets/script2.js"></script>
        ${q}

        ### Inapplicable

        _There are no inapplicable examples._
      `);
    });

    it("Only adds newline to assets if needed", () => {
      const assets = {
        "/test-assets/mystyle.css": "div { color: blue; }\n",
        "/test-assets/script1.js": "console.log('hello');",
      };
      const examples = getExamplesContent({
        filename: "unused",
        frontmatter,
        markdownAST,
        body,
        assets,
      });
      expect(examples).toBe(outdent`
        ## Test Cases

        <details>
        <summary>
        These Javascript and CSS files are used in several examples:
        </summary>
    
        File [\`/test-assets/script1.js\`](/WAI/content-assets/wcag-act-rules/test-assets/script1.js):
    
        ${q}javascript
        console.log('hello');
        ${q}

        File [\`/test-assets/mystyle.css\`](/WAI/content-assets/wcag-act-rules/test-assets/mystyle.css):
    
        ${q}css
        div { color: blue; }
        ${q}

        </details>

        ### Passed

        #### Pass Example 1

        <a class="example-link" title="Pass Example 1" target="_blank" href="${href1}">Open in a new tab</a>

        ${q}html
        <link rel="stylesheet" type="text/css" href="/test-assets/mystyle.css" />
        ${q}

        ### Failed

        #### Failed Example 2

        <a class="example-link" title="Failed Example 2" target="_blank" href="${href2}">Open in a new tab</a>

        Some problem description

        ${q}html
        <script src="/test-assets/script1.js"></script>
        <script src="/test-assets/script2.js"></script>
        ${q}

        ### Inapplicable

        _There are no inapplicable examples._
      `);
    });
  });
});
