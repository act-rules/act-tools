import { outdent } from "outdent";
import moment from "moment";
import { AccessibilityRequirement, RuleFrontMatter } from "../../../types";
import { criteria } from "../../../data/index";

export function getRuleMeta(
  frontmatter: RuleFrontMatter,
  fileName: string
): string {
  const date = moment().format("D MMMM YYYY");
  return outdent`
    id: ${frontmatter.id}
    name: "${frontmatter.name}"
    rule_type: ${frontmatter.rule_type}
    original_file: ${fileName}
    description: |
      ${frontmatter.description.trim()}
    last_modified: ${date}
    ${getSCsTested(frontmatter.accessibility_requirements || {})}
  `.trim();
}

function getSCsTested(
  accessibility_requirements: Record<string, AccessibilityRequirement>
): string {
  const accRequirements = Object.entries(accessibility_requirements);
  let criterionCount = 0;
  let text = "scs_tested:";
  accRequirements.forEach(([requirementId, req]) => {
    const [requirementDoc, scNumber] = requirementId.split(":");
    const criterion = criteria[scNumber];
    if (!requirementDoc.includes("wcag2") || !criterion || req.secondary) {
      return;
    }

    criterionCount++;
    text += `\n  - handle: ${criterion.handle}`;
    text += `\n    num: ${criterion.num}`;
    text += `\n    level: ${criterion.level}`;
  });

  return criterionCount === 0 ? "" : text;
}
