import { RulePage, DefinitionPage } from "../types";
import { getFrontmatter } from "./get-frontmatter";
import { getRuleMetadata } from "./get-rule-metadata";
import { getRuleDescription } from "./get-rule-description";
import { getRuleBody } from "./get-rule-body";
import { getGlossary } from "./get-glossary";
import { getMdAcknowledgements } from "./get-acknowledgements";
import { getChangelog } from "./get-changelog";
import { getReferenceLinks } from "./get-reference-links";

type RuleGenerator = (ruleData: RulePage, glossary: DefinitionPage[]) => string;

const sectionMethodsInOrder: RuleGenerator[] = [
  getFrontmatter,
  getRuleMetadata,
  getRuleDescription,
  getRuleBody,
  getGlossary,
  getMdAcknowledgements,
  getChangelog,
  getReferenceLinks,
];

export const getRuleContent: RuleGenerator = (ruleData, glossary) => {
  const rulePageSections = sectionMethodsInOrder.map((createContent) => {
    return createContent(ruleData, glossary);
  });
  return rulePageSections.join("\n\n");
};
