import { Node, Parent, Literal } from "unist";
import { outdent } from "outdent";
import { AccessibilityRequirement, RuleFrontMatter } from "../types";
import { parseMarkdown } from "../utils/parse-markdown";
import moment from "moment";
import * as yaml from "js-yaml";
import successCriteria from "../data/sc-urls.json";

const criteria: Record<
  string,
  | {
      num: string;
      handle: string;
      level: string;
    }
  | undefined
> = successCriteria;

export const getFrontmatter = (
  { filename, frontmatter }: { filename: string; frontmatter: RuleFrontMatter; },
  _?: any,
  options?: Record<string, boolean|undefined>
): string => {
  const permalink =
    "/standards-guidelines/act/rules/" + filename.replace(".md", "");
  const githubPath = `content/${filename}`;
  const ruleMeta = getRuleMeta(frontmatter);
  return outdent`
    ---
    title: "${stripMarkdownFromStr(frontmatter.name)}"
    permalink: ${permalink}/
    ref: ${permalink}/
    lang: en
    github:
      repository: w3c/wcag-act-rules
      path: ${githubPath}
    proposed: ${options?.proposed || false}
    rule_meta:
      ${indent(ruleMeta, 2)}
    ---
  `;
};

function getRuleMeta(frontmatter: RuleFrontMatter): string {
  const accRequirements = yaml.dump(frontmatter.accessibility_requirements);
  return outdent`
    id: ${frontmatter.id}
    name: "${frontmatter.name}"
    rule_type: ${frontmatter.rule_type}
    description: |
      ${frontmatter.description.trim()}
    accessibility_requirements:
      ${indent(accRequirements.trim(), 2)}
    ${getRuleInput(frontmatter)}
    last_modified: ${getDate()}
    ${getSCsTested(frontmatter.accessibility_requirements || {})}
  `.trim();
}

function getRuleInput(frontmatter: RuleFrontMatter): string {
  let ruleInput = "";
  if (frontmatter.rule_type === "atomic") {
    ruleInput = `input_aspects:`;
    frontmatter.input_aspects.forEach((inputAspect) => {
      ruleInput += "\n  - handle: " + inputAspect;
      ruleInput += "\n    url: " + getInputAspectUrl(inputAspect);
    });
  } else {
    ruleInput = `input_aspects:`;
    frontmatter.input_rules.forEach((ruleId) => {
      ruleInput += `\n  - ${ruleId}`;
    });
  }
  return ruleInput;
}

function stripMarkdownFromStr(str: string): string {
  const AST = parseMarkdown(str);
  return stripMarkdownFromAST(AST);
}

function stripMarkdownFromAST(markdownAST: Node): string {
  const node = markdownAST as Parent | Literal;
  if ("value" in node) {
    return node.value as string;
  }

  let str = "";
  for (const child of node.children || []) {
    str += stripMarkdownFromAST(child);
  }
  return str;
}

export function getDate(): string {
  return moment().format("MMMM Do, YYYY");
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
  };
  const urlHash = idMap[inputAspect.toLowerCase()];
  if (!urlHash) {
    return "";
  }
  return `https://www.w3.org/TR/act-rules-aspects/${urlHash}`;
}

function getSCsTested(
  accessibility_requirements: Record<string, AccessibilityRequirement>
): string {
  const accRequirements = Object.entries(accessibility_requirements);
  let criterionCount = 0;
  let text = "scs_tested:";
  accRequirements.forEach(([requirementId]) => {
    const [requirementDoc, scNumber] = requirementId.split(":");
    const criterion = criteria[scNumber];
    if (!requirementDoc.includes("wcag2") || !criterion) return;

    criterionCount++;
    text += `\n  - handle: ${criterion.handle}`;
    text += `\n    num: ${criterion.num}`;
    text += `\n    level: ${criterion.level}`;
  });

  return criterionCount === 0 ? "" : text;
}

function indent(str: string, spaces: number): string {
  const indent = "\n" + " ".repeat(spaces);
  return str.replace(/\n/gi, indent);
}
