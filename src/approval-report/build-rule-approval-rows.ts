import * as path from "node:path";
import { getRuleDefinitions } from "../act/get-rule-definitions";
import { getDefinitionPages, getRulePages } from "../utils/get-page-data";
import {
  getChangesSinceApproval,
  getLatestCommitDateOnPaths,
  pathRelativeToRepo,
} from "./git-changes";
import {
  fetchOpenIssues,
  issueHasBlockerLabel,
  issuesForRuleId,
} from "./github-issues";
import {
  loadApprovalByRuleId,
  loadCompleteImplementationsByRuleId,
} from "./load-data";
import {
  buildAtomicIdsReferencedByComposites,
  getRuleTypeSummary,
} from "./rule-type-summary";
import {
  ApprovalReportOptions,
  ChangeEntry,
  GitHubIssueRef,
  ReportBucket,
  RuleApprovalRow,
  RuleStatus,
} from "./types";

function stripIssueBody(issues: GitHubIssueRef[]): GitHubIssueRef[] {
  return issues.map(({ number, title, html_url, labelNames }) => ({
    number,
    title,
    html_url,
    labelNames,
  }));
}

export type RuleStatusInputs = {
  deprecated: boolean;
  reviewPrUrl: string | null;
  blockersCount: number;
  completeImplementationCount: number;
  waiApproved: boolean;
  changesCount: number;
};

/** Apply the status precedence defined by the act-board epic. */
export function classifyRuleStatus(inputs: RuleStatusInputs): RuleStatus {
  if (inputs.deprecated) return "Deprecated";
  if (inputs.reviewPrUrl) return "In review";
  if (inputs.blockersCount > 0) return "Blocked by issue";
  if (inputs.completeImplementationCount === 0) {
    return "Awaiting implementation";
  }
  if (inputs.waiApproved) {
    return inputs.changesCount === 0
      ? "Approved, current"
      : "Approved, unpublished changes";
  }
  return "Proposed, reviewable";
}

function reportBucketForStatus(status: RuleStatus): ReportBucket {
  switch (status) {
    case "Approved, current":
      return "approvedUpToDate";
    case "Approved, unpublished changes":
      return "approvedReadyForUpdate";
    case "Proposed, reviewable":
      return "proposedReadyForUpdate";
    default:
      return "notReady";
  }
}

export type ApprovalReportDeps = {
  getRulePages: typeof getRulePages;
  getDefinitionPages: typeof getDefinitionPages;
  loadApprovalByRuleId: typeof loadApprovalByRuleId;
  loadCompleteImplementationsByRuleId: typeof loadCompleteImplementationsByRuleId;
  fetchOpenIssues: typeof fetchOpenIssues;
  getRuleDefinitions: typeof getRuleDefinitions;
  getChangesSinceApproval: typeof getChangesSinceApproval;
  getLatestCommitDateOnPaths: typeof getLatestCommitDateOnPaths;
  pathRelativeToRepo: typeof pathRelativeToRepo;
};

const defaultDeps: ApprovalReportDeps = {
  getRulePages,
  getDefinitionPages,
  loadApprovalByRuleId,
  loadCompleteImplementationsByRuleId,
  fetchOpenIssues,
  getRuleDefinitions,
  getChangesSinceApproval,
  getLatestCommitDateOnPaths,
  pathRelativeToRepo,
};

export async function buildRuleApprovalRows(
  opts: ApprovalReportOptions,
  deps: Partial<ApprovalReportDeps> = {},
): Promise<RuleApprovalRow[]> {
  const d: ApprovalReportDeps = { ...defaultDeps, ...deps };
  const rules = d.getRulePages(opts.rulesDir, opts.testAssetsDir);
  const glossary = d.getDefinitionPages(opts.glossaryDir);
  const approvalById = d.loadApprovalByRuleId(opts.wcagActRulesDir);
  const implById = d.loadCompleteImplementationsByRuleId(opts.wcagActRulesDir);
  const openIssues = await d.fetchOpenIssues(opts.githubOwner, opts.githubRepo);
  const referencedAtomicIds = buildAtomicIdsReferencedByComposites(rules);

  const rows: RuleApprovalRow[] = [];
  for (const rule of rules) {
    const ruleId = rule.frontmatter.id;

    const approval = approvalById[ruleId] ?? { approved: false };
    const implementations = implById[ruleId] ?? [];
    const matched = issuesForRuleId(ruleId, openIssues);
    const issues = stripIssueBody(matched);
    const blockers = stripIssueBody(matched.filter(issueHasBlockerLabel));
    const blockersCount = blockers.length;

    const ruleRel = d.pathRelativeToRepo(
      opts.actRulesRepo,
      path.join(opts.rulesDir, rule.filename),
    );
    const defs = d.getRuleDefinitions(
      { markdownAST: rule.markdownAST },
      glossary,
    );
    const glossaryPaths = defs.map((def) =>
      d.pathRelativeToRepo(
        opts.actRulesRepo,
        path.join(opts.glossaryDir, def.filename),
      ),
    );

    let changes: ChangeEntry[] = [];
    if (approval.approved && approval.approvalIsoDate) {
      changes = d.getChangesSinceApproval(
        opts.actRulesRepo,
        approval.approvalIsoDate,
        ruleRel,
        glossaryPaths,
      );
    }

    const lastUpdatedRaw = d.getLatestCommitDateOnPaths(
      opts.actRulesRepo,
      ruleRel,
      glossaryPaths,
    );
    const lastUpdatedSummary = lastUpdatedRaw ?? "-";
    const ruleTypeSummary = getRuleTypeSummary(rule, referencedAtomicIds);
    const waiApproved = Boolean(approval.approved && approval.approvalIsoDate);
    const lastApprovedSummary = approval.approvalIsoDate ?? "-";
    const commitsBehindSummary = waiApproved ? String(changes.length) : "-";
    const reviewPrUrl = null;
    const status = classifyRuleStatus({
      deprecated: Boolean(rule.frontmatter.deprecated),
      reviewPrUrl,
      blockersCount,
      completeImplementationCount: implementations.length,
      waiApproved,
      changesCount: changes.length,
    });
    const reportBucket = reportBucketForStatus(status);
    const ruleCommitCount = changes.filter(
      (change) => change.touchedRule,
    ).length;
    const definitionCommitCount = changes.filter(
      (change) =>
        !change.touchedRule && change.touchedDefinitionKeys.length > 0,
    ).length;

    rows.push({
      ruleId,
      name: rule.frontmatter.name,
      filename: rule.filename,
      ruleTypeSummary,
      compositeInputs:
        rule.frontmatter.rule_type === "composite"
          ? [...rule.frontmatter.input_rules]
          : undefined,
      waiApproved,
      status,
      reviewPrUrl,
      reportBucket,
      implementations,
      issues,
      blockers,
      changes,
      approvalIsoDate: approval.approvalIsoDate ?? null,
      lastUpdatedIsoDate: lastUpdatedRaw,
      ruleCommitCount,
      definitionCommitCount,
      lastApprovedSummary,
      lastUpdatedSummary,
      commitsBehindSummary,
      blockersCount,
    });
  }

  return rows;
}
