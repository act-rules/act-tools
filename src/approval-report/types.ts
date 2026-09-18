export type ApprovalRecord = {
  approved: boolean;
  /** ISO date (YYYY-MM-DD) of the approved `index.md` snapshot */
  approvalIsoDate?: string;
};

export type ChangeEntry = {
  hash: string;
  subject: string;
  dateIso: string;
  touchedRule: boolean;
  /** Glossary keys whose files were touched in this commit */
  touchedDefinitionKeys: string[];
};

export type GitHubIssueRef = {
  number: number;
  title: string;
  html_url: string;
  /** Present when fetched from the API; used only for matching */
  body?: string | null;
  /** Present on fetched issues; omitted on rows after stripIssueBody */
  labelNames?: string[];
};

/** Rule shape in the summary: composite, standalone atomic, or atomic used as composite input */
export type RuleTypeSummary = "atomic" | "composed" | "composite";

export type ReportBucket =
  | "approvedReadyForUpdate"
  | "proposedReadyForUpdate"
  | "approvedUpToDate"
  | "notReady";

/** Values intentionally match the act-board Project Status options. */
export type RuleStatus =
  | "Deprecated"
  | "In review"
  | "Blocked by issue"
  | "Awaiting implementation"
  | "Approved, current"
  | "Approved, unpublished changes"
  | "Proposed, reviewable";

export type RuleApprovalRow = {
  ruleId: string;
  name: string;
  /** Rule file name within `_rules`, including the `-ruleId.md` suffix. */
  filename: string;
  ruleTypeSummary: RuleTypeSummary;
  /** Set for composite rules only: atomic ids from `input_rules` (for table ordering). */
  compositeInputs?: string[];
  /** Rule has an approved WAI snapshot (`index.md` in rule-versions) */
  waiApproved: boolean;
  status: RuleStatus;
  /** Populated by the PR lookup added in issue #66. */
  reviewPrUrl: string | null;
  reportBucket: ReportBucket;
  implementations: string[];
  issues: GitHubIssueRef[];
  blockers: GitHubIssueRef[];
  changes: ChangeEntry[];
  approvalIsoDate: string | null;
  lastUpdatedIsoDate: string | null;
  /** Post-approval commits that touched the rule file (including rule + glossary commits). */
  ruleCommitCount: number;
  /** Post-approval commits that touched glossary paths, but not the rule file. */
  definitionCommitCount: number;
  /** Summary table: YYYY-MM-DD when rule has an approved snapshot, else "-" */
  lastApprovedSummary: string;
  /** Summary table: YYYY-MM-DD of latest commit touching rule + transitive glossary, else "-" */
  lastUpdatedSummary: string;
  /** Unique commits after approval on rule + glossary paths; "-" if not approved */
  commitsBehindSummary: string;
  /** Open issues for this rule that have the GitHub "Blocker" label */
  blockersCount: number;
};

export type ApprovalReportOptions = {
  rulesDir: string;
  glossaryDir: string;
  testAssetsDir: string;
  actRulesRepo: string;
  wcagActRulesDir: string;
  outFile: string;
  /** Optional legacy four-bucket report for debugging. */
  markdownFile?: string;
  githubOwner: string;
  githubRepo: string;
};
