import { RulePage, DefinitionPage } from "../types";
import { getFrontmatter } from "./rule-content/get-frontmatter";
import { getRuleBody } from "./rule-content/get-rule-body";
import { getGlossary } from "./rule-content/get-glossary";
import { getImplementations } from "./rule-content/get-implementations";
import { getMdAcknowledgements } from "./rule-content/get-acknowledgements";
import { getChangelog } from "./rule-content/get-changelog";
import { getReferenceLinks } from "./rule-content/get-reference-links";

type RuleGenerator = (
  ruleData: RulePage, 
  glossary: DefinitionPage[],
  options: Record<string, boolean|undefined>
) => string;

const sectionMethodsInOrder: RuleGenerator[] = [
  getFrontmatter,
  getRuleBody,
  getGlossary,
  getImplementations,
  getMdAcknowledgements,
  getChangelog,
  getReferenceLinks,
];

export const getRuleContent: RuleGenerator = (ruleData, glossary, options = {}) => {
  const rulePageSections = sectionMethodsInOrder.map((createContent) => {
    return createContent(ruleData, glossary, options || {});
  });
  return rulePageSections.join("\n\n");
};
