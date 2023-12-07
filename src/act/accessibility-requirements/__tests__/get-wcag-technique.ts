import { getWcagTechnique } from "../get-wcag-technique";

describe("getWcagTechnique", () => {
  it("returns a wcag technique", () => {
    const technique = getWcagTechnique("h2");

    expect(technique).toEqual({
      requirementType: "technique",
      title:
        "H2: Combining adjacent image and text links for the same resource",
      shortTitle: "technique H2",
      url: "https://www.w3.org/WAI/WCAG22/Techniques/html/H2",
    });
  });

  it("returns a fallback if the technique number is unknown", () => {
    const technique = getWcagTechnique("h1");
    expect(technique).toEqual({
      requirementType: "technique",
      title: "H1: Unknown technique",
      shortTitle: "technique H1",
      url: "https://www.w3.org/WAI/WCAG22/Techniques/#html",
    });
  });

  it("returns a fallback if the technique type is unknown", () => {
    const technique = getWcagTechnique("X123");
    expect(technique).toEqual({
      requirementType: "technique",
      title: "X123: Unknown technique",
      shortTitle: "technique X123",
      url: "https://www.w3.org/WAI/WCAG22/Techniques/",
    });
  });
});
