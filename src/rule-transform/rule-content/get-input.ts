import { outdent } from "outdent";
import { RuleFrontMatter } from "../../types";
import { ruleUrl } from "../../utils";

type RulePage = { frontmatter: RuleFrontMatter; filename: string };
export const headingText = "Accessibility Requirements Mapping";

export function getInput(
  { frontmatter }: RulePage,
  _1?: unknown,
  _2?: unknown,
  rulesData: RulePage[] = []
): string {
  if ("input_aspects" in frontmatter) {
    return getInputAspects(frontmatter.input_aspects);
  } else {
    return getInputRules(frontmatter.input_rules, rulesData);
  }
}

function getInputAspects(inputAspects: string[]) {
  return outdent`
    ## Input Aspects

    The following aspects are required in using this rule.

    ${inputAspects
      .map((inputAspect) => {
        const url = getInputAspectUrl(inputAspect);
        return url
          ? `- [${inputAspect}](${url})`
          : `- ${inputAspect} (no link available)`;
      })
      .join("\n")}
  `;
}

function getInputRules(inputRules: string[], rulesData: RulePage[]) {
  return outdent`
    ## Input Rules

    Outcomes of the following rules are required as input for this rule.

    ${inputRules
      .map((ruleId) => `- ${getInputRuleUrl(ruleId, rulesData)}`)
      .join("\n")}
  `;
}

function getInputRuleUrl(ruleId: string, rulesData: RulePage[]) {
  const ruleData = rulesData.find(
    ({ frontmatter }) => frontmatter.id === ruleId
  );
  if (!ruleData) {
    return `${ruleId} (no link available)`;
  }
  return `[${ruleData.frontmatter.name}](${ruleUrl(ruleData.filename)})`;
}

function getInputAspectUrl(inputAspect: string): string {
  const idMap: Record<string, string | undefined> = {
    http: "#input-aspects-http",
    "http-headers": "#input-aspects-http",
    "http headers": "#input-aspects-http",
    dom: "#input-aspects-dom",
    "dom tree": "#input-aspects-dom",
    "css style": "#input-aspects-css",
    "css styles": "#input-aspects-css",
    "css styling": "#input-aspects-css",
    "accessibility tree": "#input-aspects-accessibility",
    language: "#input-aspects-text",
    "source code": "#input-aspects-code",
    "audio output": "#input-aspects-audio-out",
    audio: "#input-aspects-audio-out",
    "video output": "#input-aspects-video-out",
    video: "#input-aspects-video-out",
  };
  const urlHash = idMap[inputAspect.toLowerCase()];
  if (!urlHash) {
    return "";
  }
  return `https://www.w3.org/TR/act-rules-aspects/${urlHash}`;
}
