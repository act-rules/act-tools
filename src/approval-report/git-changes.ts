import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { ChangeEntry } from "./types";

/**
 * Commits touching any of the given paths after `afterIsoDate` (YYYY-MM-DD),
 * deduplicated by commit hash, newest first.
 */
export function getChangesSinceApproval(
  actRulesRepo: string,
  afterIsoDate: string,
  ruleRepoRelPath: string,
  glossaryRepoRelPaths: string[],
): ChangeEntry[] {
  const paths = [
    toPosix(ruleRepoRelPath),
    ...glossaryRepoRelPaths.map(toPosix),
  ].filter(Boolean);
  if (paths.length === 0) return [];

  let logOut: string;
  try {
    logOut = execFileSync(
      "git",
      [
        "log",
        `--after=${afterIsoDate}`,
        "--format=%H\t%s\t%cI",
        "--",
        ...paths,
      ],
      {
        cwd: actRulesRepo,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      },
    );
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e.status === 0) return [];
    throw err;
  }

  const lines = logOut
    .trim()
    .split("\n")
    .filter((line) => line.length > 0);
  const seen = new Map<string, ChangeEntry>();

  for (const line of lines) {
    const tab = line.indexOf("\t");
    const tab2 = line.indexOf("\t", tab + 1);
    if (tab < 0 || tab2 < 0) continue;
    const hash = line.slice(0, tab);
    const subject = line.slice(tab + 1, tab2);
    const dateIso = line.slice(tab2 + 1);
    if (seen.has(hash)) continue;

    let files: string[];
    try {
      const names = execFileSync(
        "git",
        ["diff-tree", "--no-commit-id", "--name-only", "-r", hash],
        {
          cwd: actRulesRepo,
          encoding: "utf8",
          maxBuffer: 32 * 1024 * 1024,
        },
      );
      files = names
        .trim()
        .split("\n")
        .filter((f) => f.length > 0)
        .map(toPosix);
    } catch {
      files = [];
    }

    const ruleNorm = toPosix(ruleRepoRelPath);
    const glossarySet = new Set(glossaryRepoRelPaths.map(toPosix));
    const touchedRule = files.some((f) => f === ruleNorm);
    const touchedDefinitionKeys: string[] = [];
    for (const f of files) {
      if (!glossarySet.has(f)) continue;
      const key = glossaryKeyFromPath(f);
      if (key) touchedDefinitionKeys.push(key);
    }
    touchedDefinitionKeys.sort();

    seen.set(hash, {
      hash,
      subject,
      dateIso,
      touchedRule,
      touchedDefinitionKeys,
    });
  }

  return Array.from(seen.values()).sort((a, b) =>
    b.dateIso.localeCompare(a.dateIso),
  );
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function glossaryKeyFromPath(repoRelPath: string): string | undefined {
  const m = repoRelPath.match(/^pages\/glossary\/(.+)\.md$/);
  return m ? m[1] : undefined;
}

const isoDateFromGitLog = (cI: string): string => cI.trim().slice(0, 10);

/**
 * Latest commit date (YYYY-MM-DD) touching the rule file or any glossary path.
 */
export function getLatestCommitDateOnPaths(
  actRulesRepo: string,
  ruleRepoRelPath: string,
  glossaryRepoRelPaths: string[],
): string | null {
  const paths = [
    toPosix(ruleRepoRelPath),
    ...glossaryRepoRelPaths.map(toPosix),
  ].filter(Boolean);
  if (paths.length === 0) return null;

  let out: string;
  try {
    out = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...paths], {
      cwd: actRulesRepo,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    }).trim();
  } catch {
    return null;
  }
  if (!out) return null;
  return isoDateFromGitLog(out);
}

export function pathRelativeToRepo(
  repoRoot: string,
  absolutePath: string,
): string {
  return toPosix(
    path.relative(path.resolve(repoRoot), path.resolve(absolutePath)),
  );
}
