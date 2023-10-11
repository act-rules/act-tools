import { RuleFrontMatter, AccessibilityRequirement } from "../../../types";
import {
  getRequirementsMap,
  headingText,
  secondaryReqText,
} from "../get-requirements-map";

describe("getRequirementsMap", () => {
  const defaultMatter: RuleFrontMatter = {
    id: "abc134",
    name: "abc rule",
    rule_type: "atomic",
    description: "hello world",
    input_aspects: [],
  };
  const scRequirement: AccessibilityRequirement = {
    failed: "not satisfied",
    passed: "satisfied",
    inapplicable: "further testing needed",
  };

  it("includes the heading text", () => {
    const reqMap = getRequirementsMap({ frontmatter: defaultMatter });
    expect(reqMap).toContain(headingText);
  });

  it('returns "not required for conformance" if there are no requirements', () => {
    const reqMap = getRequirementsMap({ frontmatter: defaultMatter });
    expect(reqMap).toContain("not required for conformance");
  });

  describe("conformance requirements", () => {
    it("lists each requirement", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "wcag20:1.1.1": scRequirement,
            "wcag20:4.1.2": scRequirement,
          },
        },
      });
      expect(reqMap).toContain("1.1.1 Non-text Content (Level A)");
      expect(reqMap).toContain("4.1.2 Name, Role, Value (Level A)");
    });

    it("includes an outcome mapping", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "wcag20:1.1.1": scRequirement,
          },
        },
      });
      expect(reqMap).toContain(
        "Any <code>failed</code> outcomes: success criterion is not satisfied"
      );
      expect(reqMap).toContain(
        "All <code>passed</code> outcomes: success criterion is satisfied"
      );
      expect(reqMap).toContain(
        "An <code>inapplicable</code> outcome: success criterion needs further testing"
      );
    });

    it("can map to WCAG techniques", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "wcag-technique:G170": {
              forConformance: false,
              ...scRequirement,
            },
          },
        },
      });
      expect(reqMap).toContain(
        "Providing a control near the beginning of the Web page"
      );
      expect(reqMap).toContain("Not required for conformance");
      expect(reqMap).toContain("technique is not satisfied");
    });

    it("can map to WCAG non-interference requirements", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "wcag-text:cc5": {
              title: "WCAG Non-Interference",
              forConformance: true,
              ...scRequirement,
            },
          },
        },
      });
      expect(reqMap).toContain("WCAG Non-Interference");
      expect(reqMap).toContain("Required for conformance");
      expect(reqMap).toContain(
        "WCAG 2 conformance requirement is not satisfied"
      );
    });

    it("can map to WAI-ARIA", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "aria12:state_property_processing": {
              title: "ARIA 1.2, 7.6 State and Property Attribute Processing",
              forConformance: true,
              ...scRequirement,
            },
          },
        },
      });
      expect(reqMap).toContain(
        "ARIA 1.2, 7.6 State and Property Attribute Processing"
      );
      expect(reqMap).toContain("Required for conformance");
      expect(reqMap).toContain("WAI-ARIA requirement is not satisfied");
    });

    it('can map to "using ARIA"', () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "using-aria:fourth:1.1.1": {
              forConformance: false,
              title: "Fourth rule of ARIA use",
              ...scRequirement,
            },
          },
        },
      });
      expect(reqMap).toContain("Fourth rule of ARIA use");
      expect(reqMap).toContain("Not required for conformance");
      expect(reqMap).toContain("WAI-ARIA rule is not satisfied");
    });
  });

  describe("secondary requirements", () => {
    it("includes the secondary requirements heading", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "wcag20:1.1.1": { secondary: "foo" },
            "wcag20:4.1.2": scRequirement,
          },
        },
      });
      expect(reqMap).toContain("Secondary Requirements");
    });

    it("includes the secondary requirements text", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "wcag20:1.1.1": { secondary: "foo" },
          },
        },
      });
      expect(reqMap).toContain(secondaryReqText);
    });

    it("does not include secondary requirements if there are none", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "wcag20:4.1.2": scRequirement,
          },
        },
      });
      expect(reqMap).not.toContain("Secondary Requirements");
    });

    it("lists each secondary requirement", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "wcag20:1.1.1": { secondary: "foo" },
            "wcag20:4.1.2": { secondary: "bar" },
          },
        },
      });
      expect(reqMap).toContain("foo");
      expect(reqMap).toContain("1.1.1 Non-text Content (Level A)");
      expect(reqMap).toContain("bar");
      expect(reqMap).toContain("4.1.2 Name, Role, Value (Level A)");
    });

    it("splits secondary requirements and conformance requirements", () => {
      const reqMap = getRequirementsMap({
        frontmatter: {
          ...defaultMatter,
          accessibility_requirements: {
            "wcag20:1.1.1": { secondary: "foo" },
            "wcag20:4.1.2": scRequirement,
          },
        },
      });
      const [conformance, secondary] = reqMap.split("Secondary Requirements");
      expect(conformance).not.toContain("1.1.1 Non-text Content (Level A)");
      expect(conformance).toContain("4.1.2 Name, Role, Value (Level A)");
      expect(secondary).toContain("1.1.1 Non-text Content (Level A)");
      expect(secondary).not.toContain("4.1.2 Name, Role, Value (Level A)");
    });
  });
});
