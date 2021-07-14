import { AccessibilityRequirement } from "./get-accessibility-requirement";
import * as successCriteria from "../../data/sc-urls.json";

type SuccessCriterion = {
  num: string;
  url: string;
  handle: string;
  wcagType: string;
  level: string;
};
const scUrls: Record<string, SuccessCriterion | undefined> = successCriteria;

const requirementType = "success criterion";
const latestWcagVersion = "2.1";
const highestLevel = "AAA";

// For WCAG SC. Title, URL and more is grabbed from data fetched during build.
export function getWcagCriterion(scNumber: string): AccessibilityRequirement {
  const successCriterion = scUrls[scNumber];
  if (!successCriterion) {
    return fallbackCriterion(scNumber);
  }

  const { num, url, handle, wcagType, level } = successCriterion;
  return {
    requirementType,
    conformanceLevel: getConformanceLevel(wcagType, level),
    title: `${num} ${handle} (Level ${level})`,
    shortTitle: `${num} ${handle}`,
    url,
  };
}

function getConformanceLevel(wcagVersion: string, level: string) {
  let conformanceLevel = `WCAG ${wcagVersion}`;
  if (wcagVersion !== latestWcagVersion) {
    conformanceLevel += " and later";
  }
  conformanceLevel += ` on level ${level}`;
  if (level !== highestLevel) {
    conformanceLevel += " and higher";
  }
  return conformanceLevel;
}

function fallbackCriterion(scNumber: string) {
  return {
    requirementType,
    title: `${scNumber} Unknown success criterion`,
    url: "https://www.w3.org/TR/WCAG21/",
  };
}
