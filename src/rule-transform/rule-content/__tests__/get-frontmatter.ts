import * as yaml from "js-yaml";
import { getFrontmatter } from "../get-frontmatter";
import { RuleFrontMatter } from "../../../types";
import { getFooter } from "../frontmatter/get-footer";
import { getRuleMeta } from "../frontmatter/get-rule-meta";

function stripDashes(str: string): string {
  return str.replace(/---/g, "");
}

describe("rule-content", () => {
  const filenameNoExt = "hello-world-198j8j";
  const sc214Requirement = {
    forConformance: true,
    failed: "not satisfied",
    passed: "satisfied",
    inapplicable: "further testing needed",
  };
  const frontmatter: RuleFrontMatter = {
    id: "abc123",
    name: "hello world",
    rule_type: "atomic",
    description: "Some description",
    input_aspects: ["DOM Tree"],
    accessibility_requirements: {
      "wcag21:2.1.4": sc214Requirement,
    },
  };
  const ruleData = {
    filename: `${filenameNoExt}.md`,
    frontmatter,
  };

  describe("get-frontmatter", () => {
    it('starts and ends with a line of "---"', () => {
      const lines = getFrontmatter(ruleData).split("\n");
      expect(lines[0]).toBe("---");
      expect(lines[lines.length - 1]).toBe("---");
    });

    it('returns valid yaml between the "---"s', () => {
      const frontmatter = getFrontmatter(ruleData);
      const frontmatterData = stripDashes(frontmatter);
      expect(() => {
        yaml.load(frontmatterData);
      }).not.toThrow();
    });

    it("has the appropriate data in the yaml", () => {
      const frontmatter = getFrontmatter(ruleData, [], { proposed: true });
      const frontmatterData = stripDashes(frontmatter);
      const data = yaml.load(frontmatterData);

      expect(data).toEqual({
        title: ruleData.frontmatter.name,
        permalink: `/standards-guidelines/act/rules/${filenameNoExt}/`,
        ref: `/standards-guidelines/act/rules/${filenameNoExt}/`,
        lang: "en",
        github: {
          repository: `w3c/wcag-act-rules`,
          path: `content/${ruleData.filename}`,
        },
        footer: getFooter(ruleData.frontmatter.acknowledgments) + "\n",
        proposed: true,
        rule_meta: yaml.load(getRuleMeta(ruleData.frontmatter)),
      });
    });

    it("does not include markdown in the title", () => {
      const name = "`*Hello*` **world, welcome** to _ACT_taskforce_ **";
      const frontmatterStr = getFrontmatter({
        filename: `${filenameNoExt}.md`,
        frontmatter: { ...frontmatter, name },
      });
      const frontmatterData = stripDashes(frontmatterStr);
      const data = yaml.load(frontmatterData);

      expect(data).toHaveProperty(
        "title",
        "*Hello* world, welcome to ACT_taskforce **"
      );
    });
  });
});
