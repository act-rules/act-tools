import { getAccessibilityRequirement } from "../get-accessibility-requirement";

describe("getAccessibilityRequirement", () => {
  it("returns techniques", () => {
    const h2 = getAccessibilityRequirement({
      requirementId: "wcag-technique:h2",
    });
    expect(h2).toEqual({
      requirementType: "technique",
      title:
        "H2: Combining adjacent image and text links for the same resource",
      shortTitle: "technique H2",
      url: "https://www.w3.org/WAI/WCAG22/Techniques/html/H2",
    });
  });

  it("returns success criteria", () => {
    const nonTextContent = getAccessibilityRequirement({
      requirementId: "wcag20:1.1.1",
    });
    expect(nonTextContent).toEqual({
      conformanceLevel: "WCAG 2.0 and later on level A and higher",
      requirementType: "success criterion",
      title: "1.1.1 Non-text Content (Level A)",
      shortTitle: "1.1.1 Non-text Content",
      url: "https://www.w3.org/TR/WCAG22/#non-text-content",
    });
  });

  it("returns ARIA requirements", () => {
    const ariaReq = getAccessibilityRequirement({
      requirementId: "aria12:childrenArePresentational",
      title: "5.2.8 Presentational Children",
    });

    expect(ariaReq).toEqual({
      conformanceLevel: "WAI-ARIA 1.2 author requirements",
      requirementType: "WAI-ARIA requirement",
      title: "5.2.8 Presentational Children",
      shortTitle: "5.2.8 Presentational Children",
      url: "https://www.w3.org/TR/wai-aria-1.2/#childrenarepresentational",
    });
  });

  it("returns Using ARIA rules", () => {
    const fourth = getAccessibilityRequirement({
      requirementId: "using-aria:fourth",
      title: "Fourth Rule of ARIA Use",
      shortTitle: "Fourth Rule",
    });

    expect(fourth).toEqual({
      conformanceLevel: undefined,
      requirementType: "WAI-ARIA rule",
      title: "Fourth Rule of ARIA Use",
      shortTitle: "Fourth Rule",
      url: "https://www.w3.org/TR/using-aria/#fourth",
    });
  });

  it("returns ARIA in HTML requirements", () => {
    const fourth = getAccessibilityRequirement({
      requirementId: "html-aria:docconformance",
      title:
        "ARIA in HTML, 4. Document conformance requirements for use of ARIA attributes in HTML",
    });

    expect(fourth).toEqual({
      conformanceLevel: "ARIA in HTML",
      requirementType: "ARIA in HTML requirement",
      title:
        "ARIA in HTML, 4. Document conformance requirements for use of ARIA attributes in HTML",
      shortTitle:
        "ARIA in HTML, 4. Document conformance requirements for use of ARIA attributes in HTML",
      url: "https://www.w3.org/TR/html-aria/#docconformance",
    });
  });
});
