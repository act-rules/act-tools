import * as yaml from "js-yaml";
import { RuleFrontMatter } from "../../../../types";
import moment from "moment";
import { getRuleMeta } from "../get-rule-meta";

function stripDashes(str: string): string {
  return str.replace(/---/g, "");
}

describe("getRuleMeta", () => {
  const filename = "rule-abc123.md";
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

  it("has the appropriate data in the yaml", () => {
    const ruleMeta = getRuleMeta(frontmatter, filename);
    const frontmatterData = stripDashes(ruleMeta);
    const data = yaml.load(frontmatterData);

    expect(data).toEqual({
      id: "abc123",
      name: "hello world",
      description: "Some description\n",
      rule_type: "atomic",
      original_file: filename,
      scs_tested: [
        {
          num: "2.1.4",
          handle: "Character Key Shortcuts",
          level: "A",
        },
      ],
      last_modified: moment().format("D MMMM YYYY"),
    });
  });

  it("skips secondary requirements in scs_tested", () => {
    const fm = {
      ...frontmatter,
      accessibility_requirements: {
        "wcag21:1.4.3": sc214Requirement,
        "wcag21:2.4.6": {
          ...sc214Requirement,
          secondary: true,
        },
      },
    };
    const ruleMeta = getRuleMeta(fm, filename);
    const frontmatterData = stripDashes(ruleMeta);
    const data = yaml.load(frontmatterData);

    expect(data).toEqual({
      id: "abc123",
      name: "hello world",
      description: "Some description\n",
      rule_type: "atomic",
      original_file: filename,
      scs_tested: [
        {
          num: "1.4.3",
          handle: "Contrast (Minimum)",
          level: "AA",
        },
      ],
      last_modified: moment().format("D MMMM YYYY"),
    });
  });
});
