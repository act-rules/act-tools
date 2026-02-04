import * as fs from "node:fs";
import { outdent } from "outdent";
import {
  getRulePages,
  getDefinitionPages,
  getTestAssets,
} from "../get-page-data";

const tmpDir = "./.tmp-get-page-data";

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

  const testAssetText = outdent`
    console.log("hello");
  `;

  beforeEach(async () => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(`${tmpDir}/abc123.md`, ruleText);
    fs.writeFileSync(`${tmpDir}/dfn.md`, definitionText);
    fs.writeFileSync(`${tmpDir}/hello.js`, testAssetText);
  });

  afterEach(async () => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("getRulePages", () => {
    it("returns rule pages", () => {
      const rulePages = getRulePages(tmpDir, tmpDir);
      expect(rulePages).toHaveLength(1);
      expect(rulePages[0].filename).toContain("abc123.md");
    });
  });

  describe("getDefinitionPages", () => {
    it("returns definition pages", () => {
      const dfnPages = getDefinitionPages(tmpDir);
      expect(dfnPages).toHaveLength(1);
      expect(dfnPages[0].filename).toContain("dfn.md");
    });
  });

  describe("getTestAssets", () => {
    it("returns test assets", () => {
      const testAssets = getTestAssets(tmpDir, "/test-assets/hello.js");
      expect(Object.keys(testAssets)).toHaveLength(1);
      expect(testAssets["/test-assets/hello.js"]).toEqual(`${testAssetText}`);
    });

    it("ignores non CSS/HTML/JS assets", () => {
      fs.writeFileSync(`${tmpDir}/ignore.jpg`, testAssetText);
      const testAssets = getTestAssets(tmpDir, "/test-assets/ignore.jpg");
      expect(Object.keys(testAssets)).toHaveLength(0);
    });
  });
});
