import outdent from "outdent";
import { createGlossary } from "../../rule-transform/__test-utils";
import { parsePage } from "../../utils/parse-page";
import { RulePage } from "../../types";

import { getRuleDefinitions } from "../get-rule-definitions";

describe("getRuleDefinitions", () => {
  const glossary = createGlossary({
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
  });

  it("includes `outcome` by default", () => {
    const rulePage = parsePage(outdent`
      ---
      id: 123abc
      name: Hello world
      ---
      Hello [w3c][]

      [w3c]: https://w3.org 'W3C website'
    `) as RulePage;
    const ruleDefinitions = getRuleDefinitions(rulePage, glossary);
    const definitionKeys = ruleDefinitions.map(
      ({ frontmatter }) => frontmatter.key
    );
    expect(definitionKeys).toEqual(["outcome"]);
  });

  it("finds definitions in a rule", () => {
    const rulePage = parsePage(outdent`
      ---
      id: 123abc
      name: Hello world
      ---
      hello [w3c][] [world](#world)

      [w3c]: https://w3.org 'W3C website'
    `) as RulePage;
    const ruleDefinitions = getRuleDefinitions(rulePage, glossary);
    const definitionKeys = ruleDefinitions.map(
      ({ frontmatter }) => frontmatter.key
    );

    expect(definitionKeys).toEqual(["outcome", "world"]);
  });

  it("returns definitions used in definitions", () => {
    const rulePage = parsePage(outdent`
      ---
      id: 123abc
      name: Hello world
      ---
      [hello][], [w3c][]

      [hello]: #hello
      [w3c]: https://w3.org 'W3C website'
    `) as RulePage;
    const ruleDefinitions = getRuleDefinitions(rulePage, glossary);
    const definitionKeys = ruleDefinitions.map(
      ({ frontmatter }) => frontmatter.key
    );

    expect(definitionKeys).toEqual(["hello", "outcome", "world"]);
  });
});
