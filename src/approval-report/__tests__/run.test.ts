jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn(),
}));

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { runApprovalReport } from "../run";
import type { ApprovalReportOptions } from "../types";

jest.mock("../build-rule-approval-rows", () => {
  const actual = jest.requireActual("../build-rule-approval-rows") as {
    buildRuleApprovalRows: typeof import("../build-rule-approval-rows").buildRuleApprovalRows;
  };
  return {
    ...actual,
    buildRuleApprovalRows: jest.fn(actual.buildRuleApprovalRows),
  };
});

import { buildRuleApprovalRows } from "../build-rule-approval-rows";

const buildRowsMock = buildRuleApprovalRows as jest.MockedFunction<
  typeof buildRuleApprovalRows
>;

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

describe("runApprovalReport", () => {
  let tmp: string;
  let outFile: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "act-run-"));
    outFile = path.join(tmp, "nested", "out.md");
    buildRowsMock.mockResolvedValue([
      {
        ruleId: "only",
        name: "Only rule",
        ruleTypeSummary: "atomic",
        waiApproved: true,
        reportBucket: "approvedUpToDate",
        implementations: ["axe"],
        issues: [],
        changes: [],
        approvalIsoDate: "2023-01-01",
        lastApprovedSummary: "2023-01-01",
        lastUpdatedSummary: "2024-01-01",
        commitsBehindSummary: "0",
        blockersCount: 0,
      },
    ]);
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("writes markdown from rows and logs path", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
    await runApprovalReport({ ...baseOpts, outFile });
    const written = fs.readFileSync(outFile, "utf8");
    expect(written).toContain("# ACT rules ready for approval");
    expect(written).toContain("[only](#only)");
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining(path.resolve(outFile)),
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("(1 rules)"));
    log.mockRestore();
  });
});
