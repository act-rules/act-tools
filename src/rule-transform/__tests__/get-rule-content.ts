import outdent from "outdent";
import moment from "moment";
import { parsePage } from "../../utils/parse-page";
import { createGlossary } from "../__test-utils";
import { getRuleContent } from "../get-rule-content";
import { RulePage } from "../../types";
import { getFooter } from "../rule-content/frontmatter/get-footer";
import { indent } from "../../utils/index";

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
      { matrix: true }
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
        path: content/abc123.md
      footer: |
      ${indent(getFooter(rulePage.frontmatter))}
      proposed: false
      rule_meta:
        id: abc123
        name: "Hello world"
        rule_type: atomic
        description: |
          hello world
        input_aspects:
          - handle: DOM Tree
            url: https://www.w3.org/TR/act-rules-aspects/#input-aspects-dom
        last_modified: ${moment().format("D MMMM YYYY")}
        scs_tested:
          - handle: Name, Role, Value
            num: 4.1.2
            level: A
      ---
      
      [hello][], [w3c][]

      ## Accessibility Requirements Mapping

      <ul class="act-requirements-list">
        <li><details><summary>4.1.2 Name, Role, Value (Level A)</summary>
          <ul>
            <li><a href="https://www.w3.org/TR/WCAG21/#name-role-value">Learn more about 4.1.2 Name, Role, Value</a></li>
            <li><strong>Required for conformance</strong> to WCAG 2.0 and later on level A and higher.</li>
            <li>Outcome mapping: <ul>
              <li>Any <code>failed</code> outcomes: success criterion is not satisfied</li>
              <li>All <code>passed</code> outcomes: success criterion needs further testing</li>
              <li>An <code>inapplicable</code> outcome: success criterion needs further testing</li>
            </ul></li>
          </ul>
        </details></li>
      </ul>

      ## Test Cases

      ### Passed

      #### Passed Example 1

      <a class="example-link" title="Passed Example 1" href="/standards-guidelines/act/rules/testcases/abc123/98a6b1fc6e5d43490f9c9a7cce9676487c94d2a3.html">Open in a new tab</a>

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
      
      {% include_relative implementations/abc123.md %}
      
      ## Changelog
      
      This is the first version of this ACT rule.
      
      [act-rules community]: https://act-rules.github.io
      [hello]: #hello
      [w3c]: https://w3.org 'W3C website'
      [world]: #world

    `
    );
  });
});
