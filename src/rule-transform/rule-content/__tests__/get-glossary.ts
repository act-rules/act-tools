import outdent from "outdent";
import { parsePage } from "../../../utils/parse-page";
import { getGlossary } from "../get-glossary";
import { createGlossary } from "../../__test-utils";

describe("rule-content", () => {
  describe("get-glossary", () => {
    const outcome = "All good.";
    const attribute = outdent`
      You can see [it][].

      [it]: https://w3.org/
    `;
    const visible = outdent`
      You can see [it][].

      ### Really

      Ignore me

      [it]: https://w3.org/
    `;

    it("includes the outcome", () => {
      const glossary = createGlossary({ outcome });
      const rulePage = parsePage("Some rule page");
      const ruleGlossary = getGlossary(rulePage, glossary);

      expect(ruleGlossary).toBe(outdent`
        ## Glossary

        ### Outcome {#outcome}

        All good.
      `);
    });

    it("strips references", () => {
      const glossary = createGlossary({ attribute });
      const rulePage = parsePage("Some rule page");
      const ruleGlossary = getGlossary(rulePage, glossary);

      expect(ruleGlossary).toBe(outdent`
        ## Glossary

        ### Attribute {#attribute}

        You can see [it][].
      `);
    });

    it("strips any subheading", () => {
      const glossary = createGlossary({ visible });
      const rulePage = parsePage("Some rule page");
      const ruleGlossary = getGlossary(rulePage, glossary);

      expect(ruleGlossary).toBe(outdent`
        ## Glossary

        ### Visible {#visible}

        You can see [it][].
      `);
    });
  });
});
