import { normalizeHeadingLevels } from "../generate-glossary";

describe("normalizeHeadingLevels", () => {
  it("decrements all heading hashes by one level, preserves #", () => {
    const input = `#### Item\n##### Subitem\n###### Deep`;
    const output = normalizeHeadingLevels(input);

    expect(output).toBe(`### Item\n#### Subitem\n##### Deep`);
  });

  it("preserves leading spaces before headings", () => {
    const input = `  #### indented`;
    const output = normalizeHeadingLevels(input);

    expect(output).toBe("  ### indented");
  });
});
