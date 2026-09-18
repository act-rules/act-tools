import { RuleApprovalRow } from "./types";

export function formatSnapshotJson(rows: RuleApprovalRow[]): string {
  return `${JSON.stringify(rows, null, 2)}\n`;
}

export function snapshotsEqual(left: string, right: string): boolean {
  try {
    return (
      formatParsedJson(JSON.parse(left)) === formatParsedJson(JSON.parse(right))
    );
  } catch {
    return left === right;
  }
}

function formatParsedJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
