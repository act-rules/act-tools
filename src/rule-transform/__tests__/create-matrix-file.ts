import * as fs from "fs";
import { promisify } from "util";
import { createMatrixFile, template } from "../create-matrix-file";

const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const tmpDir = "./.tmp";

describe("rule-transform", () => {
  describe("createMatrixFile", () => {
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
      const filePath = `${dirName}/abc123/_implementation-approved.md`;
      fs.mkdirSync(dirName, { recursive: true });
      fs.writeFileSync(filePath, "foo");

      await createMatrixFile(tmpDir, "abc123");
      expect(fs.readFileSync(filePath, "utf8")).toBe("foo");
    });

    it("creates a file if none exists", async () => {
      const filePath = `${tmpDir}/content/rules/abc123/_implementation-approved.md`;
      await createMatrixFile(tmpDir, "abc123");
      expect(fs.readFileSync(filePath, "utf8")).toBe(template);
    });

    it("can create proposed implementation files", async () => {
      const filePath = `${tmpDir}/content/rules/abc123/_implementation-proposed.md`;
      await createMatrixFile(tmpDir, "abc123", true);
      expect(fs.readFileSync(filePath, "utf8")).toBe(template);
    });
  });
});
