import fetch from "node-fetch";
import { criteria } from "../data/index";

export async function scrapeRequirements(url: string): Promise<string[]> {
  const pageText = await (await fetch(url)).text();
  return getRequirementsFromText(pageText);
}

export function getRequirementsFromText(pageText: string): string[] {
  const requirements: string[] = [];
  const matches = Array.from(
    pageText.matchAll(/WCAG2.\/Understanding\/([a-z-_]*)/gi)
  );
  const wcagCriteriaGroups = Array.from(
    new Set(matches.map((match) => match[1]))
  );
  for (const potentialCriterion of wcagCriteriaGroups) {
    const scId = `WCAG2:${potentialCriterion.toLowerCase()}`;
    if (Object.values(criteria).some((sc) => sc?.scId === scId)) {
      requirements.push(scId);
    }
  }
  return requirements;
}
