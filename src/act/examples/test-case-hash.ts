import { createHash } from "crypto";

export function testCaseHash(code: string): string {
  // Remove sensitivity in space changes
  code = code.trim().replace(/\s+/gi, " ");

  // Create the actual hash
  const hash = createHash("sha1");
  hash.update(code);
  return hash.digest("hex");
}
