import * as fs from "fs";
import { createFile } from "../utils/create-file";
import { RulePage, RuleFrontMatter } from "../types";
import { getWcagCriterion } from "../act/get-wcag-criterion";

export type ActRulePage = {
  title: string;
  permalink: string;
  successCriteria: string[];
  wcagTechniques: string[];
  proposed?: boolean;
};

export type WcagMapping = {
  "act-rules": ActRulePage[];
};

export async function createWcagMapping(
  wcagMappingPath: string,
  rulePages: RulePage[],
  { proposed = false }: { proposed?: boolean } = {}
): Promise<WcagMapping> {
  let wcagMapping: WcagMapping;
  try {
    wcagMapping = JSON.parse(fs.readFileSync(wcagMappingPath, "utf8"));
  } catch (e) {
    wcagMapping = { "act-rules": [] };
  }

  wcagMapping["act-rules"] = rulePages.reduce((actRulePages, rulePage) => {
    return updateWcagMapping(actRulePages, rulePage, { proposed });
  }, wcagMapping["act-rules"]);

  await createFile(wcagMappingPath, wcagMapping);

  return wcagMapping;
}

export function updateWcagMapping(
  wcagMapping: ActRulePage[],
  { frontmatter, filename }: RulePage,
  { proposed }: { proposed: boolean }
): ActRulePage[] {
  const { id } = frontmatter;
  wcagMapping = wcagMapping.filter(({ permalink }) => !permalink.includes(id));
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

function ruleUrl(filename: string): string {
  return `/standards-guidelines/act/rules/${filename.replace(".md", "")}/`;
}
