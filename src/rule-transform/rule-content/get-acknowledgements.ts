import outdent from "outdent";
import { Contributor, RuleFrontMatter } from "../../types";
import { contributors as contributorsJson } from "../../data/contributors.json";

const contributors = contributorsJson as Contributor[];
type Acknowledgement = { title: string; items: Contributor[] };

export function getMdAcknowledgements({
  frontmatter,
}: {
  frontmatter: RuleFrontMatter;
}): string {
  let acknowledgements = frontmatter.acknowledgements;
  if (
    "acknowledgments" in frontmatter &&
    typeof acknowledgements === "undefined"
  ) {
    // Deal with UK spelling
    acknowledgements = frontmatter["acknowledgments"];
  }

  const sections = getAcknowledgements(acknowledgements, contributors);
  const sectionTexts = sections.map(sectionToMarkdown);
  const intro = outdent`
    This rule was written in the [ACT Rules community group](https://w3.org/community/act-r/), 
    with the support of the EU-funded [WAI-Tools Project](https://www.w3.org/WAI/about/projects/wai-tools/).
  `;
  return `## Acknowledgements\n\n${intro}\n\n` + sectionTexts.join("\n\n");
}

function sectionToMarkdown({ title, items }: Acknowledgement): string {
  const content = items.map(({ url, name }) =>
    url ? `- [${name}](${url})` : `- ${name}`
  );
  return `### ${title}\n\n` + content.join("\n");
}

function getAcknowledgements(
  acknowledgements: RuleFrontMatter["acknowledgements"],
  contributors: Contributor[]
): Acknowledgement[] {
  const sectionContent = Object.entries(acknowledgements || {});
  const sortedSections = sectionContent.sort(sortSections);

  return sortedSections.map(([title, content]) => {
    return getSectionText(title, content, contributors);
  });
}

function sortSections([a]: [string, unknown], [b]: [string, unknown]): number {
  const priorities = ["funding", "reviewers", "previous_authors", "authors"];
  const priorityA = priorities.indexOf(a);
  const priorityB = priorities.indexOf(b);

  if (priorityA !== -1 || priorityB !== -1) {
    // sort by index, highest index first
    return priorityB - priorityA;
  } else {
    // Sort revered alphabetically, ignoring case
    return a.toUpperCase() > b.toUpperCase() ? 1 : -1;
  }
}

function getSectionText(
  title: string,
  texts: string[],
  contributors: Contributor[]
): Acknowledgement {
  const items = texts.map((text) => getContributorLink(text, contributors));
  title = getHeadingText(title);
  return { title, items };
}

function getHeadingText(underscoredStr: string): string {
  const words = underscoredStr.split(/_/g);
  const uppercaseWords = words.map(
    (word) => word[0].toUpperCase() + word.substr(1)
  );
  return uppercaseWords.join(" ");
}

function getContributorLink(
  name: string,
  contributors: Contributor[]
): Contributor {
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
