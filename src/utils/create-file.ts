import * as fs from "node:fs";
import { dirname as getDirName } from "node:path";

// Some stuff to simplify testing:
let isMocked = false;
let mockCalls: { path: string; content: string | unknown }[] = [];

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
  fs.mkdirSync(dirname, { recursive: true });
  fs.writeFileSync(path, stringData);
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
