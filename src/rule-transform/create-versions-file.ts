import { resolve } from "path";
import { existsSync } from "fs";
import outdent from "outdent";
import { createFile } from "../utils/create-file";

export const template = outdent`
  ## Rule Versions

  This is the first version of this ACT rule.
`;

export async function createVersionsFile(
  outDir: string,
  id: string
): Promise<void> {
  const matrixFilePath = resolve(`${outDir}/content/rules/${id}/_versions.md`);
  if (!existsSync(matrixFilePath)) {
    await createFile(matrixFilePath, template);
  }
}
