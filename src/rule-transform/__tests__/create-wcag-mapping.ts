import * as fs from "fs";
import { promisify } from "util";
import outdent from "outdent";
import { parsePage } from "../../utils/parse-page";
import { RulePage } from "../../types";
import { createFile, indent } from "../../utils/index";
import { createWcagMapping } from "../create-wcag-mapping";

const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const tmpDir = "./.tmp";

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
        await mkdir(tmpDir);
      }
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it("returns a WCAG mapping", async () => {
      const filePath = "./.tmp/wcag-mapping.json";
      const rulePage = getRulePage();
      createFile.mock();
      const mapping = await createWcagMapping(filePath, [rulePage]);
      expect(mapping).toEqual({
        "act-rules": [
          {
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/",
            successCriteria: [],
            wcagTechniques: [],
            proposed: false,
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
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/proposed/",
            successCriteria: ["non-text-content", "language-of-page"],
            wcagTechniques: [],
            proposed: true,
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
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/proposed/",
            successCriteria: ["non-text-content"],
            wcagTechniques: ["G123", "H42"],
            proposed: true,
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
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/proposed/",
            successCriteria: [],
            wcagTechniques: [],
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
              title: "Hello Mars",
              permalink: "/standards-guidelines/act/rules/789xyz/",
              successCriteria: [],
              wcagTechniques: [],
              proposed: false,
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
            title: "Hello Mars",
            permalink: "/standards-guidelines/act/rules/789xyz/",
            successCriteria: [],
            wcagTechniques: [],
            proposed: false,
          },
          {
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/",
            successCriteria: [],
            wcagTechniques: [],
            proposed: false,
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
              title: "Hello Mars",
              permalink: "/standards-guidelines/act/rules/123abc/",
              successCriteria: [],
              wcagTechniques: [],
              proposed: false,
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
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/",
            successCriteria: [],
            wcagTechniques: [],
            proposed: false,
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
                permalink: "/standards-guidelines/act/rules/123abc/",
                proposed: false,
                successCriteria: [],
                title: "Hello world",
                wcagTechniques: [],
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
              title: "Hello Mars",
              permalink: "/standards-guidelines/act/rules/123abc/",
              successCriteria: [],
              wcagTechniques: [],
              proposed: false,
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
            title: "Hello world",
            permalink: "/standards-guidelines/act/rules/123abc/",
            successCriteria: [],
            wcagTechniques: [],
            proposed: false,
          },
        ],
      });
    });
  });
});
