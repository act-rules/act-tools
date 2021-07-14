import { readFileSync } from "fs";
import { resolve } from "path";
import { RulePage, RuleFrontMatter } from "../types";
import { getWcagCriterion } from "../rule/get-wcag-criterion";

export type WcagMapping = {
  title: string;
  permalink: string;
  successCriteria: string[];
  wcagTechniques: string[];
  proposed?: boolean;
};

export type WcagToActMapping = {
  "act-rules": WcagMapping[];
};

export function updateWcagMapping(
  wcagMapping: WcagMapping[],
  { frontmatter, filename, proposed }: RulePage
): WcagMapping[] {
  const { id } = frontmatter;
  wcagMapping = wcagMapping.filter(
    ({ permalink }) => !permalink.includes("-" + id)
  );
  const { successCriteria, wcagTechniques } = getRequirements(frontmatter);

  wcagMapping.push({
    title: frontmatter.name.replace(/`/gi, ""),
    permalink: ruleUrl(filename),
    successCriteria,
    wcagTechniques,
    proposed,
  });
  return wcagMapping;
}

function ruleUrl(filename: string): string {
  return `/standards-guidelines/act/rules/${filename.replace(".md", "")}/`;
}

export function getWcagMapping(dirname: string): WcagToActMapping {
  const mappingStr = readFileSync(
    resolve(dirname, "wcag-mapping.json"),
    "utf-8"
  );
  return JSON.parse(mappingStr) as WcagToActMapping;
}

export function getRequirements({
  accessibility_requirements: requirements,
}: RuleFrontMatter): { successCriteria: string[]; wcagTechniques: string[] } {
  const successCriteria: string[] = [];
  const wcagTechniques: string[] = [];
  Object.keys(requirements || {}).forEach((id) => {
    const [standard, key] = id.split(":");
    if (standard === "wcag-technique") {
      wcagTechniques.push(key);
    }

    if (standard.indexOf("wcag2") === 0) {
      const scId = getWcagCriterion(key).url.split("#")[1];
      if (scId) {
        successCriteria.push(scId);
      }
      return;
    }
  });
  return { successCriteria, wcagTechniques };
}
