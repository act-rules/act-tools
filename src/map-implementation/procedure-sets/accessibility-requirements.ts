import { AccessibilityRequirement } from "../types";
import { criteria, Criterion } from "../../data/index";

export function mapsAllRequirements(
  failedRequirements: string[],
  ruleAccessibilityRequirements?: Record<string, AccessibilityRequirement>
): boolean {
  const requirementKeys = getRequirementUris(ruleAccessibilityRequirements);
  failedRequirements = failedRequirements.filter(isUnique).filter(isNormative);
  if (failedRequirements.length !== requirementKeys.length) {
    return false;
  }

  return requirementKeys.every((requirement) =>
    failedRequirements.includes(requirement)
  );
}

export function getRequirementUris(
  ruleAccessibilityRequirements?: Record<string, AccessibilityRequirement>
): string[] {
  if (!ruleAccessibilityRequirements) {
    return [];
  }
  const requirementUris: string[] = [];
  for (const key of Object.keys(ruleAccessibilityRequirements)) {
    const criterion = findCriterionByKey(key);
    if (criterion) {
      requirementUris.push(criterion.scId);
    }
  }
  return requirementUris;
}

function findCriterionByKey(wcagKey: string): Criterion | undefined {
  const match = wcagKey.match(/^wcag2\d:(.*)$/i) ?? [];
  return criteria[match[1]];
}

function isUnique(item: unknown, index: number, arr: unknown[]): boolean {
  return arr.indexOf(item) === index;
}

function isNormative(item: string): boolean {
  return item.substring(0, 6) === "WCAG2:";
}
