import * as fs from "fs";
import { outdent } from "outdent";
import { promisify } from "util";
import { getRulePages, getDefinitionPages } from "../get-page-data";

const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const tmpDir = "./.tmp";

describe("utils", () => {
  const ruleText = outdent`
    ---
    id: abc123
    description: My rule
    ---
    My Rule
  `;

  const definitionText = outdent`
    ---
    title: Hello
    key: hello
    ---
    Hello definition
  `;

  beforeEach(async () => {
    if (!fs.existsSync(tmpDir)) {
      await mkdir(tmpDir);
    }
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe("getRulePages", () => {
    it("returns definition pages", () => {
      fs.writeFileSync(`${tmpDir}/abc123.md`, ruleText);
      fs.writeFileSync(`${tmpDir}/dfn.md`, definitionText);
      const dfnPages = getRulePages(tmpDir);
      expect(dfnPages).toHaveLength(1);
      expect(dfnPages[0].filename).toContain("abc123.md");
    });
  });

  describe("getDefinitionPages", () => {
    it("returns definition pages", () => {
      fs.writeFileSync(`${tmpDir}/abc123.md`, ruleText);
      fs.writeFileSync(`${tmpDir}/dfn.md`, definitionText);
      const dfnPages = getDefinitionPages(tmpDir);
      expect(dfnPages).toHaveLength(1);
      expect(dfnPages[0].filename).toContain("dfn.md");
    });
  });
});
