import * as fs from "fs";
import { promisify } from "util";
import { createVersionsFile, template } from "../create-versions-file";

const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const tmpDir = "./.tmp";

describe("rule-transform", () => {
  describe("createVersionsFile", () => {
    beforeEach(async () => {
      if (!fs.existsSync(tmpDir)) {
        await mkdir(tmpDir);
        await mkdir(`${tmpDir}/content`);
        await mkdir(`${tmpDir}/content/rules`);
        await mkdir(`${tmpDir}/content/rules/abc123`);
      }
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it("does nothing if the file exists", async () => {
      const dirName = `${tmpDir}/content/rules`;
      const filePath = `${dirName}/abc123/_versions.md`;
      fs.mkdirSync(dirName, { recursive: true });
      fs.writeFileSync(filePath, "foo");

      await createVersionsFile(tmpDir, "abc123");
      expect(fs.readFileSync(filePath, "utf8")).toBe("foo");
    });

    it("creates a file if none exists", async () => {
      const filePath = `${tmpDir}/content/rules/abc123/_versions.md`;
      await createVersionsFile(tmpDir, "abc123");
      expect(fs.readFileSync(filePath, "utf8")).toBe(template);
    });
  });
});
