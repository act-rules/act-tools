import { getRequirementsFromText } from "../scrape-requirements";

describe("getRequirementsFromText", () => {
  it("returns criteria from different styles of links", () => {
    const requirements = getRequirementsFromText(`
      [SC 1.1.1](https://www.w3.org/WAI/WCAG20/Understanding/non-text-content/)
      <a href="https://www.w3.org/WAI/wcag22/understanding/name-role-value.html">SC</a>
    `);
    expect(requirements).toEqual([
      "WCAG2:non-text-content",
      "WCAG2:name-role-value",
    ]);
  });

  it("does not return duplicates", () => {
    const requirements = getRequirementsFromText(`
      [SC 1.1.1](https://www.w3.org/WAI/WCAG20/Understanding/non-text-content/)
      [SC 1.1.1](https://www.w3.org/WAI/WCAG20/Understanding/non-text-content/)
    `);
    expect(requirements).toEqual(["WCAG2:non-text-content"]);
  });

  it("avoids non-wcag URLs", () => {
    const requirements = getRequirementsFromText(`
      https://www.w3.org/WAI/WCAG21/Understanding/understanding-techniques
    `);
    expect(requirements).toEqual([]);
  });
});
