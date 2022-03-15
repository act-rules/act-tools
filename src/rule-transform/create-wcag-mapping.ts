import * as fs from "fs";
import { createFile } from "../utils/create-file";
import { RulePage, RuleFrontMatter } from "../types";
import { getWcagCriterion } from "../act/get-accessibility-requirement";

export type ActWcagMap = {
  title: string;
  permalink: string;
  successCriteria: string[];
  wcagTechniques: string[];
  proposed?: boolean;
};

export type WcagMapping = {
  "act-rules": ActWcagMap[];
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

  wcagMapping["act-rules"].sort(wcagMappingSort);

  await createFile(wcagMappingPath, wcagMapping);

  return wcagMapping;
}

export function updateWcagMapping(
  wcagMapping: ActWcagMap[],
  { frontmatter }: RulePage,
  { proposed }: { proposed: boolean }
): ActWcagMap[] {
  const { id } = frontmatter;
  const currentItem = wcagMapping.findIndex(({ permalink }) =>
    permalink.includes(`/${id}`)
  );
  if (currentItem >= 0) {
    proposed = wcagMapping[currentItem].proposed === false ? false : proposed;
    wcagMapping.splice(currentItem, 1);
  }

  const { successCriteria, wcagTechniques } = getRequirements(frontmatter);
  wcagMapping.push({
    title: frontmatter.name.replace(/`/gi, ""),
    permalink: ruleUrl(frontmatter.id, proposed),
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

function ruleUrl(ruleId: string, proposed: boolean): string {
  return `/standards-guidelines/act/rules/${ruleId}/${
    proposed ? "proposed/" : ""
  }`;
}

function wcagMappingSort(mapA: ActWcagMap, mapB: ActWcagMap): number {
  if (mapA.proposed === false && mapB.proposed !== false) {
    return -1;
  }
  if (mapA.proposed !== false && mapB.proposed === false) {
    return 1;
  }
  return mapA.title.toLowerCase() > mapB.title.toLowerCase() ? 1 : -1;
}
