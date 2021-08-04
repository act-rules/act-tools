import assert from "assert";
import { Node, Parent } from "unist";

/**
 * Helper function to get all the nodes of a given type from markdown AST
 * - https://github.com/syntax-tree/mdast#nodes
 *
 * @param {Object} markdownAST markdown AST
 * @param {String} type AST type
 * @return {Array}
 */
export const getNodesByType = (markdownAST: Node, type: string): Node[] => {
  assert(markdownAST, `markdownAST is required`);
  assert(
    type,
    `Type of node to visit in AST is a required - https://github.com/syntax-tree/mdast#nodes`
  );

  const nodes: Node[] = [];
  walkAstTree(markdownAST, (node) => {
    if (node.type === type) {
      nodes.push(node);
    }
  });
  return nodes;
};

export function walkAstTree(
  node: Node | Parent,
  cb: (node: Node) => void
): void {
  cb(node);
  if ("children" in node) {
    node.children.forEach((child) => {
      walkAstTree(child, cb);
    });
  }
}
