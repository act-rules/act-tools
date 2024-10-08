import moment from "moment";
import outdent from "outdent";
import { RulePage } from "../../types";
import { indent } from "../../utils/index";
import { parsePage } from "../../utils/parse-page";
import { createGlossary } from "../__test-utils";
import { getRuleContent } from "../get-rule-content";
import { getFooter } from "../rule-content/frontmatter/get-footer";

describe("getRuleContent", () => {
  const q = "```";
  const glossaryBase = {
    hello: outdent`
      Hello [world][]

      [world]: #world
      [w3c]: https://w3.org
    `,
    world: outdent`
      World of the [ACT-rules community][]

      [act-rules community]: https://act-rules.github.io
    `,
    outcome: `All good.`,
  };
  const glossary = createGlossary(glossaryBase);

  it("creates a complete rule page", () => {
    const rulePage = parsePage(outdent`
      ---
      id: abc123
      name: Hello world
      rule_type: atomic
      description: hello world
      accessibility_requirements:
        wcag20:4.1.2: # Name, Role, Value (A)
          forConformance: true
          failed: not satisfied
          passed: further testing needed
          inapplicable: further testing needed
        wcag20:1.1.1: # Non-text Content (A)
          secondary: |
            This rule is **less strict** than this criterion.
        using-aria:fourth:
          title: Fourth rule of ARIA use
          secondary: This rule is **more strict** than this requirement.
      input_aspects:
        - DOM Tree
      acknowledgments:
        authors:
          - Wilco Fiers
      ---

      [hello][], [w3c][]

      ## Passed Example 1

      ${q}html
      <img alt="" />
      ${q}

      [hello]: #hello
      [w3c]: https://w3.org 'W3C website'
    `) as RulePage;
    const taskforceMarkdown = getRuleContent(
      {
        ...rulePage,
        filename: "abc123.md",
        assets: {
          "/test-assets/hello.css": "div { color: blue }",
          "/test-assets/world.js": "console.log('world');",
        },
      },
      glossary,

      { matrix: true },
      []
    );

    expect(taskforceMarkdown).toBe(
      outdent`
      ---
      title: "Hello world"
      permalink: /standards-guidelines/act/rules/abc123/
      ref: /standards-guidelines/act/rules/abc123/
      lang: en
      github:
        repository: w3c/wcag-act-rules
        path: content/rules/abc123/index.md
      feedbackmail: public-wcag-act@w3.org
      footer: |
      ${indent(getFooter(rulePage.frontmatter, false))}
      proposed: false
      rule_meta:
        id: abc123
        name: "Hello world"
        rule_type: atomic
        original_file: abc123.md
        description: |
          hello world
        last_modified: ${moment().format("D MMMM YYYY")}
        scs_tested:
          - handle: Name, Role, Value
            num: 4.1.2
            level: A
      ---
      
      [hello][], [w3c][]

      ## Accessibility Requirements Mapping

      <ul class="act-requirements-list">
        <li><details>
          <summary><span>4.1.2 Name, Role, Value (Level A)</span></summary>
          <ul>
            <li><a href="https://www.w3.org/TR/WCAG22/#name-role-value">Learn more about 4.1.2 Name, Role, Value</a></li>
            <li><strong>Required for conformance</strong> to WCAG 2.0 and later on level A and higher.</li>
            <li>Outcome mapping: <ul>
              <li>Any <code>failed</code> outcomes: success criterion is not satisfied</li>
              <li>All <code>passed</code> outcomes: success criterion needs further testing</li>
              <li>An <code>inapplicable</code> outcome: success criterion needs further testing</li>
            </ul></li>
          </ul>
        </details></li>
      </ul>

      ### Secondary Requirements

      This rule is related to the following accessibility requirements, but was 
      not designed to test this requirements directly. These 
      [secondary requirements](https://w3c.github.io/wcag-act/act-rules-format.html#secondary-requirements)
      can either be stricter than the rule requires, or may be satisfied in ways 
      not tested by the rule:

      - [1.1.1 Non-text Content (Level A)](https://www.w3.org/TR/WCAG22/#non-text-content): This rule is **less strict** than this criterion.
      - [Fourth rule of ARIA use](https://www.w3.org/TR/using-aria/#fourth): This rule is **more strict** than this requirement.

      ## Input Aspects

      The following aspects are required in using this rule.

      - [DOM Tree](https://www.w3.org/TR/act-rules-aspects/#input-aspects-dom)

      ## Test Cases
      
      <details class="act-inline-assets" markdown="block">
      <summary><span>These Javascript and CSS files are used in several examples:</span></summary>
      
      File [\`/test-assets/world.js\`](https://w3.org/WAI/content-assets/wcag-act-rules/test-assets/world.js):
      
      ${q}javascript
      console.log('world');
      ${q}
      
      File [\`/test-assets/hello.css\`](https://w3.org/WAI/content-assets/wcag-act-rules/test-assets/hello.css):
      
      ${q}css
      div { color: blue }
      ${q}
      
      </details>

      ### Passed

      #### Passed Example 1

      <a class="example-link" title="Passed Example 1" target="_blank" href="https://w3.org/WAI/content-assets/wcag-act-rules/testcases/abc123/98a6b1fc6e5d43490f9c9a7cce9676487c94d2a3.html">Open in a new tab</a>

      ${q}html
      <img alt="" />
      ${q}

      ### Failed

      _There are no failed examples._

      ### Inapplicable

      _There are no inapplicable examples._
      
      ## Glossary
      
      ### Hello {#hello}

      Hello [world][]

      ### Outcome {#outcome}

      All good.

      ### World {#world}

      World of the [ACT-rules community][]
      
      [act-rules community]: https://act-rules.github.io
      [hello]: #hello
      [w3c]: https://w3.org 'W3C website'
      [world]: #world

    `
    );
  });

  // Mapping to WCAG SCs adds a scs_tested key to the TF Markdown, which is
  // somewhat annoying to handle in bulk. So they are not part of this test
  // but are effectively tested as part of the previous one.
  it("accept all possible non-WCAG mappings", () => {
    const requirements = [
      {
        source: `wcag-technique:ARIA5: # Using WAI-ARIA state and property attributes to expose the state of a user interface component
          forConformance: false
          failed: not satisfied
          passed: further testing needed
          inapplicable: further testing needed`,
        expected: outdent`
        <ul class="act-requirements-list">
          <li><details>
            <summary><span>ARIA5: Using WAI-ARIA state and property attributes to expose the state of a user interface component</span></summary>
            <ul>
              <li><a href="https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA5">Learn more about technique ARIA5</a></li>
              <li>Not required for conformance to any W3C accessibility recommendation.</li>
              <li>Outcome mapping: <ul>
                <li>Any <code>failed</code> outcomes: technique is not satisfied</li>
                <li>All <code>passed</code> outcomes: technique needs further testing</li>
                <li>An <code>inapplicable</code> outcome: technique needs further testing</li>
              </ul></li>
            </ul>
          </details></li>
        </ul>`,
      },
      {
        source: `aria12:state_property_processing:
          title: ARIA 1.2, 8.6 State and Property Attribute Processing
          forConformance: true
          failed: not satisfied
          passed: satisfied
          inapplicable: satisfied`,
        expected: outdent`
        <ul class="act-requirements-list">
          <li><details>
            <summary><span>ARIA 1.2, 8.6 State and Property Attribute Processing</span></summary>
            <ul>
              <li><a href="https://www.w3.org/TR/wai-aria-1.2/#state_property_processing">Learn more about ARIA 1.2, 8.6 State and Property Attribute Processing</a></li>
              <li><strong>Required for conformance</strong> to WAI-ARIA 1.2 author requirements.</li>
              <li>Outcome mapping: <ul>
                <li>Any <code>failed</code> outcomes: WAI-ARIA requirement is not satisfied</li>
                <li>All <code>passed</code> outcomes: WAI-ARIA requirement is satisfied</li>
                <li>An <code>inapplicable</code> outcome: WAI-ARIA requirement is satisfied</li>
              </ul></li>
            </ul>
          </details></li>
        </ul>`,
      },
      {
        source: `html-aria:docconformance:
          title: ARIA in HTML, 4. Document conformance requirements for use of ARIA attributes in HTML
          forConformance: true
          failed: not satisfied
          passed: satisfied
          inapplicable: satisfied`,
        expected: outdent`
        <ul class="act-requirements-list">
          <li><details>
            <summary><span>ARIA in HTML, 4. Document conformance requirements for use of ARIA attributes in HTML</span></summary>
            <ul>
              <li><a href="https://www.w3.org/TR/html-aria/#docconformance">Learn more about ARIA in HTML, 4. Document conformance requirements for use of ARIA attributes in HTML</a></li>
              <li><strong>Required for conformance</strong> to ARIA in HTML.</li>
              <li>Outcome mapping: <ul>
                <li>Any <code>failed</code> outcomes: ARIA in HTML requirement is not satisfied</li>
                <li>All <code>passed</code> outcomes: ARIA in HTML requirement is satisfied</li>
                <li>An <code>inapplicable</code> outcome: ARIA in HTML requirement is satisfied</li>
              </ul></li>
            </ul>
          </details></li>
        </ul>`,
      },
      {
        source: `using-aria:fourth:
          title: Fourth rule of ARIA use
          forConformance: false
          failed: not satisfied
          passed: further testing needed
          inapplicable: further testing needed`,
        expected: outdent`
        <ul class="act-requirements-list">
          <li><details>
            <summary><span>Fourth rule of ARIA use</span></summary>
            <ul>
              <li><a href="https://www.w3.org/TR/using-aria/#fourth">Learn more about Fourth rule of ARIA use</a></li>
              <li>Not required for conformance to any W3C accessibility recommendation.</li>
              <li>Outcome mapping: <ul>
                <li>Any <code>failed</code> outcomes: WAI-ARIA rule is not satisfied</li>
                <li>All <code>passed</code> outcomes: WAI-ARIA rule needs further testing</li>
                <li>An <code>inapplicable</code> outcome: WAI-ARIA rule needs further testing</li>
              </ul></li>
            </ul>
          </details></li>
        </ul>`,
      },
      {
        source: `wcag-text:cc5: # Non-interference due to mapping to 2.2.2
          title: WCAG Non-Interference
          forConformance: true
          failed: not satisfied
          passed: further testing needed
          inapplicable: further testing needed`,
        expected: outdent`
        <ul class="act-requirements-list">
          <li><details>
            <summary><span>WCAG Non-Interference</span></summary>
            <ul>
              <li><a href="https://www.w3.org/TR/WCAG22/#cc5">Learn more about WCAG Non-Interference</a></li>
              <li><strong>Required for conformance</strong> to WCAG 2.2.</li>
              <li>Outcome mapping: <ul>
                <li>Any <code>failed</code> outcomes: WCAG 2 conformance requirement is not satisfied</li>
                <li>All <code>passed</code> outcomes: WCAG 2 conformance requirement needs further testing</li>
                <li>An <code>inapplicable</code> outcome: WCAG 2 conformance requirement needs further testing</li>
              </ul></li>
            </ul>
          </details></li>
        </ul>`,
      },
    ];

    for (const requirement of requirements) {
      const rulePage = parsePage(outdent`
      ---
      id: abc123
      name: Hello world
      rule_type: atomic
      description: hello world
      accessibility_requirements:
        ${requirement.source}
      input_aspects:
        - DOM Tree
      acknowledgments:
        authors:
          - Wilco Fiers
      ---

      [hello][], [w3c][]

      ## Passed Example 1

      ${q}html
      <img alt="" />
      ${q}

      [hello]: #hello
      [w3c]: https://w3.org 'W3C website'
    `) as RulePage;

      const taskforceMarkdown = getRuleContent(
        { ...rulePage, filename: "abc123.md" },
        glossary,

        { matrix: true },
        []
      );

      expect(taskforceMarkdown).toBe(
        outdent`
      ---
      title: "Hello world"
      permalink: /standards-guidelines/act/rules/abc123/
      ref: /standards-guidelines/act/rules/abc123/
      lang: en
      github:
        repository: w3c/wcag-act-rules
        path: content/rules/abc123/index.md
      feedbackmail: public-wcag-act@w3.org
      footer: |
      ${indent(getFooter(rulePage.frontmatter, false))}
      proposed: false
      rule_meta:
        id: abc123
        name: "Hello world"
        rule_type: atomic
        original_file: abc123.md
        description: |
          hello world
        last_modified: ${moment().format("D MMMM YYYY")}
      ---
      
      [hello][], [w3c][]

      ## Accessibility Requirements Mapping

      ${requirement.expected}

      ## Input Aspects

      The following aspects are required in using this rule.

      - [DOM Tree](https://www.w3.org/TR/act-rules-aspects/#input-aspects-dom)

      ## Test Cases
      
      ### Passed

      #### Passed Example 1

      <a class="example-link" title="Passed Example 1" target="_blank" href="https://w3.org/WAI/content-assets/wcag-act-rules/testcases/abc123/98a6b1fc6e5d43490f9c9a7cce9676487c94d2a3.html">Open in a new tab</a>

      ${q}html
      <img alt="" />
      ${q}

      ### Failed

      _There are no failed examples._

      ### Inapplicable

      _There are no inapplicable examples._
      
      ## Glossary
      
      ### Hello {#hello}

      Hello [world][]

      ### Outcome {#outcome}

      All good.

      ### World {#world}

      World of the [ACT-rules community][]
      
      [act-rules community]: https://act-rules.github.io
      [hello]: #hello
      [w3c]: https://w3.org 'W3C website'
      [world]: #world

    `
      );
    }
  });
});
