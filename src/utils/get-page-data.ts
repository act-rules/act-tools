import * as fs from "fs";
import * as path from "path";
import assert from "assert";
import globby from "globby";
import { parsePage, isParent } from "./parse-page";
import {
  DefinitionPage,
  DefinitionFrontMatter,
  MarkdownPage,
  RulePage,
  RuleFrontMatter,
} from "../types";

/**
 * Parse all markdown files in a given directory and construct metadata of each markdown file
 */
export const getMarkdownData = (dir: string): MarkdownPage[] => {
  const files = globby.sync(`${path.resolve(dir)}/**/*.md`);
  return files.map((markdownPath): MarkdownPage => {
    const filename = path.parse(markdownPath).base;
    const fileContents = fs.readFileSync(markdownPath, { encoding: "utf-8" });
    const { frontmatter, body, markdownAST } = parsePage(fileContents);

    assert(isParent(markdownAST), "Markdown file was empty");
    return { filename, frontmatter, body, markdownAST };
  });
};

export const getRulePages = (dir: string, ruleIds?: string[]): RulePage[] => {
  const rulePages: RulePage[] = [];
  const markdown = getMarkdownData(dir);
  markdown.forEach(({ frontmatter, ...page }) => {
    if (isRuleFrontmatter(frontmatter) && isIncluded(frontmatter.id, ruleIds)) {
      rulePages.push({ frontmatter, ...page });
    }
  });
  return rulePages;
};

export function isRuleFrontmatter(
  frontmatter: Record<string, unknown>
): frontmatter is RuleFrontMatter {
  return (
    typeof frontmatter["id"] === "string" &&
    typeof frontmatter["description"] === "string"
  );
}

export const getDefinitionPages = (dir: string): DefinitionPage[] => {
  const definitionPages: DefinitionPage[] = [];
  const markdownFiles = getMarkdownData(dir);
  markdownFiles.forEach(({ frontmatter, ...page }) => {
    if (isDefinitionFrontmatter(frontmatter)) {
      definitionPages.push({ frontmatter, ...page });
    }
  });
  return definitionPages;
};

export function isDefinitionFrontmatter(
  frontmatter: Record<string, unknown>
): frontmatter is DefinitionFrontMatter {
  return (
    typeof frontmatter["title"] === "string" &&
    typeof frontmatter["key"] === "string"
  );
}

function isIncluded(key: string, haystack?: string[]): boolean {
  return !haystack || haystack.includes(key);
}
