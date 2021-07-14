import * as path from 'path';
import { getWcagMapping, updateWcagMapping } from './utils/wcag-mapping';
import { getRulePages, getDefinitionPages } from './utils/get-markdown-data';
import { createFile } from './utils/create-file';
import { getRuleContent } from './taskforce-rule-page/get-rule-content'
import { getDefinitionContent } from './taskforce-rule-page/get-definition-content'
import { program } from 'commander'
import { DefinitionPage, RulePage } from './types';

const rulesDirDefault = path.resolve(__dirname, '../node_modules/act-rules-community/_rules')
const glossaryDirDefault = path.resolve(__dirname, '../node_modules/act-rules-community/pages/glossary')

program
  .option('-i, --ruleIds <id_list>', 'comma separated list of IDs', val => val.split(','))
  .option('-o, --outDir <dirname>', 'Path to output dir')
  .option('-r, --rulesDir <dirname>', 'Path to _rules directory')
  .option('-g, --glossaryDir <dirname>', 'Path to glossary directory')
  .option('-p, --proposed', 'List the rule with the Proposed rule template')
  .parse(process.argv)

taskforceMarkdown(program as unknown as TaskforceMarkdownArg)
  .then(() => {
    console.log('Created taskforce markdown files')
    process.exit()
  })
  .catch(e => {
    console.error(e)
    process.exit(1)
  })


type TaskforceMarkdownArg = {
  rulesDir: string,
  glossaryDir: string,
  ruleIds: string[],
  outDir: string
  proposed: boolean
}

async function taskforceMarkdown({
  rulesDir = rulesDirDefault,
  glossaryDir = glossaryDirDefault,
  ruleIds = [],
  outDir = './content/',
  proposed = false,
}: TaskforceMarkdownArg): Promise<void> {
  const rulesData = getRulePages(rulesDir)
  const glossary = getDefinitionPages(glossaryDir)
  const glossaryFiles = new Set<string>()

  let wcagMapping = getWcagMapping(outDir);

  for (let ruleData of rulesData) {
    ruleData = { ...ruleData, proposed }
    if (ruleIds.length && !ruleIds.includes(ruleData.frontmatter?.id)) {
      continue
    }
    
    wcagMapping['act-rules'] = updateWcagMapping(wcagMapping['act-rules'], ruleData)
    console.log(`Updated ${ruleLink(ruleData)}`)

    const { filepath, content } = buildTfRuleFile(ruleData, glossary)
    await createFile(path.resolve(outDir, 'content', filepath), content)

    const definitions = parseDefinitions(content)
    definitions.forEach(dfn => glossaryFiles.add(dfn))
  }

  for (const definition of glossaryFiles) {
    const { filepath, content } = buildTfDefinitionFile(definition, glossary)
    await createFile(path.resolve(outDir, filepath), content)
  }

  const content = JSON.stringify(wcagMapping, null, 2);
  await createFile(path.resolve(outDir, 'wcag-mapping.json'), content)
  console.log('\nUpdated wcag-mapping.json')
}

function buildTfRuleFile(ruleData: RulePage, glossary: DefinitionPage[]) {
  return {
    filepath: ruleData.filename,
    content: getRuleContent(ruleData, glossary),
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