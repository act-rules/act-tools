import { RulePage, DefinitionPage } from "../types";
import { getFrontmatter } from "./rule-content/get-frontmatter";
import { getRuleBody } from "./rule-content/get-rule-body";
import { getExamplesContent } from "./rule-content/get-examples-content";
import { getGlossary } from "./rule-content/get-glossary";
import { getImplementations } from "./rule-content/get-implementations";
import { getChangelog } from "./rule-content/get-changelog";
import { getReferenceLinks } from "./rule-content/get-reference-links";
import { getRuleDefinitions } from "../act/get-rule-definitions";

type RuleGenerator = (
  ruleData: RulePage,
  glossary: DefinitionPage[],
  options: Record<string, boolean | undefined>
) => string;

const sectionMethodsInOrder: RuleGenerator[] = [
  getFrontmatter,
  getRuleBody,
  getExamplesContent,
  getGlossary,
  getImplementations,
  getChangelog,
  getReferenceLinks,
];

export const getRuleContent: RuleGenerator = (
  ruleData,
  glossary,
  options = {}
) => {
  const ruleDefinitions = getRuleDefinitions(ruleData, glossary);
  const rulePageSections = sectionMethodsInOrder.map((createContent) => {
    return createContent(ruleData, ruleDefinitions, options);
  });
  return rulePageSections.join("\n\n") + "\n";
};
