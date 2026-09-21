jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn(),
}));

import { Octokit } from "@octokit/rest";
import {
  fetchOpenPublishPrs,
  reviewPrUrlsByRuleId,
} from "../github-publish-prs";

describe("fetchOpenPublishPrs", () => {
  const list = jest.fn();
  const listFiles = jest.fn();
  const iterator = jest.fn();
  const originalGithubToken = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GITHUB_TOKEN;
    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      paginate: { iterator },
      rest: { pulls: { list, listFiles } },
    }));
  });

  afterAll(() => {
    if (originalGithubToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalGithubToken;
    }
  });

  function mockGitHub(
    pulls: Array<{ number: number; html_url: string }>,
    filesByPull: Record<number, string[]>,
  ): void {
    iterator.mockImplementation(
      (
        endpoint: unknown,
        options: { pull_number?: number },
      ): AsyncGenerator<{ data: unknown[] }> => {
        async function* responses() {
          if (endpoint === list) {
            yield { data: pulls };
          } else {
            yield {
              data: (filesByPull[options.pull_number ?? -1] ?? []).map(
                (filename) => ({ filename }),
              ),
            };
          }
        }
        return responses();
      },
    );
  }

  it("matches only content/rules/{sixCharId}/index.md paths", async () => {
    mockGitHub([{ number: 12, html_url: "https://example.test/pull/12" }], {
      12: [
        "content/rules/674b10/index.md",
        "content/rules/674b10/example.md",
        "content/rules/not-six/index.md",
        "content/glossary/example.md",
      ],
    });

    await expect(fetchOpenPublishPrs("w3c", "wcag-act-rules")).resolves.toEqual(
      [
        {
          number: 12,
          html_url: "https://example.test/pull/12",
          ruleIds: ["674b10"],
        },
      ],
    );
    expect(iterator).toHaveBeenCalledWith(
      list,
      expect.objectContaining({
        owner: "w3c",
        repo: "wcag-act-rules",
        state: "open",
      }),
    );
    expect(Octokit).toHaveBeenCalledWith({ auth: undefined });
  });

  it("lists publication PRs with state open", async () => {
    mockGitHub([], {});

    await fetchOpenPublishPrs("w3c", "wcag-act-rules");

    expect(iterator).toHaveBeenCalledWith(
      list,
      expect.objectContaining({
        owner: "w3c",
        repo: "wcag-act-rules",
        state: "open",
      }),
    );
  });

  it("returns no match when no open PR is listed", async () => {
    mockGitHub([], {});

    await expect(fetchOpenPublishPrs("w3c", "wcag-act-rules")).resolves.toEqual(
      [],
    );
    expect(listFiles).not.toHaveBeenCalled();
  });

  it("maps every rule index changed by one PR", async () => {
    mockGitHub([{ number: 20, html_url: "https://example.test/pull/20" }], {
      20: ["content/rules/674b10/index.md", "content/rules/a1b2c3/index.md"],
    });

    const prs = await fetchOpenPublishPrs("w3c", "wcag-act-rules");
    expect(prs[0].ruleIds).toEqual(["674b10", "a1b2c3"]);
  });

  it("uses GITHUB_TOKEN when one is available", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    mockGitHub([], {});

    await fetchOpenPublishPrs("w3c", "wcag-act-rules");

    expect(Octokit).toHaveBeenCalledWith({ auth: "test-token" });
  });

  it.each([
    { status: 404, message: "Not Found" },
    { status: 403, message: "Forbidden" },
  ])(
    "retries without auth on HTTP $status when an installation token cannot access W3C",
    async ({ status, message }) => {
      process.env.GITHUB_TOKEN = "installation-token";
      iterator
        .mockImplementationOnce(() => {
          async function* denied() {
            throw { status, message };
            yield { data: [] };
          }
          return denied();
        })
        .mockImplementationOnce(() => {
          async function* publicResponse() {
            yield { data: [] };
          }
          return publicResponse();
        });

      await expect(
        fetchOpenPublishPrs("w3c", "wcag-act-rules"),
      ).resolves.toEqual([]);
      expect(Octokit).toHaveBeenNthCalledWith(1, {
        auth: "installation-token",
      });
      expect(Octokit).toHaveBeenNthCalledWith(2, { auth: undefined });
    },
  );

  it("reports repository and rate-limit failures clearly", async () => {
    iterator.mockImplementation(() => {
      async function* responses() {
        throw {
          status: 403,
          message: "API rate limit exceeded",
          response: {
            headers: {
              "x-ratelimit-remaining": "0",
              "x-ratelimit-reset": "123",
            },
          },
        };
        yield { data: [] };
      }
      return responses();
    });

    await expect(fetchOpenPublishPrs("w3c", "wcag-act-rules")).rejects.toThrow(
      /Unable to list open publication PRs for w3c\/wcag-act-rules.*rate limit.*GITHUB_TOKEN/i,
    );
  });

  it("does not retry unauthenticated when rate-limited with GITHUB_TOKEN", async () => {
    process.env.GITHUB_TOKEN = "installation-token";
    iterator.mockImplementation(() => {
      async function* responses() {
        throw {
          status: 403,
          message: "API rate limit exceeded",
          response: {
            headers: {
              "x-ratelimit-remaining": "0",
              "x-ratelimit-reset": "123",
            },
          },
        };
        yield { data: [] };
      }
      return responses();
    });

    await expect(fetchOpenPublishPrs("w3c", "wcag-act-rules")).rejects.toThrow(
      /Unable to list open publication PRs for w3c\/wcag-act-rules.*rate limit.*GITHUB_TOKEN/i,
    );
    expect(Octokit).toHaveBeenCalledTimes(1);
    expect(Octokit).toHaveBeenCalledWith({ auth: "installation-token" });
    expect(Octokit).not.toHaveBeenCalledWith({ auth: undefined });
  });
});

describe("reviewPrUrlsByRuleId", () => {
  it("selects the lowest PR number for a rule deterministically", () => {
    const urls = reviewPrUrlsByRuleId([
      {
        number: 99,
        html_url: "https://example.test/pull/99",
        ruleIds: ["674b10"],
      },
      {
        number: 7,
        html_url: "https://example.test/pull/7",
        ruleIds: ["674b10"],
      },
    ]);

    expect(urls.get("674b10")).toBe("https://example.test/pull/7");
  });
});
