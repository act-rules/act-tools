import { AccessibilityRequirement } from "../types";
import { criteria, Criterion } from "../../data/index";

export function mapsAllRequirements(
  failedRequirements: string[],
  ruleAccessibilityRequirements?: Record<
    string,
    AccessibilityRequirement
  > | null
): boolean {
  const allowedCriteria: string[] = [];
  const missingCriteria: string[] = [];
  Object.entries(ruleAccessibilityRequirements || {}).forEach(
    ([key, requirement]) => {
      const criterion = findCriterionByKey(key)?.scId;
      if (!criterion) return;
      allowedCriteria.push(criterion);
      if (
        "secondary" in requirement === false &&
        !failedRequirements.includes(criterion)
      ) {
        missingCriteria.push(criterion);
      }
    }
  );
  if (missingCriteria.length) {
    return false;
  }

  return failedRequirements.every(
    (failedRequirement) =>
      !isNormative(failedRequirement) ||
      allowedCriteria.includes(failedRequirement)
  );
}

export function getRequirementUris(
  ruleAccessibilityRequirements?: Record<
    string,
    AccessibilityRequirement
  > | null
): string[] {
  if (!ruleAccessibilityRequirements) {
    return [];
  }
  const requirementUris: string[] = [];
  for (const [key, requirement] of Object.entries(
    ruleAccessibilityRequirements
  )) {
    const criterion = findCriterionByKey(key);
    if (criterion && "secondary" in requirement === false) {
      requirementUris.push(criterion.scId);
    }
  }
  return requirementUris;
}

function findCriterionByKey(wcagKey: string): Criterion | undefined {
  const match = wcagKey.match(/^wcag2\d:(.*)$/i) ?? [];
  return criteria[match[1]];
}

function isNormative(item: string): boolean {
  return item.substring(0, 6) === "WCAG2:";
}
