import { RuleApprovalRow } from "./types";

export function formatSnapshotJson(rows: RuleApprovalRow[]): string {
  return `${JSON.stringify(rows, null, 2)}\n`;
}

export function snapshotsEqual(left: string, right: string): boolean {
  try {
    return (
      stableStringify(JSON.parse(left)) === stableStringify(JSON.parse(right))
    );
  } catch {
    return left === right;
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
