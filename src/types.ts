import { Node } from 'unist'

export type PageBase = {
  body: string,
  markdownAST: Node
  filename: string
}

export type MarkdownPage = PageBase & {
  frontmatter: Record<string, unknown>
}

export type RulePage = PageBase & {
  frontmatter: RuleFrontMatter
  proposed?: boolean
}

export type DefinitionPage = PageBase & {
  frontmatter: DefinitionFrontMatter
}

export type RuleFrontMatterBase = {
	id: string
  name: string
  rule_type: 'atomic' | 'composite'
  description: string,
  accessibility_requirements?: Record<string, AccessibilityRequirement>
  acknowledgements?: Record<string, string[]>
}

export type AtomicRuleFrontmatter = RuleFrontMatterBase & {
  rule_type: 'atomic'
  input_aspects: string[]
}

export type CompositeRuleFrontmatter = RuleFrontMatterBase & {
  rule_type: 'composite'
  input_rules: string[],
}

export type RuleFrontMatter = AtomicRuleFrontmatter | CompositeRuleFrontmatter;

export type DefinitionFrontMatter = {
  title: string,
  key: string
}

export type AccessibilityRequirement = {
  failed: string
  passed: string
  inapplicable: string
  title?: string
  forConformance?: boolean
}

export type Contributor = { name: string, url?: string }
