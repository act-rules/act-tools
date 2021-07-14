import yaml from "js-yaml";
import outdent from "outdent";
import { AtomicRuleFrontmatter, CompositeRuleFrontmatter } from "src/types";
import { getRuleMetadata } from "../get-rule-metadata";

// Wrote this little parser instead of using the markdown parser
// because the markdown parser doesn't handle definition lists
function toDefinitionObject(dfnString: string): Record<string, string[]> {
  const definitionPairs = dfnString.split("\n\n").map(createDefinitionPair);

  const definitionObj: Record<string, string[]> = {};
  definitionPairs.forEach(([term, definitions]) => {
    definitionObj[term] = definitions;
  });
  return definitionObj;
}

function createDefinitionPair(dfnString: string): [string, string[]] {
  const dfnLines = dfnString.split("\n");
  const term: string = dfnLines.shift() || '';
  const definitions: string[] = [];
  let definition: string = '';

  dfnLines.forEach((dfnLine) => {
    if (dfnLine.substr(0, 4) === ":   ") {
      if (definition) {
        // save before we reset
        definitions.push(definition);
      }
      definition = dfnLine;
    } else if (definition) {
      definition += "\n" + dfnLine;
    }
  });

  definitions.push(definition); // Push the last one in too.
  return [term, definitions];
}

describe("taskforce-markdown", () => {
  const atomicRuleFrontmatter = yaml.load(outdent`
    id: bc4a75
    name: ARIA required owned elements
    rule_type: atomic
    description: |
      This rule checks that an element with an explicit semantic role has at least one of its required owned elements.
    accessibility_requirements:
      using-aria:fourth:
        title: Fourth rule of ARIA use
        forConformance: false
        failed: not satisfied
        passed: further testing needed
        inapplicable: further testing needed
      aria11:state_property_processing:
        title: ARIA 1.1, 7.6 State and Property Attribute Processing
        forConformance: true
        failed: not satisfied
        passed: satisfied
        inapplicable: satisfied
    input_aspects:
      - Accessibility tree
      - CSS styling
      - DOM Tree
  `) as AtomicRuleFrontmatter;

  const compositeRuleFrontmatter = yaml.load(outdent`
    id: c3232f
    name: 'video element visual-only content has accessible alternative'
    rule_type: composite
    description: |
      This rule checks that video elements without audio have an alternative available.
    accessibility_requirements:
      wcag20:1.2.1: # Audio-only and Video-only (Prerecorded) (A)
        forConformance: true
        failed: not satisfied
        passed: further testing needed
        inapplicable: further testing needed
      wcag-technique:G159: # Providing an alternative for time-based media for video-only content
        forConformance: false
        failed: not satisfied
        passed: satisfied
        inapplicable: further testing needed
    input_rules:
      - fd26cf
      - ac7dc6
  `) as CompositeRuleFrontmatter;

  describe("get-rule-metadata", () => {
    it('returns the "Rule ID"', () => {
      const metadata = getRuleMetadata({ frontmatter: atomicRuleFrontmatter });
      const dfnObject = toDefinitionObject(metadata);
      expect(dfnObject).toHaveProperty("Rule ID:", [
        `:   ${atomicRuleFrontmatter.id}`,
      ]);
    });

    it('returns the "Last Modified" as "TODO"', () => {
      const metadata = getRuleMetadata({ frontmatter: atomicRuleFrontmatter });
      const dfnObject = toDefinitionObject(metadata);
      expect(dfnObject).toHaveProperty("Last Modified:", [
        `:   TODO (format Sep 25, 2019)`,
      ]);
    });

    describe("Rule Type", () => {
      it("works for atomic rules", () => {
        const metadata = getRuleMetadata({
          frontmatter: atomicRuleFrontmatter,
        });
        const dfnObject = toDefinitionObject(metadata);

        expect(dfnObject).toHaveProperty("Rule Type:", [":   atomic"]);
      });

      it("works for composite rules", () => {
        const metadata = getRuleMetadata({
          frontmatter: compositeRuleFrontmatter,
        });
        const dfnObject = toDefinitionObject(metadata);
        expect(dfnObject).toHaveProperty("Rule Type:", [":   composite"]);
      });
    });

    describe("accessibility requirements mapping", () => {
      const propName = "Accessibility Requirements Mapping:";

      it("returns WCAG requirements", () => {
        const metadata = getRuleMetadata({
          frontmatter: compositeRuleFrontmatter,
        });
        const dfnObject = toDefinitionObject(metadata);
        const scMapping = outdent`
        :   [1.2.1 Audio-only and Video-only (Prerecorded) (Level A)](https://www.w3.org/TR/WCAG21/#audio-only-and-video-only-prerecorded)
            - **Required for conformance** to WCAG 2.0 and later on level A and higher
            - [Outcome](#outcome) mapping:
                - Any \`failed\` outcomes: success criterion is not satisfied
                - All \`passed\` outcomes: success criterion needs further testing
                - An \`inapplicable\` outcome: success criterion needs further testing
        `;

        const techniqueMapping = outdent`
        :   [G159: Providing an alternative for time-based media for video-only content](https://www.w3.org/WAI/WCAG21/Techniques/general/G159)
            - Not required to conformance to any W3C accessibility recommendation.
            - [Outcome](#outcome) mapping:
                - Any \`failed\` outcomes: technique is not satisfied
                - All \`passed\` outcomes: technique is satisfied
                - An \`inapplicable\` outcome: technique needs further testing
        `;
        expect(dfnObject).toHaveProperty(propName, [
          scMapping,
          techniqueMapping,
        ]);
      });

      it("returns other requirements", () => {
        const metadata = getRuleMetadata({
          frontmatter: atomicRuleFrontmatter,
        });
        const dfnObject = toDefinitionObject(metadata);
        const ariaRule = outdent`
        :   [Fourth rule of ARIA use](https://www.w3.org/TR/using-aria/#fourth)
            - Not required to conformance to any W3C accessibility recommendation.
            - [Outcome](#outcome) mapping:
                - Any \`failed\` outcomes: WAI-ARIA rule is not satisfied
                - All \`passed\` outcomes: WAI-ARIA rule needs further testing
                - An \`inapplicable\` outcome: WAI-ARIA rule needs further testing
        `;
        const ariaReq = outdent`
        :   [ARIA 1.1, 7.6 State and Property Attribute Processing](https://www.w3.org/TR/wai-aria-1.1/#state_property_processing)
            - **Required for conformance** to WAI-ARIA 1.1 author requirements
            - [Outcome](#outcome) mapping:
                - Any \`failed\` outcomes: WAI-ARIA requirement is not satisfied
                - All \`passed\` outcomes: WAI-ARIA requirement is satisfied
                - An \`inapplicable\` outcome: WAI-ARIA requirement is satisfied
        `;
        expect(dfnObject).toHaveProperty(propName, [ariaRule, ariaReq]);
      });
    });

    describe("input rules", () => {
      it("is not included for atomic rules", () => {
        const metadata = getRuleMetadata({
          frontmatter: atomicRuleFrontmatter,
        });
        const dfnObject = toDefinitionObject(metadata);
        expect(dfnObject).not.toHaveProperty("Input Rules:");
      });

      it("returns links for each input rule", () => {
        const metadata = getRuleMetadata({
          frontmatter: compositeRuleFrontmatter,
        });
        const dfnObject = toDefinitionObject(metadata);

        expect(dfnObject).toHaveProperty("Input Rules:", [
          ":   [fd26cf](/standards-guidelines/act/rules/fd26cf/)",
          ":   [ac7dc6](/standards-guidelines/act/rules/ac7dc6/)",
        ]);
      });
    });

    describe("input aspects", () => {
      it("is not included for composite rules", () => {
        const metadata = getRuleMetadata({
          frontmatter: compositeRuleFrontmatter,
        });
        const dfnObject = toDefinitionObject(metadata);
        expect(dfnObject).not.toHaveProperty("Input Aspects:");
      });

      it("returns text for each unknown input aspects", () => {
        const frontmatter = {
          ...atomicRuleFrontmatter,
          input_aspects: ["foo", "bar", "baz"],
        };
        const metadata = getRuleMetadata({ frontmatter });
        const dfnObject = toDefinitionObject(metadata);

        expect(dfnObject).toHaveProperty("Input Aspects:", [
          ":   foo",
          ":   bar",
          ":   baz",
        ]);
      });

      it("returns links for each known input aspects", () => {
        const basUrl = "https://www.w3.org/TR/act-rules-aspects/#input-aspects";
        const metadata = getRuleMetadata({
          frontmatter: atomicRuleFrontmatter,
        });
        const dfnObject = toDefinitionObject(metadata);

        expect(dfnObject).toHaveProperty("Input Aspects:", [
          `:   [Accessibility tree](${basUrl}-accessibility)`,
          `:   [CSS styling](${basUrl}-css)`,
          `:   [DOM Tree](${basUrl}-dom)`,
        ]);
      });
    });
  });
});
