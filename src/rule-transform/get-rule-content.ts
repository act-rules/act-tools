import { RulePage, DefinitionPage } from "../types";
import { getFrontmatter } from "./rule-content/get-frontmatter";
import { getRuleBody } from "./rule-content/get-rule-body";
import { getExamplesContent } from "./rule-content/get-examples-content";
import { getGlossary } from "./rule-content/get-glossary";
import { getVersions } from "./rule-content/get-versions";
import { getReferenceLinks } from "./rule-content/get-reference-links";
import { getRuleDefinitions } from "../act/get-rule-definitions";
import { getRequirementsMap } from "./rule-content/get-requirements-map";
import { getInput } from "./rule-content/get-input";

type RuleGenerator = (
  ruleData: RulePage,
  glossary: DefinitionPage[],
  options: Record<string, boolean | undefined>,
  rulesData: RulePage[]
) => string;

const sectionMethodsInOrder: RuleGenerator[] = [
  getFrontmatter,
  getRuleBody,
  getRequirementsMap,
  getInput,
  getExamplesContent,
  getGlossary,
  getVersions,
  getReferenceLinks,
];

export const getRuleContent: RuleGenerator = (
  ruleData,
  glossary,
  options = {},
  rulesData
) => {
  const ruleDefinitions = getRuleDefinitions(ruleData, glossary);
  const rulePageSections = sectionMethodsInOrder.map((createContent) => {
    return createContent(ruleData, ruleDefinitions, options, rulesData);
  });
  return rulePageSections.join("\n\n") + "\n";
};
