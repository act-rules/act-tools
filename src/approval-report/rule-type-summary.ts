import { RulePage } from "../types";
import type { RuleTypeSummary } from "./types";

/**
 * All atomic rule ids that appear in at least one composite rule's `input_rules`
 * (same source as ACT Rules Format; composites only reference atomics).
 */
export function buildAtomicIdsReferencedByComposites(
  rules: RulePage[],
): Set<string> {
  const ids = new Set<string>();
  for (const r of rules) {
    if (r.frontmatter.rule_type !== "composite") continue;
    for (const inputId of r.frontmatter.input_rules) {
      ids.add(inputId);
    }
  }
  return ids;
}

export function getRuleTypeSummary(
  rule: RulePage,
  referencedAtomicIds: Set<string>,
): RuleTypeSummary {
  const fm = rule.frontmatter;
  if (fm.rule_type === "composite") return "composite";
  if (referencedAtomicIds.has(fm.id)) return "composed";
  return "atomic";
}
