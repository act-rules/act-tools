import { Command } from 'commander'
import { ruleTransform, RuleTransformOptions } from './rule-transform/command'

const program = new Command();
program
  .option('-i, --ruleIds <id_list>', 'comma separated list of IDs', val => val.split(','))
  .option('-o, --outDir <dirname>', 'Path to output dir')
  .option('-r, --rulesDir <dirname>', 'Path to _rules directory')
  .option('-g, --glossaryDir <dirname>', 'Path to glossary directory')
  .option('-p, --proposed', 'List the rule with the Proposed rule template')
  .option('-m, --matrix', 'Add a table to link to the implementation matrix');

program.parse(process.argv);
const options = program.opts<RuleTransformOptions>();

ruleTransform(options)
  .then(() => {
    console.log('Created taskforce markdown files')
    process.exit()
  })
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
