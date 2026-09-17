jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn(),
}));

import type { Parent } from "unist";
import {
  buildRuleApprovalRows,
  classifyRuleStatus,
  type ApprovalReportDeps,
} from "../build-rule-approval-rows";
import type { ApprovalReportOptions } from "../types";
import type { RulePage } from "../../types";

const emptyMdAst = { type: "root", children: [] } as Parent;

function atomicPage(
  id: string,
  extra: Partial<RulePage["frontmatter"]> = {},
): RulePage {
  return {
    body: "",
    markdownAST: emptyMdAst,
    filename: `${id}.md`,
    assets: {},
    frontmatter: {
      id,
      name: `Name ${id}`,
      rule_type: "atomic",
      description: "",
      input_aspects: [],
      ...extra,
    } as RulePage["frontmatter"],
  };
}

const baseOpts: ApprovalReportOptions = {
  rulesDir: "/rules",
  glossaryDir: "/glossary",
  testAssetsDir: "/assets",
  actRulesRepo: "/repo",
  wcagActRulesDir: "/wcag",
  outFile: "/out/report.md",
  githubOwner: "o",
  githubRepo: "r",
};

function mockDeps(
  overrides: Partial<ApprovalReportDeps>,
): Partial<ApprovalReportDeps> {
  return {
    getDefinitionPages: () => [],
    loadApprovalByRuleId: () => ({}),
    fetchOpenIssues: async () => [],
    getRuleDefinitions: () => [],
    getChangesSinceApproval: () => [],
    getLatestCommitDateOnPaths: () => "2024-01-01",
    ...overrides,
  };
}

/** One non-deprecated atomic rule with a default complete implementation for `ruleId`. */
function oneAtomic(
  ruleId: string,
  extra: Partial<ApprovalReportDeps> = {},
): Partial<ApprovalReportDeps> {
  return mockDeps({
    getRulePages: () => [atomicPage(ruleId)],
    pathRelativeToRepo: () => `_rules/${ruleId}.md`,
    loadCompleteImplementationsByRuleId: () => ({ [ruleId]: ["axe"] }),
    ...extra,
  });
}

describe("buildRuleApprovalRows", () => {
  it("includes deprecated rules with highest-priority status", async () => {
    const rows = await buildRuleApprovalRows(
      baseOpts,
      mockDeps({
        getRulePages: () => [
          atomicPage("gone", { deprecated: "true" }),
          atomicPage("keep"),
        ],
        loadCompleteImplementationsByRuleId: () => ({ keep: ["axe"] }),
        pathRelativeToRepo: () => "_rules/keep.md",
      }),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      ruleId: "gone",
      status: "Deprecated",
    });
  });

  it("strips issue body from row issues", async () => {
    const rows = await buildRuleApprovalRows(
      baseOpts,
      oneAtomic("rid", {
        fetchOpenIssues: async () => [
          {
            number: 7,
            title: "rid bug",
            html_url: "https://github.com/o/r/issues/7",
            body: "do not leak",
            labelNames: [],
          },
        ],
        getLatestCommitDateOnPaths: () => null,
      }),
    );
    expect(rows[0].issues).toEqual([
      {
        number: 7,
        title: "rid bug",
        html_url: "https://github.com/o/r/issues/7",
        labelNames: [],
      },
    ]);
  });

  it("buckets notReady without complete implementation", async () => {
    const rows = await buildRuleApprovalRows(
      baseOpts,
      oneAtomic("n", { loadCompleteImplementationsByRuleId: () => ({}) }),
    );
    expect(rows[0].reportBucket).toBe("notReady");
    expect(rows[0].status).toBe("No complete implementation");
  });

  it("buckets notReady when a matched issue has Blocker label", async () => {
    const rows = await buildRuleApprovalRows(
      baseOpts,
      oneAtomic("b", {
        fetchOpenIssues: async () => [
          {
            number: 1,
            title: "b",
            html_url: "u",
            body: "",
            labelNames: ["Blocker"],
          },
        ],
      }),
    );
    expect(rows[0].reportBucket).toBe("notReady");
    expect(rows[0].status).toBe("Blocked");
    expect(rows[0].blockersCount).toBe(1);
    expect(rows[0].blockers).toEqual(rows[0].issues);
  });

  it("buckets proposedReadyForUpdate when not WAI-approved but has implementation", async () => {
    const rows = await buildRuleApprovalRows(baseOpts, oneAtomic("p"));
    expect(rows[0].reportBucket).toBe("proposedReadyForUpdate");
    expect(rows[0].status).toBe("Proposed, reviewable");
    expect(rows[0].waiApproved).toBe(false);
    expect(rows[0].reviewPrUrl).toBeNull();
  });

  it("buckets approvedUpToDate when approved with no commits after approval", async () => {
    const rows = await buildRuleApprovalRows(
      baseOpts,
      oneAtomic("a", {
        loadApprovalByRuleId: () => ({
          a: { approved: true, approvalIsoDate: "2023-01-01" },
        }),
      }),
    );
    expect(rows[0].reportBucket).toBe("approvedUpToDate");
    expect(rows[0].status).toBe("Approved, current");
    expect(rows[0].commitsBehindSummary).toBe("0");
  });

  it("buckets approvedReadyForUpdate when there are changes after approval", async () => {
    const change = {
      hash: "e".repeat(40),
      subject: "edit",
      dateIso: "2024-01-01T00:00:00Z",
      touchedRule: true,
      touchedDefinitionKeys: [] as string[],
    };
    const rows = await buildRuleApprovalRows(
      baseOpts,
      oneAtomic("u", {
        loadApprovalByRuleId: () => ({
          u: { approved: true, approvalIsoDate: "2023-01-01" },
        }),
        getChangesSinceApproval: () => [change],
        getLatestCommitDateOnPaths: () => "2024-06-01",
      }),
    );
    expect(rows[0].reportBucket).toBe("approvedReadyForUpdate");
    expect(rows[0].status).toBe("Approved, unpublished changes");
    expect(rows[0].commitsBehindSummary).toBe("1");
    expect(rows[0].changes).toEqual([change]);
  });

  it("splits rule commits from definition-only commits", async () => {
    const changes = [
      {
        hash: "a".repeat(40),
        subject: "rule and definition",
        dateIso: "2024-03-01T00:00:00Z",
        touchedRule: true,
        touchedDefinitionKeys: ["foo"],
      },
      {
        hash: "b".repeat(40),
        subject: "definition only",
        dateIso: "2024-02-01T00:00:00Z",
        touchedRule: false,
        touchedDefinitionKeys: ["foo"],
      },
      {
        hash: "c".repeat(40),
        subject: "rule only",
        dateIso: "2024-01-01T00:00:00Z",
        touchedRule: true,
        touchedDefinitionKeys: [],
      },
    ];
    const rows = await buildRuleApprovalRows(
      baseOpts,
      oneAtomic("split", {
        loadApprovalByRuleId: () => ({
          split: { approved: true, approvalIsoDate: "2023-01-01" },
        }),
        getChangesSinceApproval: () => changes,
      }),
    );

    expect(rows[0]).toMatchObject({
      ruleCommitCount: 2,
      definitionCommitCount: 1,
    });
  });

  it("does not call getChangesSinceApproval when rule is not WAI-approved", async () => {
    const getChangesSinceApproval = jest.fn(() => []);
    await buildRuleApprovalRows(
      baseOpts,
      oneAtomic("x", { getChangesSinceApproval }),
    );
    expect(getChangesSinceApproval).not.toHaveBeenCalled();
  });

  it("sets compositeInputs for composite rules", async () => {
    const composite: RulePage = {
      body: "",
      markdownAST: emptyMdAst,
      filename: "comp.md",
      assets: {},
      frontmatter: {
        id: "comp",
        name: "Composite",
        rule_type: "composite",
        description: "",
        input_rules: ["in1", "in2"],
      } as RulePage["frontmatter"],
    };
    const rows = await buildRuleApprovalRows(
      baseOpts,
      mockDeps({
        getRulePages: () => [composite],
        loadCompleteImplementationsByRuleId: () => ({ comp: ["axe"] }),
        pathRelativeToRepo: () => "_rules/comp.md",
      }),
    );
    expect(rows[0].compositeInputs).toEqual(["in1", "in2"]);
  });
});

describe("classifyRuleStatus", () => {
  const reviewable = {
    deprecated: false,
    reviewPrUrl: null,
    blockersCount: 0,
    completeImplementationCount: 1,
    waiApproved: false,
    changesCount: 0,
  };

  it.each([
    [
      {
        ...reviewable,
        deprecated: true,
        reviewPrUrl: "https://example.test/pr/1",
        blockersCount: 1,
        completeImplementationCount: 0,
      },
      "Deprecated",
    ],
    [
      {
        ...reviewable,
        reviewPrUrl: "https://example.test/pr/1",
        blockersCount: 1,
        completeImplementationCount: 0,
      },
      "In review",
    ],
    [
      {
        ...reviewable,
        blockersCount: 1,
        completeImplementationCount: 0,
        waiApproved: true,
      },
      "Blocked",
    ],
    [
      {
        ...reviewable,
        completeImplementationCount: 0,
        waiApproved: true,
      },
      "No complete implementation",
    ],
    [{ ...reviewable, waiApproved: true }, "Approved, current"],
    [
      { ...reviewable, waiApproved: true, changesCount: 1 },
      "Approved, unpublished changes",
    ],
    [reviewable, "Proposed, reviewable"],
  ])("applies status inputs in precedence order", (inputs, expected) => {
    expect(classifyRuleStatus(inputs)).toBe(expected);
  });

  it("does not let a non-blocker issue affect status", async () => {
    const rows = await buildRuleApprovalRows(
      baseOpts,
      oneAtomic("open-issue", {
        fetchOpenIssues: async () => [
          {
            number: 2,
            title: "open-issue discussion",
            html_url: "https://example.test/issues/2",
            labelNames: ["enhancement"],
          },
        ],
      }),
    );

    expect(rows[0].status).toBe("Proposed, reviewable");
    expect(rows[0].issues).toHaveLength(1);
    expect(rows[0].blockers).toHaveLength(0);
  });
});
