import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  loadApprovalByRuleId,
  loadCompleteImplementationsByRuleId,
} from "../load-data";

function writeTree(root: string, files: Record<string, string>): void {
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
  }
}

describe("loadApprovalByRuleId", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "act-approval-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("marks approved when index.md entry has isoDate string", () => {
    writeTree(dir, {
      "_data/wcag-act-rules/rule-versions.yml": `
rule-a:
  - file: other.md
  - file: index.md
    isoDate: "2023-05-10"
`,
    });
    const out = loadApprovalByRuleId(dir);
    expect(out["rule-a"]).toEqual({
      approved: true,
      approvalIsoDate: "2023-05-10",
    });
  });

  it("normalizes Date parsed by YAML to ISO date string", () => {
    writeTree(dir, {
      "_data/wcag-act-rules/rule-versions.yml": `
rule-b:
  - file: index.md
    isoDate: 2023-06-15
`,
    });
    const out = loadApprovalByRuleId(dir);
    expect(out["rule-b"]?.approved).toBe(true);
    expect(out["rule-b"]?.approvalIsoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("marks not approved when index.md has no isoDate", () => {
    writeTree(dir, {
      "_data/wcag-act-rules/rule-versions.yml": `
rule-c:
  - file: index.md
`,
    });
    expect(loadApprovalByRuleId(dir)["rule-c"]).toEqual({ approved: false });
  });

  it("omits rule keys when entries value is not an array", () => {
    writeTree(dir, {
      "_data/wcag-act-rules/rule-versions.yml": `
rule-d: "broken"
`,
    });
    expect(loadApprovalByRuleId(dir)["rule-d"]).toBeUndefined();
  });

  it("skips empty isoDate on index.md", () => {
    writeTree(dir, {
      "_data/wcag-act-rules/rule-versions.yml": `
rule-e:
  - file: index.md
    isoDate: ""
`,
    });
    expect(loadApprovalByRuleId(dir)["rule-e"]).toEqual({ approved: false });
  });
});

describe("loadCompleteImplementationsByRuleId", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "act-impl-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("aggregates complete mappings from multiple JSON files and sorts names", () => {
    writeTree(dir, {
      "_data/wcag-act-rules/implementations/zebra.json": JSON.stringify({
        name: "Zebra",
        actRuleMapping: [
          { ruleId: "r1", consistency: "complete" },
          { ruleId: "r2", consistency: "partial" },
        ],
      }),
      "_data/wcag-act-rules/implementations/apple.json": JSON.stringify({
        name: "Apple",
        actRuleMapping: [{ ruleId: "r1", consistency: "complete" }],
      }),
    });
    const out = loadCompleteImplementationsByRuleId(dir);
    expect(out["r1"]).toEqual(["Apple", "Zebra"]);
    expect(out["r2"]).toBeUndefined();
  });

  it("uses basename when name is missing", () => {
    writeTree(dir, {
      "_data/wcag-act-rules/implementations/custom.json": JSON.stringify({
        actRuleMapping: [{ ruleId: "rx", consistency: "complete" }],
      }),
    });
    expect(loadCompleteImplementationsByRuleId(dir)["rx"]).toEqual(["custom"]);
  });

  it("returns empty object when implementations dir has no json", () => {
    fs.mkdirSync(path.join(dir, "_data/wcag-act-rules/implementations"), {
      recursive: true,
    });
    expect(loadCompleteImplementationsByRuleId(dir)).toEqual({});
  });
});
