import { generateApprovalReportMarkdown } from "../generate-report";
import type { ChangeEntry, ReportBucket, RuleApprovalRow } from "../types";

const github = { owner: "act-rules", repo: "act-rules.github.io" };

function baseRow(
  ruleId: string,
  overrides: Partial<RuleApprovalRow> = {},
): RuleApprovalRow {
  return {
    ruleId,
    name: ruleId,
    ruleTypeSummary: "atomic",
    waiApproved: false,
    reportBucket: "approvedUpToDate",
    implementations: ["axe"],
    issues: [],
    changes: [],
    lastApprovedSummary: "2023-01-01",
    lastUpdatedSummary: "2024-01-01",
    commitsBehindSummary: "0",
    blockersCount: 0,
    ...overrides,
  };
}

function sectionAfterHeading(md: string, headingLine: string): string {
  const idx = md.indexOf(headingLine);
  if (idx < 0) return "";
  const rest = md.slice(idx + headingLine.length);
  const next = rest.search(/\n## /);
  return next < 0 ? rest : rest.slice(0, next);
}

describe("generateApprovalReportMarkdown", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("includes fixed generated date from system time", () => {
    const md = generateApprovalReportMarkdown(
      [baseRow("r1", { reportBucket: "approvedUpToDate" })],
      github,
    );
    expect(md).toContain("Generated: 2024-06-15");
  });

  it("renders _None._ for empty bucket tables", () => {
    const md = generateApprovalReportMarkdown([], github);
    expect(md).toContain("## Approved ready for update (0)");
    expect(md).toContain("## Proposed ready for update (0)");
    expect(md).toContain("## Approved, up to date (0)");
    expect(md).toContain("## Not ready (0)");
    const noneCount = (md.match(/_None\._/g) ?? []).length;
    expect(noneCount).toBeGreaterThanOrEqual(4);
  });

  it("places each rule only in the matching bucket section", () => {
    const rows: RuleApprovalRow[] = [
      baseRow("approved-upd", {
        reportBucket: "approvedReadyForUpdate",
        waiApproved: true,
        commitsBehindSummary: "2",
        changes: [
          {
            hash: "a".repeat(40),
            subject: "s",
            dateIso: "",
            touchedRule: true,
            touchedDefinitionKeys: [],
          },
        ],
      }),
      baseRow("proposed-upd", { reportBucket: "proposedReadyForUpdate" }),
      baseRow("approved-ok", {
        reportBucket: "approvedUpToDate",
        waiApproved: true,
        commitsBehindSummary: "0",
        changes: [],
      }),
      baseRow("not-ready", {
        reportBucket: "notReady",
        implementations: [],
        waiApproved: false,
        commitsBehindSummary: "-",
        lastApprovedSummary: "-",
      }),
    ];
    const md = generateApprovalReportMarkdown(rows, github);
    expect(
      sectionAfterHeading(md, "## Approved ready for update (1)"),
    ).toContain("[approved-upd](#approved-upd)");
    expect(
      sectionAfterHeading(md, "## Proposed ready for update (1)"),
    ).toContain("[proposed-upd](#proposed-upd)");
    expect(sectionAfterHeading(md, "## Approved, up to date (1)")).toContain(
      "[approved-ok](#approved-ok)",
    );
    expect(sectionAfterHeading(md, "## Not ready (1)")).toContain(
      "[not-ready](#not-ready)",
    );
  });

  it("includes WAI and GitHub search links with rule id", () => {
    const md = generateApprovalReportMarkdown(
      [
        baseRow("my-rule-id", {
          reportBucket: "proposedReadyForUpdate",
          implementations: ["t"],
          issues: [],
        }),
      ],
      github,
    );
    expect(md).toContain(
      "https://www.w3.org/WAI/standards-guidelines/act/rules/my-rule-id/proposed/#implementations",
    );
    expect(md).toContain("my-rule-id+");
  });

  it("escapes pipe and newlines in table name cells", () => {
    const md = generateApprovalReportMarkdown(
      [
        baseRow("rid", {
          name: "a|b\nc",
          reportBucket: "proposedReadyForUpdate",
        }),
      ],
      github,
    );
    expect(md).toContain("a\\|b c");
  });

  it("interleaves composite groups with other rules using global sort keys", () => {
    const inputId = "composed-input";
    const rows: RuleApprovalRow[] = [
      baseRow("composite-low", {
        ruleTypeSummary: "composite",
        compositeInputs: [inputId],
        reportBucket: "approvedReadyForUpdate",
        waiApproved: true,
        commitsBehindSummary: "1",
        changes: [
          {
            hash: "1".repeat(40),
            subject: "s",
            dateIso: "",
            touchedRule: true,
            touchedDefinitionKeys: [],
          },
        ],
      }),
      baseRow(inputId, {
        ruleTypeSummary: "composed",
        reportBucket: "approvedReadyForUpdate",
        waiApproved: true,
        commitsBehindSummary: "1",
        changes: [
          {
            hash: "2".repeat(40),
            subject: "s",
            dateIso: "",
            touchedRule: true,
            touchedDefinitionKeys: [],
          },
        ],
      }),
      baseRow("atomic-high", {
        reportBucket: "approvedReadyForUpdate",
        waiApproved: true,
        commitsBehindSummary: "5",
        changes: Array(5)
          .fill(null)
          .map((_, i) => ({
            hash: String(i).padStart(40, "h"),
            subject: "s",
            dateIso: "",
            touchedRule: true,
            touchedDefinitionKeys: [],
          })),
      }),
    ];
    const md = generateApprovalReportMarkdown(rows, github);
    const sec = sectionAfterHeading(md, "## Approved ready for update (3)");
    const iHigh = sec.indexOf("[atomic-high](#atomic-high)");
    const iComp = sec.indexOf("[composite-low](#composite-low)");
    const iInput = sec.indexOf(`[${inputId}](#${inputId})`);
    expect(iHigh).not.toEqual(-1);
    expect(iComp).not.toEqual(-1);
    expect(iInput).not.toEqual(-1);
    expect(iHigh).toBeLessThan(iComp);
    expect(iComp).toBeLessThan(iInput);
  });

  it("sorts approved-needs-update by commits behind descending", () => {
    const rows: RuleApprovalRow[] = [
      baseRow("low", {
        reportBucket: "approvedReadyForUpdate",
        waiApproved: true,
        commitsBehindSummary: "1",
        changes: [
          {
            hash: "1".repeat(40),
            subject: "s",
            dateIso: "",
            touchedRule: true,
            touchedDefinitionKeys: [],
          },
        ],
      }),
      baseRow("high", {
        reportBucket: "approvedReadyForUpdate",
        waiApproved: true,
        commitsBehindSummary: "5",
        changes: Array(5)
          .fill(null)
          .map((_, i) => ({
            hash: String(i).padStart(40, "h"),
            subject: "s",
            dateIso: "",
            touchedRule: true,
            touchedDefinitionKeys: [],
          })),
      }),
    ];
    const md = generateApprovalReportMarkdown(rows, github);
    const sec = sectionAfterHeading(md, "## Approved ready for update (2)");
    const iHigh = sec.indexOf("[high](#high)");
    const iLow = sec.indexOf("[low](#low)");
    expect(iHigh).toBeGreaterThan(-1);
    expect(iLow).toBeGreaterThan(-1);
    expect(iHigh).toBeLessThan(iLow);
  });

  it("groups composed rule under lexicographically greatest composite parent", () => {
    const shared = "atomic-shared";
    const rows: RuleApprovalRow[] = [
      baseRow("c-a", {
        ruleTypeSummary: "composite",
        compositeInputs: [shared],
        reportBucket: "notReady",
        implementations: [],
        commitsBehindSummary: "-",
        lastApprovedSummary: "-",
        blockersCount: 0,
        issues: [],
      }),
      baseRow("c-b", {
        ruleTypeSummary: "composite",
        compositeInputs: [shared],
        reportBucket: "notReady",
        implementations: [],
        commitsBehindSummary: "-",
        lastApprovedSummary: "-",
        blockersCount: 0,
        issues: [],
      }),
      baseRow(shared, {
        ruleTypeSummary: "composed",
        reportBucket: "notReady",
        implementations: [],
        commitsBehindSummary: "-",
        lastApprovedSummary: "-",
        blockersCount: 0,
        issues: [],
      }),
    ];
    const md = generateApprovalReportMarkdown(rows, github);
    const sec = sectionAfterHeading(md, "## Not ready (3)");
    const iCA = sec.indexOf("[c-a](#c-a)");
    const iCB = sec.indexOf("[c-b](#c-b)");
    const iShared = sec.indexOf(`[${shared}](#${shared})`);
    expect(iCA).toBeLessThan(iCB);
    expect(iCB).toBeLessThan(iShared);
  });

  it("shows no-commits line in approved details when changes array is empty", () => {
    const md = generateApprovalReportMarkdown(
      [
        baseRow("stale", {
          reportBucket: "approvedReadyForUpdate",
          waiApproved: true,
          approvalIsoDate: "2023-01-01",
          commitsBehindSummary: "0",
          changes: [],
        }),
      ],
      github,
    );
    expect(md).toContain("_No commits after approval date._");
  });

  it("omits detail sections when update buckets are empty", () => {
    const md = generateApprovalReportMarkdown(
      [
        baseRow("x", {
          reportBucket: "approvedUpToDate",
          waiApproved: true,
          commitsBehindSummary: "0",
          changes: [],
        }),
      ],
      github,
    );
    expect(md).not.toContain("Approved ready for update — details");
    expect(md).not.toContain("Proposed ready for update — details");
    expect(md).not.toContain("Not ready — details");
  });

  it("includes approved and proposed detail sections when buckets are non-empty", () => {
    const change: ChangeEntry = {
      hash: "ab".repeat(20),
      subject: 'Fix & <bad> "quotes"',
      dateIso: "2024-01-01T00:00:00Z",
      touchedRule: true,
      touchedDefinitionKeys: ["def-a", "def-b"],
    };
    const rows: RuleApprovalRow[] = [
      baseRow("appr", {
        reportBucket: "approvedReadyForUpdate",
        waiApproved: true,
        approvalIsoDate: "2023-06-01",
        commitsBehindSummary: "1",
        changes: [change],
        issues: [
          {
            number: 99,
            title: "Issue <tag> & amp",
            html_url: "https://github.com/a/b/issues/99?x=1&y=2",
          },
        ],
      }),
      baseRow("prop", {
        reportBucket: "proposedReadyForUpdate",
        waiApproved: false,
        commitsBehindSummary: "-",
        lastApprovedSummary: "-",
        changes: [],
        issues: [],
      }),
    ];
    const md = generateApprovalReportMarkdown(rows, github);
    expect(md).toContain("## Approved ready for update — details");
    expect(md).toContain("## Proposed ready for update — details");
    expect(md).toContain('<h3 id="appr">');
    expect(md).toContain("Fix &amp; &lt;bad&gt; &quot;quotes&quot;");
    expect(md).toContain("definition(s): def-a, def-b");
    expect(md).toContain("&amp;");
    expect(md).toContain("#### Changes since approval");
    expect(md).toContain("abababa"); // 7-char hash prefix in detail output
    const propDetail =
      md.split("## Proposed ready for update — details")[1] ?? "";
    expect(propDetail).toContain('<h3 id="prop">');
    expect(propDetail).not.toContain("#### Changes since approval");
  });

  it("includes not ready detail section when not ready bucket is non-empty", () => {
    const md = generateApprovalReportMarkdown(
      [
        baseRow("nr-prop", {
          reportBucket: "notReady",
          implementations: [],
          waiApproved: false,
          commitsBehindSummary: "2",
          lastApprovedSummary: "-",
          blockersCount: 0,
          issues: [
            {
              number: 12,
              title: "Need impl",
              html_url: "https://github.com/a/b/issues/12",
            },
          ],
        }),
        baseRow("nr-appr", {
          reportBucket: "notReady",
          implementations: ["axe"],
          waiApproved: true,
          approvalIsoDate: "2023-06-01",
          lastApprovedSummary: "2023-06-01",
          commitsBehindSummary: "2",
          blockersCount: 1,
          changes: [
            {
              hash: "e".repeat(40),
              subject: "touch rule",
              dateIso: "",
              touchedRule: true,
              touchedDefinitionKeys: [],
            },
            {
              hash: "f".repeat(40),
              subject: "other",
              dateIso: "",
              touchedRule: false,
              touchedDefinitionKeys: [],
            },
          ],
        }),
      ],
      github,
    );
    expect(md).toContain("## Not ready — details");
    expect(md).toContain('<h3 id="nr-prop">');
    expect(md).toContain('<h3 id="nr-appr">');
    const afterNotReady = md.split("## Not ready — details")[1] ?? "";
    const iProp = afterNotReady.indexOf('<h3 id="nr-prop">');
    const iAppr = afterNotReady.indexOf('<h3 id="nr-appr">');
    expect(iProp).toBeLessThan(iAppr);
    expect(afterNotReady).toContain("#12:");
    expect(afterNotReady).toContain("#### Changes since approval");
    expect(afterNotReady).toContain("touch rule");
  });

  it("renders not-ready sort: fewer blockers before more when commits tie", () => {
    const mk = (
      id: string,
      blockers: number,
      issues: number,
    ): RuleApprovalRow =>
      baseRow(id, {
        reportBucket: "notReady",
        implementations: [],
        waiApproved: false,
        commitsBehindSummary: "2",
        lastApprovedSummary: "-",
        blockersCount: blockers,
        issues: Array.from({ length: issues }, (_, i) => ({
          number: i,
          title: "t",
          html_url: "u",
        })),
        changes: [],
      });
    const rows = [mk("z-many-blockers", 2, 0), mk("a-few-blockers", 1, 0)];
    const md = generateApprovalReportMarkdown(rows, github);
    const sec = sectionAfterHeading(md, "## Not ready (2)");
    const iFew = sec.indexOf("[a-few-blockers](#a-few-blockers)");
    const iMany = sec.indexOf("[z-many-blockers](#z-many-blockers)");
    expect(iFew).toBeLessThan(iMany);
  });

  it("matches reportBucket type exhaustively in tests", () => {
    const buckets: ReportBucket[] = [
      "approvedReadyForUpdate",
      "proposedReadyForUpdate",
      "approvedUpToDate",
      "notReady",
    ];
    for (const reportBucket of buckets) {
      const r = baseRow(`id-${reportBucket}`, { reportBucket });
      if (reportBucket === "notReady") {
        r.implementations = [];
        r.commitsBehindSummary = "-";
        r.lastApprovedSummary = "-";
      }
      if (
        reportBucket === "approvedUpToDate" ||
        reportBucket === "approvedReadyForUpdate"
      ) {
        r.waiApproved = true;
        r.commitsBehindSummary =
          reportBucket === "approvedUpToDate" ? "0" : "1";
        if (reportBucket === "approvedReadyForUpdate") {
          r.changes = [
            {
              hash: "c".repeat(40),
              subject: "s",
              dateIso: "",
              touchedRule: true,
              touchedDefinitionKeys: [],
            },
          ];
        }
      }
      const md = generateApprovalReportMarkdown([r], github);
      expect(md.length).toBeGreaterThan(100);
    }
  });
});
