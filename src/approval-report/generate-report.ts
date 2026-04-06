import markdownTable from "markdown-table";

import { ChangeEntry, ReportBucket, RuleApprovalRow } from "./types";

type GithubRepoRef = { owner: string; repo: string };

type SectionTableKind =
  | "approvedNeedsUpdate"
  | "proposedNeedsUpdate"
  | "approvedCurrent"
  | "notReady";

const WAI_IMPLEMENTATIONS_BASE =
  "https://www.w3.org/WAI/standards-guidelines/act/rules";

const GITHUB_OPEN_ISSUES_SEARCH =
  "https://github.com/act-rules/act-rules.github.io/issues?utf8=%E2%9C%93&q=is:issue+is:open+";

const GITHUB_BLOCKER_ISSUES_SEARCH =
  "https://github.com/act-rules/act-rules.github.io/issues?utf8=%E2%9C%93&q=is:issue+is:open+label:Blocker+";

export function generateApprovalReportMarkdown(
  rows: RuleApprovalRow[],
  github: GithubRepoRef,
): string {
  const generated = new Date().toISOString().slice(0, 10);
  const approvedUpdate = sortBucketRows(
    byBucket(rows, "approvedReadyForUpdate"),
    "approvedNeedsUpdate",
  );
  const proposedUpdate = sortBucketRows(
    byBucket(rows, "proposedReadyForUpdate"),
    "proposedNeedsUpdate",
  );
  const approvedOk = sortBucketRows(
    byBucket(rows, "approvedUpToDate"),
    "approvedCurrent",
  );
  const notReady = sortBucketRows(byBucket(rows, "notReady"), "notReady");

  const sections: string[] = [
    "# ACT rules ready for approval",
    "",
    `Generated: ${generated}`,
    "",
    formatSection(
      "Approved ready for update",
      approvedUpdate,
      "approvedNeedsUpdate",
    ),
    formatSection(
      "Proposed ready for update",
      proposedUpdate,
      "proposedNeedsUpdate",
    ),
    formatSection("Approved, up to date", approvedOk, "approvedCurrent"),
    formatSection("Not ready", notReady, "notReady"),
  ];

  const approvedDetail = approvedUpdate;
  const proposedDetail = proposedUpdate;

  if (approvedDetail.length > 0) {
    sections.push("## Approved ready for update — details", "");
    for (const r of approvedDetail) {
      sections.push(...renderRuleSection(r, true, github));
    }
  }

  if (proposedDetail.length > 0) {
    sections.push("## Proposed ready for update — details", "");
    for (const r of proposedDetail) {
      sections.push(...renderRuleSection(r, false, github));
    }
  }

  return sections.join("\n").trimEnd() + "\n";
}

/**
 * Order rows for a summary table: commits behind (desc, when column exists), blockers (asc, when
 * column exists), issues (asc). Each composite and its in-bucket composed inputs form one unit
 * ordered by the composite's keys; composed rows sit directly under that composite. If several
 * composites list the same input, the lexicographically greatest composite id is the parent.
 */
function sortBucketRows(
  bucket: RuleApprovalRow[],
  kind: SectionTableKind,
): RuleApprovalRow[] {
  const cmp = (a: RuleApprovalRow, b: RuleApprovalRow) =>
    compareRowsForTable(a, b, kind);

  const compositeRows = bucket.filter((r) => r.ruleTypeSummary === "composite");
  const compositeIds = new Set(compositeRows.map((r) => r.ruleId));

  function parentCompositeIdForRow(row: RuleApprovalRow): string | null {
    if (row.ruleTypeSummary !== "composed") return null;
    const parentIds = compositeRows
      .filter((c) => c.compositeInputs?.includes(row.ruleId))
      .map((c) => c.ruleId);
    if (parentIds.length === 0) return null;
    return parentIds.sort((x, y) => y.localeCompare(x))[0];
  }

  const childRuleIds = new Set<string>();
  for (const r of bucket) {
    if (r.ruleTypeSummary !== "composed") continue;
    const p = parentCompositeIdForRow(r);
    if (p !== null && compositeIds.has(p)) childRuleIds.add(r.ruleId);
  }

  type Unit =
    | { kind: "group"; head: RuleApprovalRow; children: RuleApprovalRow[] }
    | { kind: "singleton"; row: RuleApprovalRow };

  const units: Unit[] = [];

  for (const comp of compositeRows) {
    const children = bucket.filter(
      (r) =>
        r.ruleTypeSummary === "composed" &&
        parentCompositeIdForRow(r) === comp.ruleId,
    );
    children.sort(cmp);
    units.push({ kind: "group", head: comp, children });
  }

  for (const r of bucket) {
    if (r.ruleTypeSummary === "composite") continue;
    if (childRuleIds.has(r.ruleId)) continue;
    units.push({ kind: "singleton", row: r });
  }

  units.sort((u, v) => {
    const a = u.kind === "group" ? u.head : u.row;
    const b = v.kind === "group" ? v.head : v.row;
    return cmp(a, b);
  });

  const result: RuleApprovalRow[] = [];
  for (const u of units) {
    if (u.kind === "group") {
      result.push(u.head);
      result.push(...u.children);
    } else {
      result.push(u.row);
    }
  }
  return result;
}

function compareRowsForTable(
  a: RuleApprovalRow,
  b: RuleApprovalRow,
  kind: SectionTableKind,
): number {
  const useCommits = kind === "approvedNeedsUpdate" || kind === "notReady";
  const useBlockers = kind === "notReady";

  if (useCommits) {
    const ca = commitsSortKey(a);
    const cb = commitsSortKey(b);
    if (cb !== ca) return cb - ca;
  }
  if (useBlockers && a.blockersCount !== b.blockersCount) {
    return a.blockersCount - b.blockersCount;
  }
  if (a.issues.length !== b.issues.length) {
    return a.issues.length - b.issues.length;
  }
  return a.ruleId.localeCompare(b.ruleId);
}

/** Escape `|` and newlines for pipe-table cells (Markdown). */
function escMdTableCell(s: string): string {
  return s.replace(/\n/g, " ").replace(/\|/g, "\\|");
}

/** For use inside double-quoted HTML attributes (e.g. href). */
function escAttrHref(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Escape text inside HTML elements. */
function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function waiImplementationsUrl(ruleId: string): string {
  return `${WAI_IMPLEMENTATIONS_BASE}/${ruleId}/proposed/#implementations`;
}

function githubOpenIssuesSearchUrl(ruleId: string): string {
  return `${GITHUB_OPEN_ISSUES_SEARCH}${ruleId}+`;
}

function githubBlockerIssuesSearchUrl(ruleId: string): string {
  return `${GITHUB_BLOCKER_ISSUES_SEARCH}${ruleId}+`;
}

function waiStatusLabel(r: RuleApprovalRow): string {
  return r.waiApproved ? "approved" : "proposed";
}

function baseRowCells(r: RuleApprovalRow, includeStatus: boolean): string[] {
  const cells = [
    `[${r.ruleId}](#${r.ruleId})`,
    escMdTableCell(r.name),
    escMdTableCell(r.ruleTypeSummary),
  ];
  if (includeStatus) {
    cells.push(escMdTableCell(waiStatusLabel(r)));
  }
  return cells;
}

function implIssuesCells(r: RuleApprovalRow): string[] {
  const nImpl = r.implementations.length;
  const nIssues = r.issues.length;
  return [
    `[${nImpl}](${waiImplementationsUrl(r.ruleId)})`,
    `[${nIssues}](${githubOpenIssuesSearchUrl(r.ruleId)})`,
  ];
}

function implIssuesBlockersCells(r: RuleApprovalRow): string[] {
  const nBlockers = r.blockersCount;
  return [
    ...implIssuesCells(r),
    `[${nBlockers}](${githubBlockerIssuesSearchUrl(r.ruleId)})`,
  ];
}

function markdownTableOrNone(headers: string[], dataRows: string[][]): string {
  if (dataRows.length === 0) {
    return "_None._\n\n";
  }
  return markdownTable([headers, ...dataRows]) + "\n\n";
}

function commitsSortKey(r: RuleApprovalRow): number {
  const s = r.commitsBehindSummary;
  if (s === "-") return -1;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function formatSection(
  title: string,
  bucketRows: RuleApprovalRow[],
  kind: SectionTableKind,
): string {
  const n = bucketRows.length;
  const lines: string[] = [`## ${title} (${n})`, ""];

  let headers: string[];
  let dataRows: string[][];

  switch (kind) {
    case "approvedNeedsUpdate":
      headers = [
        "Rule ID",
        "Name",
        "Type",
        "Last approved",
        "Last updated",
        "Commits behind",
        "Implementations",
        "Issues",
      ];
      dataRows = bucketRows.map((r) => [
        ...baseRowCells(r, false),
        escMdTableCell(r.lastApprovedSummary),
        escMdTableCell(r.lastUpdatedSummary),
        escMdTableCell(r.commitsBehindSummary),
        ...implIssuesCells(r),
      ]);
      break;
    case "proposedNeedsUpdate":
      headers = [
        "Rule ID",
        "Name",
        "Type",
        "Last updated",
        "Implementations",
        "Issues",
      ];
      dataRows = bucketRows.map((r) => [
        ...baseRowCells(r, false),
        escMdTableCell(r.lastUpdatedSummary),
        ...implIssuesCells(r),
      ]);
      break;
    case "approvedCurrent":
      headers = [
        "Rule ID",
        "Name",
        "Type",
        "Last approved",
        "Implementations",
        "Issues",
      ];
      dataRows = bucketRows.map((r) => [
        ...baseRowCells(r, false),
        escMdTableCell(r.lastApprovedSummary),
        ...implIssuesCells(r),
      ]);
      break;
    case "notReady":
      headers = [
        "Rule ID",
        "Name",
        "Type",
        "Status",
        "Last approved",
        "Last updated",
        "Commits behind",
        "Implementations",
        "Issues",
        "Blockers",
      ];
      dataRows = bucketRows.map((r) => [
        ...baseRowCells(r, true),
        escMdTableCell(r.lastApprovedSummary),
        escMdTableCell(r.lastUpdatedSummary),
        escMdTableCell(r.commitsBehindSummary),
        ...implIssuesBlockersCells(r),
      ]);
      break;
  }

  lines.push(markdownTableOrNone(headers, dataRows));
  return lines.join("\n");
}

function byBucket(
  rows: RuleApprovalRow[],
  bucket: ReportBucket,
): RuleApprovalRow[] {
  return rows.filter((r) => r.reportBucket === bucket);
}

function formatChangeLine(
  c: ChangeEntry,
  githubOwner: string,
  githubRepo: string,
): string {
  const short = c.hash.slice(0, 7);
  const commitUrl = `https://github.com/${githubOwner}/${githubRepo}/commit/${c.hash}`;
  const parts: string[] = [];
  if (c.touchedRule) parts.push("rule");
  if (c.touchedDefinitionKeys.length > 0) {
    parts.push(`definition(s): ${c.touchedDefinitionKeys.join(", ")}`);
  }
  const suffix = parts.length > 0 ? ` (${parts.join("; ")})` : "";
  const hashLink = `<a href="${escAttrHref(commitUrl)}"><code>${escHtml(short)}</code></a>`;
  return `${hashLink} ${escHtml(c.subject)}${escHtml(suffix)}`;
}

function renderRuleSection(
  r: RuleApprovalRow,
  includeChanges: boolean,
  github: GithubRepoRef,
): string[] {
  const headingText = `${r.ruleId} — ${r.name}`;
  const lines: string[] = [
    `<h3 id="${escHtml(r.ruleId)}">${escHtml(headingText)}</h3>`,
    "",
  ];
  if (r.approvalIsoDate) {
    lines.push(`**Approved (snapshot):** ${r.approvalIsoDate}`, "");
  }
  if (r.implementations.length > 0) {
    lines.push(
      `**Implementations (complete):** ${r.implementations.join(", ")}`,
      "",
    );
  } else {
    lines.push("**Implementations (complete):** _none_", "");
  }

  if (includeChanges && r.changes.length > 0) {
    lines.push("#### Changes since approval", "");
    for (const c of r.changes) {
      lines.push(`- ${formatChangeLine(c, github.owner, github.repo)}`);
    }
    lines.push("");
  } else if (includeChanges) {
    lines.push(
      "#### Changes since approval",
      "",
      "_No commits after approval date._",
      "",
    );
  }

  lines.push("#### Issues", "");
  if (r.issues.length === 0) {
    lines.push("_None matched (by rule id in title or body)._", "");
  } else {
    for (const issue of r.issues) {
      const label = `#${issue.number}: ${issue.title.replace(/\s+/g, " ")}`;
      lines.push(
        `- <a href="${escAttrHref(issue.html_url)}">${escHtml(label)}</a>`,
      );
    }
    lines.push("");
  }

  lines.push("---", "");
  return lines;
}
