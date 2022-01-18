export function ruleUrl(filename: string): string {
  return `/standards-guidelines/act/rules/${filename.replace(".md", "")}/`;
}
