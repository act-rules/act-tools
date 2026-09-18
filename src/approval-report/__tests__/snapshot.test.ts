import { formatSnapshotJson, snapshotsEqual } from "../snapshot";
import { RuleApprovalRow } from "../types";

describe("snapshot formatting", () => {
  it("formats rows with a trailing newline", () => {
    const rows = [{ ruleId: "674b10" }] as RuleApprovalRow[];
    expect(formatSnapshotJson(rows)).toBe(
      '[\n  {\n    "ruleId": "674b10"\n  }\n]\n',
    );
  });

  it("skips equal formatted content but rewrites stale key order", () => {
    expect(
      snapshotsEqual(
        '{\n  "ruleId": "674b10",\n  "name": "A"\n}\n',
        '{"ruleId":"674b10","name":"A"}',
      ),
    ).toBe(true);
    expect(
      snapshotsEqual(
        '{"ruleId":"674b10","name":"A"}',
        '{"name":"A","ruleId":"674b10"}',
      ),
    ).toBe(false);
    expect(snapshotsEqual('{"ruleId":"a"}', '{"ruleId":"b"}')).toBe(false);
  });
});
