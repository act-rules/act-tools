type GlossaryFrontmatter = {
  title: string;
  key: string;
};

type GlossaryPage = {
  body: string;
  markdownAST: {
    children: Array<{
      type?: string;
      position?: { start?: { offset?: number } };
    }>;
  };
};

type GlossaryBodyMode = "rule" | "full";

type GlossaryBodyOptions = {
  mode: GlossaryBodyMode;
  normalizeHeadings?: boolean;
};

export function getGlossaryHeading(
  frontmatter: GlossaryFrontmatter,
  level: number,
): string {
  return `${"#".repeat(level)} ${frontmatter.title} {#${frontmatter.key}}`;
}

export function normalizeHeadingLevels(body: string): string {
  return body.replace(/^(\s*)(#{1,6})(\s+)/gm, (_, leading, hashes, space) => {
    if (hashes.length <= 1) {
      return `${leading}${hashes}${space}`;
    }
    return `${leading}${"#".repeat(hashes.length - 1)}${space}`;
  });
}

export function getGlossaryBody(
  definition: GlossaryPage,
  options: GlossaryBodyOptions,
): string {
  const body =
    options.mode === "full"
      ? definition.body.trim()
      : getDefinitionBodyForRule(definition);

  return options.normalizeHeadings ? normalizeHeadingLevels(body) : body;
}

function getDefinitionBodyForRule(definition: GlossaryPage): string {
  // Delete all lines after the first heading.
  // References are mixed into the bottom of the rule page later.
  const lines = definition.body.split("\n");
  const headingLineNum = lines.findIndex((line) => line.match(/^##/));
  if (headingLineNum === -1) {
    return stripDefinitions(definition);
  }

  lines.splice(headingLineNum);
  return lines.join("\n").trim();
}

function stripDefinitions({ body, markdownAST }: GlossaryPage): string {
  const firstRefLink = markdownAST.children.find(
    ({ type }) => type === "definition",
  );
  const refLinkOffset = firstRefLink?.position?.start?.offset;

  return !refLinkOffset ? body.trim() : body.substring(0, refLinkOffset).trim();
}
