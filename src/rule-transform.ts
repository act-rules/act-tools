import * as path from "path";
import {
  getWcagMapping,
  updateWcagMapping,
} from "./rule-transform/wcag-mapping";
import { getRulePages, getDefinitionPages } from "./utils/get-markdown-data";
import { createFile } from "./utils/create-file";
import { createMatrixFile } from "./rule-transform/create-matrix-file";
import { getRuleContent } from "./rule-transform/get-rule-content";
import { DefinitionPage, RulePage } from "./types";

export type RuleTransformOptions = Partial<{
  rulesDir: string;
  glossaryDir: string;
  outDir: string;
  ruleIds: string[];
  proposed: boolean;
  matrix: boolean;
}>;

export async function ruleTransform({
  rulesDir = ".",
  glossaryDir = ".",
  ruleIds = [],
  outDir = ".",
  proposed = false,
  matrix = true,
}: RuleTransformOptions): Promise<void> {
  const options = { proposed, matrix };
  const rulesData = getRulePages(rulesDir, ruleIds);
  const glossary = getDefinitionPages(glossaryDir);
  const wcagMapping = getWcagMapping(outDir);

  for (const ruleData of rulesData) {
    wcagMapping["act-rules"] = updateWcagMapping(
      wcagMapping["act-rules"],
      ruleData,
      options
    );
    console.log(`Updated ${ruleLink(ruleData)}`);

    const { filepath, content } = buildTfRuleFile(ruleData, glossary, options);
    const absolutePath = path.resolve(outDir, "content", filepath);
    await createFile(absolutePath, content);
    if (options.matrix) {
      await createMatrixFile(outDir, ruleData.frontmatter?.id);
    }
  }

  const content = JSON.stringify(wcagMapping, null, 2);
  const wcagMappingPath = path.resolve(outDir, "wcag-mapping.json");
  await createFile(wcagMappingPath, content);
  console.log(`\nUpdated ${wcagMappingPath}`);
}

function buildTfRuleFile(
  ruleData: RulePage,
  glossary: DefinitionPage[],
  options: Record<string, boolean | undefined>
) {
  return {
    filepath: ruleData.filename,
    content: getRuleContent(ruleData, glossary, options),
  };
}

function ruleLink({ frontmatter, filename }: RulePage) {
  return `[${frontmatter.name}](${ruleUrl(filename)})`;
}

function ruleUrl(filename: string): string {
  return `/standards-guidelines/act/rules/${filename.replace(".md", "")}/`;
}
