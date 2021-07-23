import * as fs from "fs";
import { promisify } from "util";
import { dirname as getDirName } from "path";
import makeDir from "make-dir";

// Some stuff to simplify testing:
let isMocked = false;
let mockCalls: { path: string; content: string | unknown }[] = [];
const writeFile = promisify(fs.writeFile);

/**
 * Create file with given contents at specified location
 */
export const createFile = async (
  path: string,
  content: string | unknown
): Promise<void> => {
  if (isMocked) {
    mockCalls.push({ path, content });
    return;
  }

  const stringData =
    typeof content !== "string" ? JSON.stringify(content, null, 2) : content;

  const dirname = getDirName(path);
  await makeDir(dirname);
  await writeFile(path, stringData);
};

createFile.mock = () => {
  isMocked = true;
  mockCalls = [];
};

createFile.resetMock = () => {
  isMocked = false;
  mockCalls = [];
};

createFile.calls = () => {
  return mockCalls;
};
