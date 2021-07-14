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
export const getMarkdownAstNodesOfType = (
  markdownAST?: Node,
  type?: string
): Node[] => {
  assert(markdownAST, `markdownAST is required`);
  assert(
    type,
    `Type of node to visit in AST is a required - https://github.com/syntax-tree/mdast#nodes`
  );

  const nodes: Node[] = [];
  visit(markdownAST, type, (node) => {
    nodes.push(node);
  });
  return nodes;
};

function visit(node: Node, type: string, cb: (node: Node) => void) {
  if (node.type === type) {
    cb(node);
  }
  if ("children" in node) {
    (node as Parent).children.forEach((child) => {
      visit(child, type, cb);
    });
  }
}
