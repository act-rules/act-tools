import moment from "moment";
import { Contributor, RuleFrontMatter } from "../../../types";
import { contributors } from "../../../data/index";
import { markdownToHtml } from "../../../utils";

type PartialFrontMatter = {
  id?: string;
  acknowledgments?: RuleFrontMatter["acknowledgments"];
  rules_format?: string;
};

export function getFooter(
  { acknowledgments, id, rules_format }: PartialFrontMatter,
  proposed?: boolean
): string {
  const date = moment().format("D MMMM YYYY");
  return (
    `<p><strong>Rule Identifier:</strong> ${id ?? "unknown"}</p>\n` +
    `<p><strong>Date:</strong> Updated ${date}</p>\n` +
    getAuthorParagraph(acknowledgments || {}) +
    getRulesFormatParagraph(rules_format) +
    getSponsorParagraph(acknowledgments || {}, proposed) +
    getAssetsParagraph(acknowledgments || {})
  ).trim();
}

function getAuthorParagraph(acknowledgments: Record<string, string[]>): string {
  const { authors, previous_authors } = acknowledgments;
  const contributors = `Contributors: <a href="https://www.w3.org/community/act-r/participants">Participants of the ACT Rules Community Group (CG)</a>.`;
  if (!authors) {
    return `<p>${contributors}</p>\n`;
  }
  let paragraph = `<p><strong>Authors:</strong> ${getAuthors(authors)}. `;
  if (previous_authors) {
    paragraph += `Previous Authors: ${getAuthors(previous_authors)}. `;
  }
  return paragraph + `${contributors}</p>\n`;
}

function getRulesFormatParagraph(rules_format?: string): string {
  if (!rules_format) {
    return "";
  }
  return (
    `<p>This rule is compatible with ` +
    `<a href="https://www.w3.org/TR/act-rules-format-${rules_format}/">` +
    `ACT Rules Format ${rules_format}</a>.</p>\n`
  );
}

function getSponsorParagraph(
  acknowledgments: Record<string, string[]>,
  proposed?: boolean
): string {
  let paragraph =
    `<p>This rule was written in the ` +
    `<a href="https://w3.org/community/act-r/">ACT Rules Community Group</a>.`;

  if (acknowledgments.funding?.some((s) => s.toLowerCase() === "wai-tools")) {
    paragraph +=
      ` It is written as part of the EU-funded ` +
      `<a href="https://www.w3.org/WAI/about/projects/wai-tools/">WAI-Tools Project</a>.`;
  }
  paragraph +=
    ` Implementations are part of the EU funded ` +
    `<a href="https://www.w3.org/WAI/about/projects/wai-coop/">WAI-CooP Project</a>.`;

  const agLink = `<a href="https://www.w3.org/groups/wg/ag">AG WG</a>`;
  paragraph += proposed
    ? ` It will be reviewed by the Accessibility Guidelines Working Group (${agLink}).`
    : ` It was approved and published by the Accessibility Guidelines Working Group (${agLink}).`;

  return paragraph + "</p>\n";
}

function getAssetsParagraph(
  acknowledgments: Record<string, string[] | undefined>
): string {
  const { assets } = acknowledgments;
  if (!assets) {
    return "";
  }
  return (
    "\n" +
    markdownToHtml(
      `**Assets:** Test cases use assets from the following sources: ` +
        assets.join("; ")
    )
  );
}

function getAuthors(authors: string[]): string {
  const authorLinks = authors.map((author) => {
    const { name, url } = getContributorLink(author);
    return url ? `<a href="${url}">${name}</a>` : name;
  });
  return authorLinks.join(", ");
}

function getContributorLink(name: string): Contributor {
  const contributor = contributors.find((contributor) => {
    return name.toLowerCase() === contributor.name.toLowerCase();
  });
  if (!contributor) {
    return { name };
  }
  return {
    name: contributor.name,
    url: contributor.url,
  };
}
