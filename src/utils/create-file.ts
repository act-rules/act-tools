import * as fs from "fs";
import { promisify } from "util";
import { dirname as getDirName } from "path";
import makeDir from "make-dir";

const writeFile = promisify(fs.writeFile);

/**
 * Create file with given contents at specified location
 */
export const createFile = async (
  path: string,
  content: string
): Promise<void> => {
  const dirname = getDirName(path);
  await makeDir(dirname);
  await writeFile(path, content);
};
