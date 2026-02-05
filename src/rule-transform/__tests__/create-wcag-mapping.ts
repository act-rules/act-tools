import * as fs from "node:fs";
import * as path from "node:path";
import outdent from "outdent";
import { parsePage } from "../../utils/parse-page";
import { RulePage } from "../../types";
import { createFile, indent } from "../../utils/index";
import { createWcagMapping } from "../create-wcag-mapping";

const tmpDir = path.join(".", ".tmp");
const mappingBase = {
  successCriteria: [],
  wcagTechniques: [],
  proposed: false,
  deprecated: false,
  frontmatter: {
    accessibility_requirements: null,
    name: "Hello world",
    id: "123abc",
  },
};

function getRulePage(metadata = ""): RulePage {
  const page = parsePage(outdent`
    ---
    id: 123abc
    name: Hello world
    accessibility_requirements:
    ${indent(metadata)}
    ---

    Hello World
  `);
  return { ...page, filename: "some-rule-123abc.md" } as RulePage;
}

describe("rule-transform", () => {
  describe("updateWcagMapping", () => {
    beforeEach(async () => {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    });

    afterEach(async () => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("returns a WCAG mapping", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      const rulePage = getRulePage();
      createFile.mock();
      const mapping = await createWcagMapping(filePath, [rulePage]);
      expect(mapping).toEqual({
        "act-rules": [
          {
            ...mappingBase,
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/",
          },
        ],
      });
    });

    it("lists WCAG success criteria from the rule", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      const rulePage = getRulePage(outdent`
        wcag20:1.1.1:
          forConformance: true
        wcag20:3.1.1:
          forConformance: true
      `);
      createFile.mock();
      const mapping = await createWcagMapping(filePath, [rulePage], {
        proposed: true,
      });
      expect(mapping).toEqual({
        "act-rules": [
          {
            ...mappingBase,
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/proposed/",
            successCriteria: ["non-text-content", "language-of-page"],
            proposed: true,
            frontmatter: {
              accessibility_requirements: {
                "wcag20:1.1.1": { forConformance: true },
                "wcag20:3.1.1": { forConformance: true },
              },
              ...rulePage.frontmatter,
            },
          },
        ],
      });
    });

    it("lists WCAG techniques from the rule", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      const rulePage = getRulePage(outdent`
        wcag20:1.1.1:
          forConformance: true
        wcag-technique:G123:
          forConformance: false
        wcag-technique:H42:
          forConformance: false
      `);
      createFile.mock();
      const mapping = await createWcagMapping(filePath, [rulePage], {
        proposed: true,
      });
      expect(mapping).toEqual({
        "act-rules": [
          {
            ...mappingBase,
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/proposed/",
            successCriteria: ["non-text-content"],
            wcagTechniques: ["G123", "H42"],
            proposed: true,
            frontmatter: {
              accessibility_requirements: {
                "wcag-technique:G123": { forConformance: false },
                "wcag-technique:H42": { forConformance: false },
                "wcag20:1.1.1": { forConformance: true },
              },
              ...rulePage.frontmatter,
            },
          },
        ],
      });
    });

    it("sets proposed: true if passed as an option", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      const rulePage = getRulePage();
      createFile.mock();
      const mapping = await createWcagMapping(filePath, [rulePage], {
        proposed: true,
      });
      expect(mapping).toEqual({
        "act-rules": [
          {
            ...mappingBase,
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/proposed/",
            proposed: true,
          },
        ],
      });
    });

    it("extends a WCAG mapping if one already exists", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          "act-rules": [
            {
              ...mappingBase,
              title: "Hello Mars",
              permalink: "/standards-guidelines/act/rules/789xyz/",
            },
          ],
        })
      );

      const rulePage = getRulePage();
      createFile.mock();
      const mapping = await createWcagMapping(filePath, [rulePage]);
      expect(mapping).toEqual({
        "act-rules": [
          {
            ...mappingBase,
            title: "Hello Mars",
            permalink: "/standards-guidelines/act/rules/789xyz/",
          },
          {
            ...mappingBase,
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/",
          },
        ],
      });
    });

    it("replaces a WCAG mapping if the mapping is already known", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          "act-rules": [
            {
              ...mappingBase,
              title: "Hello Mars",
              permalink: "/standards-guidelines/act/rules/123abc/",
            },
          ],
        })
      );

      const rulePage = getRulePage();
      createFile.mock();
      const mapping = await createWcagMapping(filePath, [rulePage]);
      expect(mapping).toEqual({
        "act-rules": [
          {
            ...mappingBase,
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/",
          },
        ],
      });
    });

    it("writes the WCAG mapping to disk", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      const rulePage = getRulePage();
      createFile.mock();
      await createWcagMapping(filePath, [rulePage]);

      const calls = createFile.calls();
      expect(calls).toEqual([
        {
          path: filePath,
          content: {
            "act-rules": [
              {
                ...mappingBase,
                permalink: "/standards-guidelines/act/rules/123abc/",
                title: "Hello world",
              },
            ],
          },
        },
      ]);
    });

    it("keeps proposed:false on a rule", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          "act-rules": [
            {
              ...mappingBase,
              title: "Hello Mars",
              permalink: "/standards-guidelines/act/rules/123abc/",
            },
          ],
        })
      );

      const rulePage = getRulePage();
      createFile.mock();
      const mapping = await createWcagMapping(filePath, [rulePage], {
        proposed: true,
      });
      expect(mapping).toEqual({
        "act-rules": [
          {
            ...mappingBase,
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/",
          },
        ],
      });
    });

    it("indicates when rules are deprecated", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      const rulePage = getRulePage();
      rulePage.frontmatter.deprecated = "This rule is deprecated.";

      createFile.mock();
      const mapping = await createWcagMapping(filePath, [rulePage]);
      expect(mapping).toEqual({
        "act-rules": [
          {
            ...mappingBase,
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/",
            deprecated: true,
            frontmatter: {
              deprecated: "This rule is deprecated.",
              ...rulePage.frontmatter,
            },
          },
        ],
      });
    });
  });
});
