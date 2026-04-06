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
} from "./types";

function stripIssueBody(issues: GitHubIssueRef[]): GitHubIssueRef[] {
  return issues.map(({ number, title, html_url }) => ({
    number,
    title,
    html_url,
  }));
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
    if (rule.frontmatter.deprecated) continue;

    const approval = approvalById[ruleId] ?? { approved: false };
    const implementations = implById[ruleId] ?? [];
    const matched = issuesForRuleId(ruleId, openIssues);
    const blockersCount = matched.filter(issueHasBlockerLabel).length;
    const issues = stripIssueBody(matched);

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

    const hasCompleteImpl = implementations.length > 0;
    const hasBlockers = blockersCount > 0;

    let reportBucket: ReportBucket;
    if (!hasCompleteImpl || hasBlockers) {
      reportBucket = "notReady";
    } else if (waiApproved) {
      reportBucket =
        changes.length > 0 ? "approvedReadyForUpdate" : "approvedUpToDate";
    } else {
      reportBucket = "proposedReadyForUpdate";
    }

    rows.push({
      ruleId,
      name: rule.frontmatter.name,
      ruleTypeSummary,
      compositeInputs:
        rule.frontmatter.rule_type === "composite"
          ? [...rule.frontmatter.input_rules]
          : undefined,
      waiApproved,
      reportBucket,
      implementations,
      issues,
      changes,
      approvalIsoDate: approval.approvalIsoDate,
      lastApprovedSummary,
      lastUpdatedSummary,
      commitsBehindSummary,
      blockersCount,
    });
  }

  return rows;
}
