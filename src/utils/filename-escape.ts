/**
 * Simple function go generate safe filenames and URLs
 * Casts to lower case, removes any non-alphanumeric values, replaces space with dash
 */
export function filenameEscape(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, " ")
    .trim()
    .replace(/[\s]+/g, "-");
}
