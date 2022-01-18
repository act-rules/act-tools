import { RuleFrontMatter } from "../../../types";
import { getInput } from "../get-input";

describe("getInput", () => {
  const filename = "hello-world-abc123.md";

  describe("getInputAspects", () => {
    const defaultMatter: RuleFrontMatter = {
      id: "abc134",
      name: "abc rule",
      rule_type: "atomic",
      description: "hello world",
      input_aspects: [],
    };

    it("returns an Input Aspects heading", () => {
      const input = getInput({ filename, frontmatter: defaultMatter });
      expect(input).toContain("## Input Aspects");
    });

    it("lists each input aspect", () => {
      const input = getInput({
        filename,
        frontmatter: {
          ...defaultMatter,
          input_aspects: ["CSS styling", "DOM Tree"],
        },
      });
      expect(input).toContain(
        "- [CSS styling](https://www.w3.org/TR/act-rules-aspects/#input-aspects-css)"
      );
      expect(input).toContain(
        "- [DOM Tree](https://www.w3.org/TR/act-rules-aspects/#input-aspects-dom)"
      );
    });
  });

  describe("getInputRules", () => {
    const defaultMatter: RuleFrontMatter = {
      id: "abc123",
      name: "ABC Rule",
      rule_type: "composite",
      description: "hello world",
      input_rules: [],
    };
    const dummyRules = [
      {
        filename: "foo-abc123.md",
        frontmatter: defaultMatter,
      },
      {
        filename: "bar-xyz789.md",
        frontmatter: {
          ...defaultMatter,
          id: "xyz789",
          name: "XYZ Rule",
        },
      },
    ];

    it("returns an Input Rules heading", () => {
      const input = getInput({ filename, frontmatter: defaultMatter });
      expect(input).toContain("## Input Rules");
    });

    it("lists each input rules", () => {
      const input = getInput(
        {
          filename,
          frontmatter: {
            ...defaultMatter,
            input_rules: ["abc123", "xyz789"],
          },
        },
        null,
        null,
        dummyRules
      );
      expect(input).toContain(
        "- [ABC Rule](/standards-guidelines/act/rules/foo-abc123/)"
      );
      expect(input).toContain(
        "- [XYZ Rule](/standards-guidelines/act/rules/bar-xyz789/)"
      );
    });
  });
});
