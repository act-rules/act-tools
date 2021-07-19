import outdent from "outdent";
import { getDefinitionContent } from "../get-definition-content";
import { createGlossary } from "../__test-utils";
import { DefinitionPage } from "src/types";

describe("getDefinitionContent", () => {
  const glossaryBase = {
    hello: outdent`
      Hello [world][]

      [world]: #world
      [w3c]: https://w3.org
    `,
    world: outdent`
      World of the [ACT-rules community][]

      #### Accessibility Support

      World is supported in all major browsers.

      [act-rules community]: https://act-rules.github.io
    `,
    outcome: `All good.`,
    visible: outdent`

      Content perceivable through sight.

      Content is considered _visible_ if making it fully transparent would result in a difference in the pixels rendered for any part of the document that is currently within the viewport or can be brought into the viewport via scrolling.

      [Content is defined in WCAG](https://www.w3.org/TR/WCAG21/#dfn-content).

      For more details, see [examples of visible](https://act-rules.github.io/pages/examples/visible/).
    `};
  const glossary = createGlossary(glossaryBase) as DefinitionPage[];

  it("creates a definition", () => {
    const definitionContent = getDefinitionContent("hello", glossary);
    expect(definitionContent).toBe(outdent`
      ### Hello {#hello}

      Hello [world][]

      [world]: #world
      [w3c]: https://w3.org
    ` + '\n');
  });

  it("strips out subheadings", () => {
    const definitionContent = getDefinitionContent("world", glossary);
    expect(definitionContent).toBe(outdent`
      ### World {#world}

      World of the [ACT-rules community][]

      [act-rules community]: https://act-rules.github.io
    ` + '\n');
  });
});
