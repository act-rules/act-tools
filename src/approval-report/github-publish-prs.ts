import { Octokit } from "@octokit/rest";

export type OpenPublishPr = {
  number: number;
  html_url: string;
  ruleIds: string[];
};

type PullRequestBatch = Array<{
  number: number;
  html_url: string;
}>;

type PullRequestFileBatch = Array<{
  filename: string;
}>;

const RULE_INDEX_PATH = /^content\/rules\/([a-z0-9]{6})\/index\.md$/i;

/**
 * List open WAI publication PRs and the ACT rule ids whose index files they
 * change. GITHUB_TOKEN is optional because wcag-act-rules is public.
 */
export async function fetchOpenPublishPrs(
  owner: string,
  repo: string,
): Promise<OpenPublishPr[]> {
  const token = process.env.GITHUB_TOKEN;

  try {
    return await listOpenPublishPrs(
      new Octokit({ auth: token || undefined }),
      owner,
      repo,
    );
  } catch (error) {
    if (token && isAccessError(error)) {
      try {
        return await listOpenPublishPrs(
          new Octokit({ auth: undefined }),
          owner,
          repo,
        );
      } catch (fallbackError) {
        throwFetchError(owner, repo, fallbackError);
      }
    }
    throwFetchError(owner, repo, error);
  }
}

async function listOpenPublishPrs(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<OpenPublishPr[]> {
  const pulls: PullRequestBatch = [];
  const responses = octokit.paginate.iterator(octokit.rest.pulls.list, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  });

  for await (const response of responses) {
    pulls.push(...(response.data as PullRequestBatch));
  }

  const publishPrs: OpenPublishPr[] = [];
  for (const pull of pulls.sort((a, b) => a.number - b.number)) {
    const ruleIds = new Set<string>();
    const fileResponses = octokit.paginate.iterator(
      octokit.rest.pulls.listFiles,
      {
        owner,
        repo,
        pull_number: pull.number,
        per_page: 100,
      },
    );

    for await (const response of fileResponses) {
      for (const file of response.data as PullRequestFileBatch) {
        const match = RULE_INDEX_PATH.exec(file.filename);
        if (match) ruleIds.add(match[1].toLowerCase());
      }
    }

    if (ruleIds.size > 0) {
      publishPrs.push({
        number: pull.number,
        html_url: pull.html_url,
        ruleIds: [...ruleIds],
      });
    }
  }

  return publishPrs;
}

/** Map each rule to the lowest-numbered open PR that publishes it. */
export function reviewPrUrlsByRuleId(
  prs: OpenPublishPr[],
): Map<string, string> {
  const urls = new Map<string, string>();
  for (const pr of [...prs].sort((a, b) => a.number - b.number)) {
    for (const ruleId of pr.ruleIds) {
      const normalizedId = ruleId.toLowerCase();
      if (!urls.has(normalizedId)) urls.set(normalizedId, pr.html_url);
    }
  }
  return urls;
}

function githubErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return String(error);

  const githubError = error as {
    message?: string;
    status?: number;
    response?: {
      headers?: {
        "x-ratelimit-remaining"?: string;
        "x-ratelimit-reset"?: string;
      };
    };
  };
  const status = githubError.status ? `HTTP ${githubError.status}: ` : "";
  const rateLimited =
    githubError.status === 403 &&
    githubError.response?.headers?.["x-ratelimit-remaining"] === "0";
  const rateLimitHint = rateLimited
    ? ` GitHub API rate limit was exceeded${
        githubError.response?.headers?.["x-ratelimit-reset"]
          ? ` (reset ${githubError.response.headers["x-ratelimit-reset"]})`
          : ""
      }; set GITHUB_TOKEN to increase the limit.`
    : "";
  return `${status}${githubError.message ?? "Unknown GitHub API error"}.${rateLimitHint}`;
}

function isAccessError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const githubError = error as {
    status?: number;
    response?: { headers?: { "x-ratelimit-remaining"?: string } };
  };
  if (githubError.status === 404) return true;
  if (githubError.status !== 403) return false;
  return githubError.response?.headers?.["x-ratelimit-remaining"] !== "0";
}

function throwFetchError(owner: string, repo: string, error: unknown): never {
  throw new Error(
    `Unable to list open publication PRs for ${owner}/${repo}: ${githubErrorMessage(
      error,
    )}`,
  );
}
