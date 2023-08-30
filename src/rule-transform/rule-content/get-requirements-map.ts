import assert from "assert";
import { outdent } from "outdent";
import { joinStrings, indent } from "../../utils";
import { getAccessibilityRequirement } from "../../act/get-accessibility-requirement";
import { RuleFrontMatter, AccessibilityRequirement } from "../../types";

type RequirementEntry = [string, AccessibilityRequirement];
type Args = { frontmatter: RuleFrontMatter };

export const headingText = "Accessibility Requirements Mapping";

export const secondaryReqText = outdent`
  This rule is related to the following accessibility requirements, but was 
  not designed to test this requirements directly. These 
  [secondary requirements](https://w3c.github.io/wcag-act/act-rules-format.html#secondary-requirements)
  can either be stricter than the rule requires, or may be satisfied in ways 
  not tested by the rule:
`;

export function getRequirementsMap({ frontmatter }: Args): string {
  const requirementText: string[] = [`## ${headingText}`];
  const accMapping: RequirementEntry[] = Object.entries(
    frontmatter.accessibility_requirements || {}
  );

  const secondaryReq: RequirementEntry[] = [];
  const conformanceReq: RequirementEntry[] = [];
  for (const requirement of accMapping) {
    if ("secondary" in requirement[1]) {
      secondaryReq.push(requirement);
    } else {
      conformanceReq.push(requirement);
    }
  }

  if (conformanceReq.length > 0) {
    requirementText.push(outdent`
      <ul class="act-requirements-list">
      ${indent(conformanceReq.map(conformanceReqItem).join("\n"))}
      </ul>
    `);
  }

  if (secondaryReq.length > 0) {
    requirementText.push(
      "### Secondary Requirements",
      secondaryReqText,
      secondaryReq.map(secondaryReqItem).join("\n")
    );
  }

  if (requirementText.length === 1) {
    requirementText.push("This rule is not required for conformance.");
  }
  return joinStrings(...requirementText);
}

function conformanceReqItem([
  requirementId,
  mapping,
]: RequirementEntry): string {
  assert(!("secondary" in mapping), "Must be conformance requirement");
  const accRequirement = getAccessibilityRequirement({
    requirementId,
    title: mapping.title,
  });
  if (!accRequirement) {
    return `<li>This rule is <strong>not required</strong> for conformance to WCAG 2.1 at any level.</li>`;
  }

  const { conformanceLevel, url, requirementType, shortTitle } = accRequirement;
  const title = accRequirement.title || mapping.title;
  const requiredText = conformanceLevel
    ? `<strong>Required for conformance</strong> to ${conformanceLevel}.`
    : `Not required for conformance to any W3C accessibility recommendation.`;

  return outdent`
    <li><details>
      <summary><span>${title}</span></summary>
      <ul>
        <li><a href="${url}">Learn more about ${shortTitle}</a></li>
        <li>${requiredText}</li>
        <li>Outcome mapping: ${indent(
          outcomeMapping(requirementType, mapping),
          " ",
          4
        ).trim()}</li>
      </ul>
    </details></li>
  `;
}

function outcomeMapping(
  requirementType = "success criterion",
  {
    failed = "not satisfied",
    passed = "further testing is needed",
    inapplicable = "further testing is needed",
  }
) {
  return outdent`
    <ul>
      <li>Any <code>failed</code> outcomes: ${requirementType} ${getConformanceText(
    failed
  )}</li>
      <li>All <code>passed</code> outcomes: ${requirementType} ${getConformanceText(
    passed
  )}</li>
      <li>An <code>inapplicable</code> outcome: ${requirementType} ${getConformanceText(
    inapplicable
  )}</li>
    </ul>
  `;
}

const outcomeMap: Record<string, string> = {
  satisfied: "is satisfied",
  "not satisfied": "is not satisfied",
  "further testing needed": "needs further testing",
};

function getConformanceText(outcome: string): string {
  let outcomeValue = ``;
  if (outcomeMap[outcome]) {
    outcomeValue = outcomeMap[outcome];
  }
  return outcomeValue;
}

function secondaryReqItem([
  requirementId,
  requirement,
]: RequirementEntry): string {
  assert("secondary" in requirement, "secondary mus be defined");
  const { title, secondary } = requirement;
  const accRequirement = getAccessibilityRequirement({ requirementId, title });
  if (!accRequirement) {
    return `- ${title}: ${secondary.trim()}`;
  }
  const label = accRequirement.title || title;
  return `- [${label}](${accRequirement.url}): ${secondary.trim()}`;
}
