import { resolve } from 'path';
import { existsSync } from 'fs';
import outdent from 'outdent';
import { createFile } from './create-file'

const template = outdent`
  ## Implementations

  This section is not part of the official rule. It is populated dynamically and 
  not accounted for in the change history or the last modified date.

  | Implementation | Consistency          | Complete | Report
  |----------------|----------------------|----------|-------------
  |                |                      |          | [View Report](https://act-rules.github.io/implementation/.../#id-)
`

export async function createMatrixFile(
  outDir: string,
  id: string
): Promise<void> {
  const matrixFilePath = resolve(
    outDir, '_includes', 'implementations', `${id}.md`
  )
  if (!existsSync(matrixFilePath)) {
    await createFile(matrixFilePath, template)
  }
}
