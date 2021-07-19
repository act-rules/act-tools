import * as path from 'path';
import { getWcagMapping, updateWcagMapping } from '../utils/wcag-mapping';
import { getRulePages, getDefinitionPages } from '../utils/get-markdown-data';
import { createFile } from '../utils/create-file';
import { createMatrixFile } from './create-matrix-file';
import { getRuleContent } from './get-rule-content'
import { getDefinitionContent } from './get-definition-content'
import { DefinitionPage, RulePage } from '../types';

export type RuleTransformArg = {
  rulesDir: string,
  glossaryDir: string,
  ruleIds: string[],
  outDir: string
  proposed: boolean
  matrix: boolean
}

export async function ruleTransform({
  rulesDir = '.',
  glossaryDir = '.',
  ruleIds = [],
  outDir = '.',
  proposed = false,
  matrix = true
}: RuleTransformArg): Promise<void> {
  const rulesData = getRulePages(rulesDir)
  const glossary = getDefinitionPages(glossaryDir)
  const glossaryFiles = new Set<string>()
  const options = { proposed, matrix };

  const wcagMapping = getWcagMapping(outDir);
  for (const ruleData of rulesData) {
    if (ruleIds.length && !ruleIds.includes(ruleData.frontmatter?.id)) {
      continue
    }
    
    wcagMapping['act-rules'] = updateWcagMapping(wcagMapping['act-rules'], ruleData, options)
    console.log(`Updated ${ruleLink(ruleData)}`)

    const { filepath, content } = buildTfRuleFile(ruleData, glossary, options)
    const absolutePath = path.resolve(outDir, 'content', filepath)
    await createFile(absolutePath, content)
    if (options.matrix) {
      await createMatrixFile(outDir, ruleData.frontmatter?.id)
    }

    const definitions = parseDefinitions(content)
    definitions.forEach(dfn => glossaryFiles.add(dfn))
  }

  for (const definition of glossaryFiles) {
    const { filepath, content } = buildTfDefinitionFile(definition, glossary)
    await createFile(path.resolve(outDir, filepath), content)
  }

  const content = JSON.stringify(wcagMapping, null, 2);
  const wcagMappingPath = path.resolve(outDir, 'wcag-mapping.json')
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
  }
}

function buildTfDefinitionFile(definitionKey: string, glossary: DefinitionPage[]) {
  return {
    filepath: `content/glossary/${definitionKey}.md`,
    content: getDefinitionContent(definitionKey, glossary),
  }
}

function parseDefinitions(content: string): string[] {
  const definitionKeys: string[] = []
  const matches = content.match(/{%[^%]*%}/g)
  matches?.forEach(str => {
    const match = str.match(/{%\s+include_relative\s+glossary\/([^.]+).md\s+%}/i)
    if (match) {
      definitionKeys.push(match[1])
    }
  })
  return definitionKeys
}

function ruleLink({ frontmatter, filename }: RulePage) {
  return `[${frontmatter.name}](${ruleUrl(filename)})`
}

function ruleUrl(filename: string): string {
  return `/standards-guidelines/act/rules/${filename.replace('.md', '')}/`
}
