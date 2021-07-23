import * as fs from "fs";
import { promisify } from "util";
import { createFile } from "../create-file";

const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const tmpDir = "./.tmp";

describe("utils", () => {
  describe("createFile", () => {
    beforeEach(async () => {
      if (!fs.existsSync(tmpDir)) {
        await mkdir(tmpDir);
      }
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it("creates a new file at the specified path", async () => {
      const filePath = `${tmpDir}/test.txt`;
      const text = "hello world";

      await createFile(filePath, text);
      const content = fs.readFileSync(filePath, "utf8");
      expect(content).toBe(text);
    });

    it("converts objects to strings before saving", async () => {
      const filePath = `${tmpDir}/test.json`;
      const obj = { hello: "world" };

      await createFile(filePath, obj);
      const content = fs.readFileSync(filePath, "utf8");
      expect(content).toBe(JSON.stringify(obj, null, 2));
    });

    it("creates any missing directory", async () => {
      expect(fs.existsSync(`${tmpDir}/dir/`)).toBe(false);
      const filePath = `${tmpDir}/dir/test.txt`;
      const text = "hello world";

      await createFile(filePath, text);
      const content = fs.readFileSync(filePath, "utf8");
      expect(content).toBe(text);
    });

    it("can be used as a mock", async () => {
      createFile.mock();
      const filePath = `${tmpDir}/test.txt`;
      const text = "hello world";

      await createFile(filePath, text);
      const calls = createFile.calls();
      createFile.resetMock();

      expect(fs.existsSync(filePath)).toBe(false);
      expect(calls).toEqual([
        {
          path: filePath,
          content: text,
        },
      ]);
    });
  });
});
