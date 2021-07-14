import outdent from "outdent";
import { getDefinitionContent } from "../get-definition-content";
import { createGlossary } from "../../__test-utils"
import { DefinitionPage } from "src/types";

describe("getDefinitionContent", () => {
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
  const glossary = createGlossary(glossaryBase) as DefinitionPage[];

  it("runs", () => {
    const taskforceMarkdown = getDefinitionContent("hello", glossary);

    expect(taskforceMarkdown).toBe(outdent`
      ### Hello {#hello}
      Hello [world][]

      [world]: #world
      [w3c]: //w3.org
    `);
  });
});
