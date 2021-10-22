import moment from "moment";
import { Contributor } from "../../../types";
import { contributors } from "../../../data/index";

export function getFooter(
  acknowledgments: Record<string, string[]> = {}
): string {
  const date = moment().format("D MMMM YYYY");
  return (
    `<p><strong>Date:</strong> Updated ${date}</p>` +
    getAuthorParagraph(acknowledgments) +
    getSponsorParagraph(acknowledgments) +
    getAssetsParagraph(acknowledgments)
  );
}

function getAuthorParagraph(acknowledgments: Record<string, string[]>): string {
  const { authors, previous_authors } = acknowledgments;
  if (!authors) {
    return "";
  }
  let paragraph = `\n<p><strong>Authors:</strong> ${getAuthors(authors)}.`;
  if (previous_authors) {
    paragraph += ` <em>Previous Authors:</em> ${getAuthors(previous_authors)}.`;
  }
  return paragraph + "</p>";
}

function getSponsorParagraph(
  acknowledgments: Record<string, string[]>
): string {
  let paragraph =
    `\n<p>This rule was written in the ` +
    `<a href="https://w3.org/community/act-r/">ACT Rules community group</a>.`;

  if (acknowledgments.funding?.some((s) => s.toLowerCase() === "wai-tools")) {
    paragraph +=
      ` It is written as part of the EU-funded ` +
      `<a href="https://www.w3.org/WAI/about/projects/wai-tools/">WAI-Tools Project</a>.`;
  }
  return paragraph + "</p>";
}

function getAssetsParagraph(acknowledgments: Record<string, string[]>): string {
  const { assets } = acknowledgments;
  if (!assets) {
    return "";
  }
  return (
    `\n<p><strong>Assets:</strong> ` +
    `test cases use assets from the following sources: ` +
    `${assets.join(". ")}.</p>`
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
