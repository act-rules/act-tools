import * as yaml from "js-yaml";
import { getFrontmatter } from "../get-frontmatter";
import { RuleFrontMatter, RulePage } from '../../types';

function stripDashes(str: string): string {
  return str.replace(/---/g, "");
}

describe("taskforce-markdown", () => {
  const filenameNoExt = "hello-world-198j8j";
  const ruleData = {
    filename: `${filenameNoExt}.md`,
    frontmatter: ({
      name: "hello world",
    } as RuleFrontMatter)
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
      const frontmatter = getFrontmatter(ruleData);
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
      });
    });

    it("does not include markdown in the title", () => {
      const frontmatter = getFrontmatter({
        filename: `${filenameNoExt}.md`,
        frontmatter: {
          name: "`*Hello*` **world, welcome** to _ACT_taskforce_ **",
        },
      } as unknown as RulePage);
      const frontmatterData = stripDashes(frontmatter);
      const data = yaml.load(frontmatterData);

      expect(data).toHaveProperty(
        "title",
        "*Hello* world, welcome to ACT_taskforce **"
      );
    });
  });
});
