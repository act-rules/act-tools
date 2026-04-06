jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn(),
}));

import { Octokit } from "@octokit/rest";
import {
  BLOCKER_LABEL_NAME,
  fetchOpenIssues,
  issueHasBlockerLabel,
  issuesForRuleId,
} from "../github-issues";
import type { GitHubIssueRef } from "../types";

describe("fetchOpenIssues", () => {
  const listForRepo = jest.fn();

  beforeEach(() => {
    listForRepo.mockReset();
    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      paginate: {
        iterator: jest.fn().mockImplementation(() => {
          async function* gen() {
            yield {
              data: [
                {
                  number: 10,
                  title: "Issue A",
                  html_url: "https://github.com/o/r/issues/10",
                  body: "body",
                  labels: [{ name: "bug" }, "enhancement"],
                },
                {
                  number: 11,
                  title: "A PR disguised",
                  html_url: "https://github.com/o/r/issues/11",
                  pull_request: {},
                },
              ],
            };
            yield {
              data: [
                {
                  number: 12,
                  title: "Second page",
                  html_url: "https://github.com/o/r/issues/12",
                  body: null,
                  labels: ["triage"],
                },
              ],
            };
          }
          return gen();
        }),
      },
      rest: {
        issues: {
          listForRepo,
        },
      },
    }));
  });

  it("maps issues and excludes pull requests", async () => {
    const out = await fetchOpenIssues("act-rules", "act-rules.github.io");
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      number: 10,
      title: "Issue A",
      html_url: "https://github.com/o/r/issues/10",
      body: "body",
      labelNames: ["bug", "enhancement"],
    });
    expect(out[1]).toMatchObject({
      number: 12,
      title: "Second page",
      body: null,
      labelNames: ["triage"],
    });
    const octokitInstance = (Octokit as unknown as jest.Mock).mock.results[0]
      .value;
    expect(octokitInstance.paginate.iterator).toHaveBeenCalledWith(
      listForRepo,
      expect.objectContaining({
        owner: "act-rules",
        repo: "act-rules.github.io",
        state: "open",
        per_page: 100,
      }),
    );
  });
});

describe("issuesForRuleId", () => {
  const issues: GitHubIssueRef[] = [
    {
      number: 1,
      title: "Fix abc-123 rule",
      html_url: "https://github.com/o/r/issues/1",
      body: "details",
    },
    {
      number: 2,
      title: "Unrelated",
      html_url: "https://github.com/o/r/issues/2",
      body: "mention xyz-999 in body",
    },
    {
      number: 3,
      title: "No body issue",
      html_url: "https://github.com/o/r/issues/3",
    },
  ];

  it("matches rule id in title case-insensitively", () => {
    const matched = issuesForRuleId("ABC-123", issues);
    expect(matched.map((i) => i.number)).toEqual([1]);
  });

  it("matches rule id in body case-insensitively", () => {
    const matched = issuesForRuleId("xyz-999", issues);
    expect(matched.map((i) => i.number)).toEqual([2]);
  });

  it("treats missing body as empty string", () => {
    const matched = issuesForRuleId("no-body-issue", [
      { number: 1, title: "x", html_url: "u", body: undefined },
    ]);
    expect(matched).toHaveLength(0);
  });

  it("returns empty when no match", () => {
    expect(issuesForRuleId("not-found", issues)).toEqual([]);
  });
});

describe("issueHasBlockerLabel", () => {
  it(`returns true when ${BLOCKER_LABEL_NAME} is present`, () => {
    expect(
      issueHasBlockerLabel({
        number: 1,
        title: "t",
        html_url: "u",
        labelNames: ["Bug", BLOCKER_LABEL_NAME],
      }),
    ).toBe(true);
  });

  it("returns false when labelNames is missing", () => {
    expect(
      issueHasBlockerLabel({
        number: 1,
        title: "t",
        html_url: "u",
      }),
    ).toBe(false);
  });

  it("returns false when labelNames is empty", () => {
    expect(
      issueHasBlockerLabel({
        number: 1,
        title: "t",
        html_url: "u",
        labelNames: [],
      }),
    ).toBe(false);
  });
});
