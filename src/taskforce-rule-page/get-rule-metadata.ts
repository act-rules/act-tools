import outdent from "outdent";
import { RuleFrontMatter, AccessibilityRequirement } from "../types";
import { getAccessibilityRequirement } from "../../src/rule/get-accessibility-requirement";

type RuleMetadataArg = { frontmatter: RuleFrontMatter; proposed?: boolean };

export const getRuleMetadata = ({
  frontmatter,
  proposed,
}: RuleMetadataArg): string => {
  const metadata = [
    "Rule Type:\n" + toDfnTerm(frontmatter.rule_type),
    "Rule ID:\n" + toDfnTerm(frontmatter.id),
    "Last Modified:\n" + toDfnTerm("TODO (format Sep 25, 2019)"),
    accessibilityRequirements(frontmatter),
    inputAspects(frontmatter),
    inputRules(frontmatter),
  ];
  if (proposed) {
    metadata.unshift("{% include_relative _proposed-banner.html %}");
  }

  return metadata.filter((str) => str !== "").join("\n\n");
};

function inputAspects(frontmatter: RuleFrontMatter): string {
  if (
    frontmatter.rule_type !== "atomic" ||
    !frontmatter.input_aspects?.length
  ) {
    return "";
  }
  const { input_aspects = [] } = frontmatter;
  const inputAspects = input_aspects.map((inputAspect) => {
    const url = getInputAspectUrl(inputAspect);
    return !url ? inputAspect : `[${inputAspect}](${url})`;
  });
  return "Input Aspects:\n" + toDfnTerms(inputAspects);
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

function inputRules(frontmatter: RuleFrontMatter): string {
  if (
    frontmatter.rule_type !== "composite" ||
    !frontmatter.input_rules.length
  ) {
    return "";
  }
  const { input_rules } = frontmatter;
  const ruleDir = "/standards-guidelines/act/rules/";
  const inputRules = input_rules.map((ruleId) => {
    return `[${ruleId}](${ruleDir + ruleId}/)`;
  });
  return "Input Rules:\n" + toDfnTerms(inputRules);
}

function accessibilityRequirements({
  accessibility_requirements,
}: RuleFrontMatter): string {
  const requirementTexts = Object.entries(accessibility_requirements || {}).map(
    accessibilityRequirement
  );
  if (requirementTexts.length === 0) {
    return "";
  }
  return "Accessibility Requirements Mapping:\n" + toDfnTerms(requirementTexts);
}

function accessibilityRequirement([requirementId, mapping]: [
  string,
  AccessibilityRequirement
]): string {
  const requirement = getAccessibilityRequirement({
    requirementId,
    title: mapping.title,
  });
  if (!requirement) {
    console.error(requirementId);
    return "";
  }

  const { title, url, requirementType, conformanceLevel = "" } = requirement;
  return outdent`
    [${title}](${url})
    - ${getConformanceRequirement(conformanceLevel, mapping)}
    - [Outcome](#outcome) mapping:
        - Any \`failed\` outcomes: ${requirementType} ${mapOutcome(
    mapping.failed
  )}
        - All \`passed\` outcomes: ${requirementType} ${mapOutcome(
    mapping.passed
  )}
        - An \`inapplicable\` outcome: ${requirementType} ${mapOutcome(
    mapping.inapplicable
  )}
  `;
}

function getConformanceRequirement(
  conformanceLevel: string,
  mapping: AccessibilityRequirement
): string {
  return mapping.forConformance && conformanceLevel
    ? `**Required for conformance** to ${conformanceLevel}`
    : `Not required to conformance to any W3C accessibility recommendation.`;
}

function mapOutcome(mapping: string): string {
  if (mapping === "satisfied") {
    return "is satisfied";
  } else if (mapping === "not satisfied") {
    return "is not satisfied";
  } else {
    return "needs further testing";
  }
}

function toDfnTerms(terms: string[]): string {
  return terms.map(toDfnTerm).join("\n");
}

function toDfnTerm(term: string): string {
  const lines = term.split("\n");
  const indentedLines = lines.map((line, index) =>
    index === 0 ? `:   ${line}` : `    ${line}`
  );
  return indentedLines.join("\n");
}
