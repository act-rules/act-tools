import * as fs from "node:fs";

import { RuleApprovalRow } from "./types";

export function loadRuleApprovalRows(filePath: string): RuleApprovalRow[] {
  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (
    !Array.isArray(parsed) ||
    parsed.some(
      (row) =>
        typeof row !== "object" ||
        row === null ||
        typeof (row as { ruleId?: unknown }).ruleId !== "string",
    )
  ) {
    throw new Error(`${filePath} is not a RuleApprovalRow JSON array`);
  }
  return parsed as RuleApprovalRow[];
}
