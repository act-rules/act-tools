import { outdent } from "outdent";
import moment from "moment";
import { AccessibilityRequirement, RuleFrontMatter } from "../../../types";
import { criteria } from "../../../data/index";

export function getRuleMeta(frontmatter: RuleFrontMatter): string {
  const date = moment().format("D MMMM YYYY");
  return outdent`
    id: ${frontmatter.id}
    name: "${frontmatter.name}"
    rule_type: ${frontmatter.rule_type}
    description: |
      ${frontmatter.description.trim()}
    ${getRuleInput(frontmatter)}
    last_modified: ${date}
    ${getSCsTested(frontmatter.accessibility_requirements || {})}
  `.trim();
}

function getRuleInput(frontmatter: RuleFrontMatter): string {
  let ruleInput = "";
  if (frontmatter.rule_type === "atomic") {
    ruleInput = `input_aspects:`;
    frontmatter.input_aspects.forEach((inputAspect) => {
      ruleInput += "\n  - handle: " + inputAspect;
      ruleInput += "\n    url: " + getInputAspectUrl(inputAspect);
    });
  } else {
    ruleInput = `input_aspects:`;
    frontmatter.input_rules.forEach((ruleId) => {
      ruleInput += `\n  - ${ruleId}`;
    });
  }
  return ruleInput;
}

function getInputAspectUrl(inputAspect: string): string {
  const idMap: Record<string, string | undefined> = {
    http: "#input-aspects-http",
    "http-headers": "#input-aspects-http",
    "http headers": "#input-aspects-http",
    dom: "#input-aspects-dom",
    "dom tree": "#input-aspects-dom",
    "css style": "#input-aspects-css",
    "css styles": "#input-aspects-css",
    "css styling": "#input-aspects-css",
    "accessibility tree": "#input-aspects-accessibility",
    language: "#input-aspects-text",
  };
  const urlHash = idMap[inputAspect.toLowerCase()];
  if (!urlHash) {
    return "";
  }
  return `https://www.w3.org/TR/act-rules-aspects/${urlHash}`;
}

function getSCsTested(
  accessibility_requirements: Record<string, AccessibilityRequirement>
): string {
  const accRequirements = Object.entries(accessibility_requirements);
  let criterionCount = 0;
  let text = "scs_tested:";
  accRequirements.forEach(([requirementId]) => {
    const [requirementDoc, scNumber] = requirementId.split(":");
    const criterion = criteria[scNumber];
    if (!requirementDoc.includes("wcag2") || !criterion) return;

    criterionCount++;
    text += `\n  - handle: ${criterion.handle}`;
    text += `\n    num: ${criterion.num}`;
    text += `\n    level: ${criterion.level}`;
  });

  return criterionCount === 0 ? "" : text;
}
