import { Parent } from "unist";
import { RulePage } from "../../types";

export function getReferenceLinks({ body, markdownAST }: RulePage): string {
  const children = (markdownAST as Parent).children;
  const firstDfn = children.find(({ type }) => type === "definition");
  if (!firstDfn || !firstDfn.position) {
    return "";
  }
  const { offset } = firstDfn.position.start;
  if (!offset) {
    return "";
  }
  return body.substr(offset);
}
