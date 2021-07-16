import { RulePage, DefinitionPage } from "../types";
import { getFrontmatter } from "./get-frontmatter";
import { getRuleBody } from "./get-rule-body";
import { getGlossary } from "./get-glossary";
import { getImplementations } from "./get-implementations";
import { getMdAcknowledgements } from "./get-acknowledgements";
import { getChangelog } from "./get-changelog";
import { getReferenceLinks } from "./get-reference-links";

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
