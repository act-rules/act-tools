import { Node, Parent } from "unist";

export function getRuleBody({
  body,
  markdownAST,
}: {
  body: string;
  markdownAST: Node;
}): string {
  const children = (markdownAST as Parent).children;
  const firstDfn = children.find(({ type }) => type === "definition");
  if (firstDfn && firstDfn.position) {
    const { offset } = firstDfn.position.start;
    if (offset) {
      body = body.substr(0, offset);
    }
  }

  return body.trim();
}
