/**
 * Join an array of string with line breaks
 */
export function joinStrings(...items: Array<string | string[]>): string {
  const blocks = items.map((item) =>
    Array.isArray(item) ? item.join("\n").trim() : item.trim()
  );
  const textBlocks = blocks.filter((block) => block !== "");
  return textBlocks.join("\n\n");
}
