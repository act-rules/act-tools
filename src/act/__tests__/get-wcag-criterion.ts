import { getWcagCriterion } from "../get-wcag-criterion";

describe("getWcagCriterion", () => {
  it("returns a criterion for WCAG 2.0 level A", () => {
    const criterion = getWcagCriterion("1.1.1");
    expect(criterion).toEqual({
      requirementType: "success criterion",
      conformanceLevel: "WCAG 2.0 and later on level A and higher",
      title: "1.1.1 Non-text Content (Level A)",
      shortTitle: "1.1.1 Non-text Content",
      url: "https://www.w3.org/TR/WCAG21/#non-text-content",
    });
  });

  it("returns a criterion for WCAG 2.1 level AA", () => {
    const criterion = getWcagCriterion("1.3.4");
    expect(criterion).toEqual({
      requirementType: "success criterion",
      conformanceLevel: "WCAG 2.1 on level AA and higher",
      title: "1.3.4 Orientation (Level AA)",
      shortTitle: "1.3.4 Orientation",
      url: "https://www.w3.org/TR/WCAG21/#orientation",
    });
  });

  it("returns a criterion for WCAG 2.0 level AAA", () => {
    const criterion = getWcagCriterion("1.2.9");
    expect(criterion).toEqual({
      requirementType: "success criterion",
      conformanceLevel: "WCAG 2.0 and later on level AAA",
      title: "1.2.9 Audio-only (Live) (Level AAA)",
      shortTitle: "1.2.9 Audio-only (Live)",
      url: "https://www.w3.org/TR/WCAG21/#audio-only-live",
    });
  });

  it("returns a fallback for an unknown criterion", () => {
    const criterion = getWcagCriterion("0.0.0");
    expect(criterion).toEqual({
      requirementType: "success criterion",
      title: "0.0.0 Unknown success criterion",
      url: "https://www.w3.org/TR/WCAG21/",
    });
  });
});
