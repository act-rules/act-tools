import outdent from "outdent";
import { Contributor, RuleFrontMatter } from "../types";
import {
  getAcknowledgements,
  Acknowledgement,
} from "../rule/get-acknowledgements";
import { contributors as contributorsJson } from "../../data/contributors.json";

const contributors = contributorsJson as Contributor[];

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
    acknowledgements = frontmatter["acknowledgements"];
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
