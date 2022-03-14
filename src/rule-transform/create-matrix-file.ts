import { resolve } from "path";
import { existsSync } from "fs";
import outdent from "outdent";
import { createFile } from "../utils/create-file";

export const template = outdent`
  ## Implementations

  This section is not part of the official rule. It is populated dynamically and 
  not accounted for in the change history or the last modified date.

  | Implementation | Consistency          | Complete | Report
  |----------------|----------------------|----------|-------------
  |                |                      |          | [View Report](https://act-rules.github.io/implementation/.../#id-)
`;

export async function createMatrixFile(
  outDir: string,
  id: string,
  proposed?: boolean
): Promise<void> {
  const matrixFilePath = resolve(
    outDir,
    "content",
    "rules",
    id,
    `_implementation-${proposed ? `proposed` : `approved`}.md`
  );
  if (!existsSync(matrixFilePath)) {
    await createFile(matrixFilePath, template);
  }
}
