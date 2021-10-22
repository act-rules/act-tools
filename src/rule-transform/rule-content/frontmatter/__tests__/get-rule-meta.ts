import * as yaml from "js-yaml";
import { RuleFrontMatter } from "../../../../types";
import moment from "moment";
import { getRuleMeta } from "../get-rule-meta";

function stripDashes(str: string): string {
  return str.replace(/---/g, "");
}

describe("getRuleMeta", () => {
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
    const ruleMeta = getRuleMeta(frontmatter);
    const frontmatterData = stripDashes(ruleMeta);
    const data = yaml.load(frontmatterData);

    expect(data).toEqual({
      id: "abc123",
      name: "hello world",
      description: "Some description\n",
      rule_type: "atomic",
      scs_tested: [
        {
          num: "2.1.4",
          handle: "Character Key Shortcuts",
          level: "A",
        },
      ],
      input_aspects: [
        {
          handle: "DOM Tree",
          url: "https://www.w3.org/TR/act-rules-aspects/#input-aspects-dom",
        },
      ],
      last_modified: moment().format("D MMMM YYYY"),
      accessibility_requirements: {
        "wcag21:2.1.4": sc214Requirement,
      },
    });
  });
});
