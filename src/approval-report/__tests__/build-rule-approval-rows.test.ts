jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn(),
}));

import type { Parent } from "unist";
import {
  buildRuleApprovalRows,
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
  it("skips deprecated rules", async () => {
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
    expect(rows).toHaveLength(1);
    expect(rows[0].ruleId).toBe("keep");
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
      },
    ]);
  });

  it("buckets notReady without complete implementation", async () => {
    const rows = await buildRuleApprovalRows(
      baseOpts,
      oneAtomic("n", { loadCompleteImplementationsByRuleId: () => ({}) }),
    );
    expect(rows[0].reportBucket).toBe("notReady");
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
    expect(rows[0].blockersCount).toBe(1);
  });

  it("buckets proposedReadyForUpdate when not WAI-approved but has implementation", async () => {
    const rows = await buildRuleApprovalRows(baseOpts, oneAtomic("p"));
    expect(rows[0].reportBucket).toBe("proposedReadyForUpdate");
    expect(rows[0].waiApproved).toBe(false);
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
    expect(rows[0].commitsBehindSummary).toBe("1");
    expect(rows[0].changes).toEqual([change]);
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
