import { Octokit } from "@octokit/rest";

import { GitHubIssueRef } from "./types";

type IssueBatch = Array<{
  number: number;
  title: string;
  html_url: string;
  body?: string | null;
  labels?: Array<{ name?: string } | string>;
  pull_request?: unknown;
}>;

/** GitHub label name that counts as a blocker for the summary table */
export const BLOCKER_LABEL_NAME = "Blocker";

export async function fetchOpenIssues(
  owner: string,
  repo: string,
): Promise<GitHubIssueRef[]> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const ghResponses = octokit.paginate.iterator(
    octokit.rest.issues.listForRepo,
    {
      owner,
      repo,
      state: "open",
      per_page: 100,
    },
  );

  const issues: GitHubIssueRef[] = [];
  for await (const response of ghResponses) {
    const batch = response.data as IssueBatch;
    for (const issue of batch) {
      if (issue.pull_request) continue;
      issues.push({
        number: issue.number,
        title: issue.title,
        html_url: issue.html_url,
        body: issue.body,
        labelNames: labelNamesFromIssue(issue),
      });
    }
  }

  return issues;
}

function labelNamesFromIssue(issue: {
  labels?: Array<{ name?: string } | string>;
}): string[] {
  const labels = issue.labels ?? [];
  return labels
    .map((l) => (typeof l === "string" ? l : (l.name ?? "")))
    .filter(Boolean);
}

export function issuesForRuleId(
  ruleId: string,
  issues: GitHubIssueRef[],
): GitHubIssueRef[] {
  const id = ruleId.toLowerCase();
  return issues.filter((i) => {
    const t = i.title.toLowerCase();
    const b = (i.body ?? "").toLowerCase();
    return t.includes(id) || b.includes(id);
  });
}

export function issueHasBlockerLabel(issue: GitHubIssueRef): boolean {
  return (issue.labelNames ?? []).includes(BLOCKER_LABEL_NAME);
}
