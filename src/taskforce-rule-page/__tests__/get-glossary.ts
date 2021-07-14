import { parsePage } from "../../utils/parse-page";
import { getGlossary } from "../get-glossary";
import { createGlossary } from "../../__test-utils";

describe("taskforce-markdown", () => {
  describe("get-glossary", () => {
    const glossaryBase = {
      hello: "Hello [world](#world).",
      world: "World!",
      outcome: "All good.",
    };
    const glossary = createGlossary(glossaryBase);

    it("includes the outcome", () => {
      const rulePage = parsePage("Without definitions [w3](//w3.org)");
      const ruleGlossary = getGlossary(rulePage, glossary);

      expect(ruleGlossary).toBe(
        "## Glossary\n\n{% include_relative glossary/outcome.md %}"
      );
    });

    it("sorts definitions in alphabetic order", () => {
      const rulePage = parsePage(`[hello](#hello), [world](#world)`);
      const ruleGlossary = getGlossary(rulePage, glossary);
      expect(ruleGlossary).toBe(
        [
          "## Glossary\n",
          "{% include_relative glossary/hello.md %}",
          "{% include_relative glossary/outcome.md %}",
          "{% include_relative glossary/world.md %}",
        ].join("\n")
      );
    });

    it("includes nested definitions", () => {
      const rulePage = parsePage("[hello](#hello)");
      const ruleGlossary = getGlossary(rulePage, glossary);
      expect(ruleGlossary).toBe(
        [
          "## Glossary\n",
          "{% include_relative glossary/hello.md %}",
          "{% include_relative glossary/outcome.md %}",
          "{% include_relative glossary/world.md %}",
        ].join("\n")
      );
    });
  });
});
