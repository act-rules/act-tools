import { getWcagCriterion } from "./accessibility-requirements/get-wcag-criterion";
import { getWcagTechnique } from "./accessibility-requirements/get-wcag-technique";

type AccessibilityDocuments = {
  [name: string]: {
    baseURL: string;
    requirementType: string;
    conformanceLevel?: string;
  };
};

const accessibilityDocs: AccessibilityDocuments = {
  aria12: {
    conformanceLevel: "WAI-ARIA 1.2 author requirements",
    baseURL: "https://www.w3.org/TR/wai-aria-1.2/#",
    requirementType: "WAI-ARIA requirement",
  },
  // Note: as of 28/09/2023, we have no rule mapping to DPUB ARIA
  "dpub-aria": {
    conformanceLevel:
      "WAI-ARIA Digital Publishing Module 1.0 author requirements",
    baseURL: "https://www.w3.org/TR/dpub-aria-1.0/#",
    requirementType: "WAI-ARIA Digital Publishing Module requirement",
  },
  // Note: as of 28/09/2023, we have no rule mapping to Graphics ARIA
  "graphics-aria": {
    conformanceLevel: "WAI-ARIA Graphics Module 1.0 author requirements",
    baseURL: "https://www.w3.org/TR/graphics-aria-1.0/#",
    requirementType: "WAI-ARIA Graphics Module requirement",
  },
  "html-aria": {
    conformanceLevel: "ARIA in HTML",
    baseURL: "https://www.w3.org/TR/html-aria/#",
    requirementType: "ARIA in HTML requirement",
  },
  "using-aria": {
    baseURL: "https://www.w3.org/TR/using-aria/#",
    requirementType: "WAI-ARIA rule",
  },
  "wcag-text": {
    conformanceLevel: "WCAG 2.2",
    baseURL: "https://www.w3.org/TR/WCAG22/#",
    requirementType: "WCAG 2 conformance requirement",
  },
};

export type AccessibilityRequirement = {
  title: string;
  requirementType: string;
  url: string;
  conformanceLevel?: string;
  shortTitle?: string;
};

export function getAccessibilityRequirement({
  requirementId,
  title,
  shortTitle,
}: {
  requirementId: string;
  title?: string;
  shortTitle?: string;
}): AccessibilityRequirement | void {
  shortTitle = shortTitle || title;
  const [accDocument, accRequirement] = requirementId.toLowerCase().split(":");

  if (accDocument.substr(0, 5) === "wcag2") {
    return getWcagCriterion(accRequirement);
  } else if (["technique", "wcag-technique"].includes(accDocument)) {
    return getWcagTechnique(accRequirement);
  } else if (accessibilityDocs[accDocument]) {
    const { baseURL, conformanceLevel, requirementType } =
      accessibilityDocs[accDocument];
    return {
      requirementType,
      conformanceLevel,
      title: title || shortTitle || "",
      shortTitle,
      url: `${baseURL}${accRequirement}`,
    };
  }
}

export { getWcagCriterion, getWcagTechnique };
