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
      ${indent(getFooter(rulePage.frontmatter.acknowledgments))}
      proposed: false
      rule_meta:
        id: abc123
        name: "Hello world"
        rule_type: atomic
        description: |
          hello world
        accessibility_requirements:
          'wcag20:4.1.2':
            forConformance: true
            failed: not satisfied
            passed: further testing needed
            inapplicable: further testing needed
        input_aspects:
          - handle: DOM Tree
            url: https://www.w3.org/TR/act-rules-aspects/#input-aspects-dom
        last_modified: ${moment().format("MMMM Do, YYYY")}
        scs_tested:
          - handle: Name, Role, Value
            num: 4.1.2
            level: A
      ---
      
      {::options toc_levels="2" /}
      {::nomarkdown}
      {% include toc.html type="start" title="Page Contents" %}
      {:/}
      {:toc}
      {::nomarkdown}
      {% include toc.html type="end" %}
      {:/}
      
      [hello][], [w3c][]

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
      
      {% include implementations/abc123.md %}
      
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
