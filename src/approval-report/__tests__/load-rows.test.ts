import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { loadRuleApprovalRows } from "../load-rows";

describe("loadRuleApprovalRows", () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "act-tools-rows-"));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  function write(contents: string): string {
    const filePath = path.join(directory, "rows.json");
    fs.writeFileSync(filePath, contents);
    return filePath;
  }

  it("loads an array containing rule ids", () => {
    expect(loadRuleApprovalRows(write('[{"ruleId":"674b10"}]'))).toEqual([
      { ruleId: "674b10" },
    ]);
  });

  it("rejects malformed JSON", () => {
    expect(() => loadRuleApprovalRows(write("{not json"))).toThrow(SyntaxError);
  });

  it("rejects JSON that is not a RuleApprovalRow array", () => {
    expect(() =>
      loadRuleApprovalRows(write('[{"name":"Missing id"}]')),
    ).toThrow(/not a RuleApprovalRow JSON array/);
    expect(() => loadRuleApprovalRows(write("{}"))).toThrow(
      /not a RuleApprovalRow JSON array/,
    );
  });
});
