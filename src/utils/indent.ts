export function indent(str: string, spaceChar = " ", depth = 2): string {
  const indent = spaceChar.repeat(depth);
  return indent + str.split("\n").join("\n" + indent);
}
