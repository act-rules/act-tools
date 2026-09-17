import * as fs from "node:fs";
import * as path from "node:path";

import { buildRuleApprovalRows } from "./build-rule-approval-rows";
import { generateApprovalReportMarkdown } from "./generate-report";
import { ApprovalReportOptions } from "./types";

export async function runApprovalReport(
  opts: ApprovalReportOptions,
): Promise<void> {
  const rows = await buildRuleApprovalRows(opts);
  fs.mkdirSync(path.dirname(path.resolve(opts.outFile)), { recursive: true });
  fs.writeFileSync(opts.outFile, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.resolve(opts.outFile)} (${rows.length} rules)`);

  if (opts.markdownFile) {
    const md = generateApprovalReportMarkdown(rows, {
      owner: opts.githubOwner,
      repo: opts.githubRepo,
    });
    fs.mkdirSync(path.dirname(path.resolve(opts.markdownFile)), {
      recursive: true,
    });
    fs.writeFileSync(opts.markdownFile, md, "utf8");
    console.log(`Wrote debug report ${path.resolve(opts.markdownFile)}`);
  }
}
