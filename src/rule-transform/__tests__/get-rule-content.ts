import outdent from "outdent";
import { parsePage } from "../../utils/parse-page";
import { createGlossary } from "../__test-utils";
import { getRuleContent } from "../get-rule-content";
import { RulePage } from "../../types";
import { getDate } from "../rule-content/get-frontmatter";

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
      id: 123abc
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
      acknowledgements:
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
      { ...rulePage, filename: "123abc.md" },
      glossary,
      { matrix: true }
    );

    expect(taskforceMarkdown).toBe(
      outdent`
      ---
      title: "Hello world"
      permalink: /standards-guidelines/act/rules/123abc/
      ref: /standards-guidelines/act/rules/123abc/
      lang: en
      github:
        repository: w3c/wcag-act-rules
        path: content/123abc.md
      proposed: false
      rule_meta:
        id: 123abc
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
        last_modified: ${getDate()}
        scs_tested:
          - handle: Name, Role, Value
            num: 4.1.2
            level: A
      ---
      
      [hello][], [w3c][]

      ## Test Cases

      ### Passed

      #### Passed Example 1

      <a class="example-link" title="Passed Example 1" href="/standards-guidelines/act/rules/testcases/98a6b1fc6e5d43490f9c9a7cce9676487c94d2a3.html">Open in a new tab</a>

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
      
      {% include implementations/123abc.md %}
      
      ## Acknowledgements

      This rule was written in the [ACT Rules community group](https://w3.org/community/act-r/), 
      with the support of the EU-funded [WAI-Tools Project](https://www.w3.org/WAI/about/projects/wai-tools/).
      
      ### Authors
      
      - [Wilco Fiers](https://github.com/wilcofiers)
      
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
