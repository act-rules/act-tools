import { ActImplementationReport } from "../map-implementation/types";

export type RuleMapping = Record<
  string,
  {
    ruleName: string;
    consistency: string | null;
    procedureNames: string[];
  }
>;

export function getRuleMapping({
  actRuleMapping,
}: ActImplementationReport): RuleMapping {
  const ruleMapping: RuleMapping = {};
  for (const {
    ruleId,
    ruleName,
    consistency,
    procedureNames,
  } of actRuleMapping) {
    ruleMapping[ruleId] = { ruleName, consistency, procedureNames };
  }
  return ruleMapping;
}
