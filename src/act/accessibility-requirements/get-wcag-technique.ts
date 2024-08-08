import * as techniques from "../../data/techniques-titles.json";
import { AccessibilityRequirement } from "../get-accessibility-requirement";

const techniquesTitles: Record<string, string | undefined> = techniques;

// For WCAG techniques. Title is grabbed from data fetched during build. URL is handcrafted.
export function getWcagTechnique(
  techniqueId: string
): AccessibilityRequirement {
  techniqueId = techniqueId.toUpperCase();
  const techniqueName = techniquesTitles[techniqueId] ?? `Unknown technique`;

  return {
    requirementType: "technique",
    title: `${techniqueId}: ${techniqueName}`,
    shortTitle: `technique ${techniqueId}`,
    url: getTechniqueUrl(techniqueId),
  };
}

const technologyMap: Record<string, string | undefined> = {
  aria: "aria",
  c: "css",
  f: "failures",
  flash: "flash",
  g: "general",
  h: "html",
  pdf: "pdf",
  scr: "client-side-script",
  sl: "silverlight",
  sm: "smil",
  svr: "server-side-script",
  t: "text",
};

function getTechniqueUrl(techniqueId: string): string {
  const baseUrl = `https://www.w3.org/WAI/WCAG22/Techniques/`;
  techniqueId = techniqueId.toUpperCase();
  const prefix = techniqueId.replace(/[0-9]/g, "").toLowerCase();
  const techniqueType = technologyMap[prefix];

  if (!techniqueType) {
    return baseUrl;
  }
  if (!techniquesTitles[techniqueId]) {
    return `${baseUrl}#${techniqueType}`;
  }
  return `${baseUrl}${techniqueType}/${techniqueId}`;
}
