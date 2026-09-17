import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";
import globby from "globby";

import { ApprovalRecord } from "./types";

type RuleVersionEntry = {
  file: string;
  url?: string;
  /** YAML may parse plain dates as `Date` */
  isoDate?: string | Date;
  w3cDate?: string;
  changes?: string[];
};

export function loadApprovalByRuleId(
  wcagActRulesDir: string,
): Record<string, ApprovalRecord> {
  const ymlPath = path.join(
    wcagActRulesDir,
    "_data",
    "wcag-act-rules",
    "rule-versions.yml",
  );
  const raw = fs.readFileSync(ymlPath, "utf8");
  const doc = yaml.load(raw) as Record<string, RuleVersionEntry[]>;
  const out: Record<string, ApprovalRecord> = {};

  for (const [ruleId, entries] of Object.entries(doc)) {
    if (!Array.isArray(entries)) continue;
    const indexEntry = entries.find((e) => e.file === "index.md");
    if (indexEntry?.isoDate != null && indexEntry.isoDate !== "") {
      const iso = indexEntry.isoDate;
      const approvalIsoDate =
        iso instanceof Date ? iso.toISOString().slice(0, 10) : String(iso);
      out[ruleId] = { approved: true, approvalIsoDate };
    } else {
      out[ruleId] = { approved: false };
    }
  }

  return out;
}

/** ruleId -> sorted unique implementer names with consistency "complete" */
export function loadCompleteImplementationsByRuleId(
  wcagActRulesDir: string,
): Record<string, string[]> {
  const dataDir = path.join(wcagActRulesDir, "_data", "wcag-act-rules");
  const implDir = path.join(dataDir, "implementations");
  const files = globby.sync(path.join(implDir, "*.json"));
  const byRule: Record<string, Set<string>> = {};
  const implementationNames = loadImplementationNames(dataDir);

  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(file, "utf8")) as {
      name?: string;
      actRuleMapping?: Array<{
        ruleId: string;
        consistency?: string;
      }>;
    };
    const uniqueKey = path.basename(file, ".json");
    const toolName = json.name ?? implementationNames[uniqueKey] ?? uniqueKey;
    for (const row of json.actRuleMapping ?? []) {
      if (row.consistency !== "complete") continue;
      const ruleId = row.ruleId;
      if (!byRule[ruleId]) byRule[ruleId] = new Set();
      byRule[ruleId].add(toolName);
    }
  }

  const result: Record<string, string[]> = {};
  for (const [ruleId, toolNames] of Object.entries(byRule)) {
    result[ruleId] = Array.from(toolNames).sort((a, b) => a.localeCompare(b));
  }
  return result;
}

function loadImplementationNames(dataDir: string): Record<string, string> {
  const implementationsPath = path.join(dataDir, "act-implementations.yml");
  if (!fs.existsSync(implementationsPath)) return {};

  const entries = yaml.load(fs.readFileSync(implementationsPath, "utf8")) as
    | Array<{ uniqueKey?: string; name?: string }>
    | undefined;
  const names: Record<string, string> = {};
  for (const entry of entries ?? []) {
    if (entry.uniqueKey && entry.name) names[entry.uniqueKey] = entry.name;
  }
  return names;
}
