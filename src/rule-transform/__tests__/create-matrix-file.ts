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
      }
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it("does nothing if the file exists", async () => {
      const dirName = `${tmpDir}/_includes/implementations`;
      const filePath = `${dirName}/abc123.md`;
      fs.mkdirSync(dirName, { recursive: true });
      fs.writeFileSync(filePath, "foo");

      await createMatrixFile(tmpDir, "abc123");
      expect(fs.readFileSync(filePath, "utf8")).toBe("foo");
    });

    it("creates a file if none exists", async () => {
      const filePath = `${tmpDir}/_includes/implementations/abc123.md`;
      await createMatrixFile(tmpDir, "abc123");
      expect(fs.readFileSync(filePath, "utf8")).toBe(template);
    });
  });
});
