import outdent from "outdent";
import { RuleFrontMatter } from "src/types";
import { getMdAcknowledgements } from "../get-acknowledgements";

const frontmatterFields: RuleFrontMatter = {
  id: 'foo',
  name: 'foo',
  description: '',
  rule_type: 'atomic',
  input_aspects: [],
  accessibility_requirements: [],
  acknowledgements: {}
}

describe("taskforce-markdown", () => {
  describe("get-acknowledgements", () => {
    const acknowledgements = {
      beans: ["great"],
      Assets: ["Some text", "Some other text"],
      previous_authors: ["Audrey Maniez", "Random Person"],
      authors: ["Wilco Fiers"],
    };

    it("returns a string", () => {
      const frontmatter = { ...frontmatterFields, acknowledgements };
      const ackn = getMdAcknowledgements({ frontmatter });
      expect(ackn).toBe(outdent`
        ## Acknowledgements
        
        This rule was written in the [ACT Rules community group](https://w3.org/community/act-r/), 
        with the support of the EU-funded [WAI-Tools Project](https://www.w3.org/WAI/about/projects/wai-tools/).
        
        ### Authors
        
        - [Wilco Fiers](https://github.com/wilcofiers)
        
        ### Previous Authors
        
        - [Audrey Maniez](https://github.com/audreymaniez)
        - Random Person
        
        ### Assets
        
        - Some text
        - Some other text
        
        ### Beans
        
        - great
      `);
    });
  });
});
