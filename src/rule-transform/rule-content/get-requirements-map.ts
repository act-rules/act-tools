import { joinStrings, indent } from "../../utils";
import { getAccessibilityRequirement } from "../../act/get-accessibility-requirement";
import { RuleFrontMatter, AccessibilityRequirement } from "../../types";
import { outdent } from "outdent";

type Args = { frontmatter: RuleFrontMatter };
export const headingText = "Accessibility Requirements Mapping";

export function getRequirementsMap({ frontmatter }: Args): string {
  const accMapping = Object.entries(
    frontmatter.accessibility_requirements || {}
  );
  if (accMapping.length === 0) {
    return joinStrings(
      `## ${headingText}`,
      "This rule is not required for conformance."
    );
  }

  return outdent`
    ## ${headingText}

    <ul class="act-requirements-list">
    ${indent(
      accMapping
        .map(([requirementId, mapping]) =>
          accRequirementItems(requirementId, mapping)
        )
        .join("\n")
    )}
    </ul>
  `;
}

function accRequirementItems(
  requirementId: string,
  mapping: AccessibilityRequirement
): string {
  const accRequirement = getAccessibilityRequirement({
    requirementId,
    title: mapping.title,
  });
  if (!accRequirement) {
    return `<li>Accessibility Requirements have no or unknown mapping.</li>`;
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
