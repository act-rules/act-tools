import * as path from 'path';
import { getWcagMapping, updateWcagMapping } from './utils/wcag-mapping';
import { getRulePages, getDefinitionPages } from './utils/get-markdown-data';
import { createFile } from './utils/create-file';
import { getRuleContent } from './taskforce-rule-page/get-rule-content'
import { getDefinitionContent } from './taskforce-rule-page/get-definition-content'
import { Command } from 'commander'
import { DefinitionPage, RulePage } from './types';

const program = new Command();
program
  .option('-i, --ruleIds <id_list>', 'comma separated list of IDs', val => val.split(','))
  .option('-o, --outDir <dirname>', 'Path to output dir')
  .option('-r, --rulesDir <dirname>', 'Path to _rules directory')
  .option('-g, --glossaryDir <dirname>', 'Path to glossary directory')
  .option('-p, --proposed', 'List the rule with the Proposed rule template');

program.parse(process.argv);
const options = program.opts<TaskforceMarkdownArg>();

taskforceMarkdown(options)
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
  rulesDir = '.',
  glossaryDir = '.',
  ruleIds = [],
  outDir = '.',
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
    const absolutePath = path.resolve(outDir, 'content', filepath)
    await createFile(absolutePath, content)

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
