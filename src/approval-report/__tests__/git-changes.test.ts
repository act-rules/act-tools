jest.mock("node:child_process", () => ({
  execFileSync: jest.fn(),
}));

import { execFileSync } from "node:child_process";
import * as path from "node:path";
import {
  getChangesSinceApproval,
  getLatestCommitDateOnPaths,
  pathRelativeToRepo,
} from "../git-changes";

const execMock = execFileSync as jest.MockedFunction<typeof execFileSync>;

describe("getChangesSinceApproval", () => {
  afterEach(() => {
    execMock.mockReset();
  });

  it("returns empty array when paths list is empty", () => {
    expect(getChangesSinceApproval("/repo", "2023-01-01", "", [])).toEqual([]);
    expect(execMock).not.toHaveBeenCalled();
  });

  it("parses git log and diff-tree into ChangeEntry with rule and glossary keys", () => {
    const hashNew = "a".repeat(40);
    const hashOld = "b".repeat(40);
    execMock.mockImplementation((file, args) => {
      if (file !== "git") throw new Error("expected git");
      const argv = args as string[];
      if (argv[0] === "log" && argv.includes("--after=2023-01-01")) {
        return (
          `${hashNew}\tsubject one\t2024-02-01T10:00:00+01:00\n` +
          `${hashOld}\tsecond commit\t2024-01-15T08:00:00Z\n`
        );
      }
      if (argv[0] === "diff-tree") {
        const hash = argv[argv.length - 1];
        if (hash === hashNew) {
          return "_rules/rule.md\npages/glossary/term-a.md\n";
        }
        if (hash === hashOld) {
          return "pages/glossary/term-z.md\n_other/ignore.txt\n";
        }
      }
      throw new Error(`unexpected git args: ${argv.join(" ")}`);
    });

    const out = getChangesSinceApproval(
      "/repo",
      "2023-01-01",
      "_rules/rule.md",
      ["pages/glossary/term-a.md", "pages/glossary/term-z.md"],
    );

    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      hash: hashNew,
      subject: "subject one",
      touchedRule: true,
      touchedDefinitionKeys: ["term-a"],
    });
    expect(out[1]).toMatchObject({
      hash: hashOld,
      subject: "second commit",
      touchedRule: false,
      touchedDefinitionKeys: ["term-z"],
    });
    expect(out[0].dateIso.localeCompare(out[1].dateIso)).toBeGreaterThan(0);
  });

  it("dedupes duplicate commit hashes in log output", () => {
    const hash = "c".repeat(40);
    execMock.mockImplementation((file, args) => {
      const argv = args as string[];
      if (argv[0] === "log") {
        return `${hash}\tone\t2024-01-01T00:00:00Z\n${hash}\tone\t2024-01-01T00:00:00Z\n`;
      }
      if (argv[0] === "diff-tree") {
        return "_rules/r.md\n";
      }
      throw new Error("unexpected");
    });

    expect(
      getChangesSinceApproval("/r", "2020-01-01", "_rules/r.md", []),
    ).toHaveLength(1);
  });

  it("returns empty array when git log throws with status 0", () => {
    execMock.mockImplementation(() => {
      const err = new Error("no commits") as Error & { status?: number };
      err.status = 0;
      throw err;
    });
    expect(
      getChangesSinceApproval("/r", "2020-01-01", "_rules/x.md", []),
    ).toEqual([]);
  });

  it("returns empty when diff-tree fails for a commit", () => {
    execMock.mockImplementation((file, args) => {
      const argv = args as string[];
      if (argv[0] === "log") {
        return `${"d".repeat(40)}\ts\t2024-01-01T00:00:00Z\n`;
      }
      if (argv[0] === "diff-tree") {
        throw new Error("diff-tree failed");
      }
      throw new Error("unexpected");
    });
    const out = getChangesSinceApproval("/r", "2020-01-01", "_rules/x.md", []);
    expect(out).toHaveLength(1);
    expect(out[0].touchedRule).toBe(false);
    expect(out[0].touchedDefinitionKeys).toEqual([]);
  });
});

describe("getLatestCommitDateOnPaths", () => {
  afterEach(() => {
    execMock.mockReset();
  });

  it("returns YYYY-MM-DD from latest commit timestamp", () => {
    execMock.mockReturnValue("2024-03-20T14:30:00+00:00\n");
    expect(getLatestCommitDateOnPaths("/repo", "_rules/r.md", [])).toBe(
      "2024-03-20",
    );
  });

  it("passes rule path and every glossary path to git log", () => {
    execMock.mockReturnValue("2024-03-20T14:30:00+00:00\n");
    getLatestCommitDateOnPaths("/repo", "_rules/rule.md", [
      "pages/glossary/term-a.md",
      "pages/glossary/term-b.md",
    ]);
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith(
      "git",
      [
        "log",
        "-1",
        "--format=%cI",
        "--",
        "_rules/rule.md",
        "pages/glossary/term-a.md",
        "pages/glossary/term-b.md",
      ],
      expect.objectContaining({
        cwd: "/repo",
        encoding: "utf8",
      }),
    );
  });

  it("returns null when paths list is empty", () => {
    expect(getLatestCommitDateOnPaths("/repo", "", [])).toBeNull();
    expect(execMock).not.toHaveBeenCalled();
  });

  it("returns null when git log fails", () => {
    execMock.mockImplementation(() => {
      throw new Error("git error");
    });
    expect(getLatestCommitDateOnPaths("/repo", "x.md", [])).toBeNull();
  });

  it("returns null when git returns empty stdout", () => {
    execMock.mockReturnValue("   \n");
    expect(getLatestCommitDateOnPaths("/repo", "x.md", [])).toBeNull();
  });
});

describe("pathRelativeToRepo", () => {
  it("returns POSIX-style relative path from repo root", () => {
    const repo = path.resolve("/tmp/repo");
    const file = path.join(repo, "_rules", "x.md");
    expect(pathRelativeToRepo(repo, file)).toBe("_rules/x.md");
  });
});
