import outdent from "outdent";
import { parsePage } from "../../utils/parse-page";
import { createGlossary } from "../../__test-utils";
import { getRuleContent } from "../get-rule-content";
import { RulePage } from '../../types';

describe("getRuleContent", () => {
  const glossaryBase = {
    hello: outdent`
      Hello [world][]

      [world]: #world
      [w3c]: //w3.org
    `,
    world: outdent`
      World of the [ACT-rules community]

      [act-rules community]: //act-rules.github.io
    `,
    outcome: `All good.`,
  };
  const glossary = createGlossary(glossaryBase);

  it("runs", () => {
    const rulePage = parsePage(outdent`
      ---
      id: 123abc
      name: Hello world
      rule_type: atomic
      description: hello world
      acknowledgements:
        authors:
          - Wilco Fiers
      ---
      [hello][], [w3c][]

      [hello]: #hello
      [w3c]: //w3.org 'W3C website'
    `) as RulePage;
    const taskforceMarkdown = getRuleContent(
      { ...rulePage, filename: "123abc.md" },
      glossary
    );

    expect(taskforceMarkdown).toBe(outdent`
      ---
      title: "Hello world"
      permalink: /standards-guidelines/act/rules/123abc/
      ref: /standards-guidelines/act/rules/123abc/
      lang: en
      github:
        repository: w3c/wcag-act-rules
        path: content/123abc.md
      # footer: > # Text in footer in HTML
      #   <p> This is the text in the footer </p>
      ---
      
      Rule Type:
      :   atomic
      
      Rule ID:
      :   123abc
      
      Last Modified:
      :   TODO (format Sep 25, 2019)
      
      ## Description
      
      hello world
      
      [hello][], [w3c][]
      
      ## Glossary
      
      {% include_relative glossary/hello.md %}
      {% include_relative glossary/outcome.md %}
      {% include_relative glossary/world.md %}
      
      ## Acknowledgements

      This rule was written in the [ACT Rules community group](https://w3.org/community/act-r/), 
      with the support of the EU-funded [WAI-Tools Project](https://www.w3.org/WAI/about/projects/wai-tools/).
      
      ### Authors
      
      - [Wilco Fiers](https://github.com/wilcofiers)
      
      ## Changelog
      
      This is the first version of this ACT rule.
      
      [hello]: #hello
      [w3c]: //w3.org 'W3C website'
    `);
  });
});
