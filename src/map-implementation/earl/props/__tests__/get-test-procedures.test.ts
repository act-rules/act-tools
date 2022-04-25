import { getTestRequirement } from "../get-test-requirement";

describe("getTestRequirement", () => {
  it("returns nothing when the test is a undefined", () => {
    const testRequirements = getTestRequirement(undefined);
    expect(testRequirements).toHaveLength(0);
  });

  it("returns nothing when the test is a string", () => {
    const testRequirements = getTestRequirement("my-custom-rule");
    expect(testRequirements).toHaveLength(0);
  });

  it("returns the WCAG number if the rule maps to WCAG", () => {
    const testRequirements = getTestRequirement({
      "@type": "earl:TestCriterion",
      title: "my-custom-rule",
      isPartOf: ["https://www.w3.org/TR/WCAG21/#name-role-value"],
    });
    expect(testRequirements).toEqual(["WCAG2:name-role-value"]);
  });

  it("handles isPartOf when there is no array", () => {
    const testRequirements = getTestRequirement({
      "@type": "earl:TestCriterion",
      title: "my-custom-rule",
      isPartOf: "https://www.w3.org/TR/WCAG21/#name-role-value",
    });
    expect(testRequirements).toEqual(["WCAG2:name-role-value"]);
  });

  it('handles isPartOf using "@id"', () => {
    const testRequirements = getTestRequirement({
      "@type": "earl:TestCriterion",
      title: "my-custom-rule",
      isPartOf: [
        {
          "@id": "https://www.w3.org/TR/WCAG21/#name-role-value",
        },
      ],
    });
    expect(testRequirements).toEqual(["WCAG2:name-role-value"]);
  });
});
