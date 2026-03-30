#!/usr/bin/env ts-node
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { Command } from "commander";
import { getRulePages, getDefinitionPages } from "../utils/get-page-data";
import { getRuleDefinitions } from "../act/get-rule-definitions";

interface GlossaryOptions {
  rulesDir: string;
  glossaryDir: string;
  testAssetsDir?: string;
  outDir: string;
  wcagActRulesDir?: string;
}

const program = new Command();
program
  .requiredOption("-r, --rulesDir <dirname>", "Path to _rules directory")
  .requiredOption("-g, --glossaryDir <dirname>", "Path to glossary directory")
  .option("-t, --testAssetsDir <dirname>", "Path to test-assets directory", "")
  .requiredOption("-o, --outDir <dirname>", "Path to output directory")
  .option(
    "--wcagActRulesDir <dirname>",
    "Path to wcag-act-rules checkout directory for config nav injection",
  );

function buildUsedInRulesMap(
  rulesDir: string,
  glossaryDir: string,
  testAssetsDir: string,
) {
  const rules = getRulePages(rulesDir, testAssetsDir || ".");
  const glossary = getDefinitionPages(glossaryDir);

  const usedInRules = new Map<string, Set<{ id: string; name: string }>>();
  glossary.forEach((definition) => {
    usedInRules.set(definition.frontmatter.key, new Set());
  });

  rules.forEach((rule) => {
    const ruleDefinitions = getRuleDefinitions(rule, glossary);
    const ruleDefKeys = new Set(
      ruleDefinitions.map((def) => def.frontmatter.key),
    );

    ruleDefKeys.forEach((key) => {
      if (!usedInRules.has(key)) return;
      usedInRules
        .get(key)
        ?.add({ id: rule.frontmatter.id, name: rule.frontmatter.name });
    });
  });

  return { glossary, usedInRules };
}

export function normalizeHeadingLevels(body: string): string {
  return body.replace(/^(\s*)(#{1,6})(\s+)/gm, (_, leading, hashes, space) => {
    if (hashes.length <= 1) {
      return `${leading}${hashes}${space}`;
    }
    return `${leading}${"#".repeat(hashes.length - 1)}${space}`;
  });
}

function generateGlossaryContent(
  glossaryDefinitions: Array<{
    frontmatter: { key: string; title: string };
    body: string;
  }>,
  usedInRules: Map<string, Set<{ id: string; name: string }>>,
): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push("layout: standalone_resource");
  lines.push('title: "ACT Rules Glossary"');
  lines.push("permalink: /standards-guidelines/act/rules/glossary/");
  lines.push("ref: /standards-guidelines/act/rules/glossary/");
  lines.push("lang: en");
  lines.push('type_of_guidance: ""');
  lines.push("feedbackmail: public-wcag-act@w3.org");
  lines.push('footer: ""');
  lines.push("github:");
  lines.push("  repository: w3c/wcag-act-rules");
  lines.push("  path: content/terms/glossary.md");
  lines.push("---");
  lines.push("");
  lines.push("{::nomarkdown}");
  lines.push('{% include box.html type="start" title="Glossary" class="" %}');
  lines.push("{:/}");
  lines.push("");

  glossaryDefinitions.forEach((def) => {
    const key = def.frontmatter.key;
    const title = def.frontmatter.title;
    const body = normalizeHeadingLevels(def.body.trim());

    lines.push(`## ${title} {#${key}}`);
    lines.push("");
    lines.push(body);
    lines.push("");
    lines.push("### Used in rules");

    const rules = [...(usedInRules.get(key) || new Set())].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    if (rules.length === 0) {
      lines.push("- None");
    } else {
      rules.forEach((rule) => {
        lines.push(
          `- [${rule.name}](/standards-guidelines/act/rules/${rule.id}/proposed/)`,
        );
      });
    }

    lines.push("");
  });

  lines.push("{::nomarkdown}");
  lines.push('{% include box.html type="end" %}');
  lines.push("{:/}");

  return lines.join("\n");
}

async function generateFile(options: GlossaryOptions): Promise<void> {
  const { glossary, usedInRules } = buildUsedInRulesMap(
    options.rulesDir,
    options.glossaryDir,
    options.testAssetsDir || "",
  );

  const content = generateGlossaryContent(glossary, usedInRules);
  const outputDir = path.join(options.outDir, "content/terms");
  const outputFile = path.join(outputDir, "glossary.md");

  await fs.promises.mkdir(outputDir, { recursive: true });
  await fs.promises.writeFile(outputFile, content, "utf8");
  console.log(`Created glossary at ${outputFile}`);

  if (options.wcagActRulesDir) {
    await updateWcagConfigNav(options.wcagActRulesDir);
  }
}

async function updateWcagConfigNav(wcagActRulesDir: string) {
  const configPath = path.join(wcagActRulesDir, "_config.yml");
  const configContent = await fs.promises.readFile(configPath, "utf8");
  const configData: any = yaml.load(configContent);

  if (!configData?.defaults) return;

  const defaultValues = configData.defaults.find(
    (item: any) => item?.values?.standalone_resource_nav_links,
  );
  if (!defaultValues) return;

  const navLinks = defaultValues.values.standalone_resource_nav_links;
  const hasGlossary = navLinks.some(
    (link: any) => link.ref === "/standards-guidelines/act/rules/glossary/",
  );

  if (!hasGlossary) {
    navLinks.push({
      name: "Glossary",
      ref: "/standards-guidelines/act/rules/glossary/",
    });
    await fs.promises.writeFile(configPath, yaml.dump(configData), "utf8");
    console.log(
      "Updated wcag-act-rules _config.yml to include glossary nav link.",
    );
  }
}

if (require.main === module) {
  program.parse(process.argv);
  const options = program.opts<GlossaryOptions>();

  generateFile(options)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
