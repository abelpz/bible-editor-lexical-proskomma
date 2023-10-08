import { pushToArray } from "./utils";

export const convertLexicalStateNode = ({
  node: nodeData,
  nodeBuilder: buildNode,
}) => {
  const { children, ...node } = nodeData;
  return buildNode
    ? buildNode({
        node,
        children: children?.reduce(
          (convertedNodes, node) =>
            ((convertedNode) =>
              convertedNode
                ? pushToArray(convertedNodes, convertedNode)
                : convertedNodes)(
              convertLexicalStateNode({ node, nodeBuilder: buildNode }),
            ),
          [],
        ),
      })
    : undefined;
};

const buildGraft = ({ perf, node, data, children }) => {
  perf.sequences[node.data.target] = {
    type: node.data.subtype,
    blocks: children,
  };
  return { ...data };
};

const customNodeBuilder = ({ node, children, perf }) =>
  ((map) =>
    ((kind) =>
      typeof map[kind] === "function"
        ? map[kind]({ node, children })
        : map[kind] ??
          (() => {
            if (node?.type === "root")
              return { type: "main", blocks: children };
            if (node?.type === "text") return node.text;
            throw new Error(`unhandled kind: ${kind}`);
          })())(node?.data?.kind))({
    block: ({ node, children }) => {
      const { kind, path, ...data } = node.data || {};

      const { type } = data || {};
      if (type === "graft") return buildGraft({ perf, node, data, children });
      return {
        ...data,
        content: children,
      };
    },
    contentElement: ({ node, children }) => {
      const { kind, path, ...data } = node.data || {};
      const { type } = data || {};
      if (node.children) console.log("CHILDREN FOUND", node);
      if (type === "graft") {
        return buildGraft({ perf, node, data, children });
      }
      return {
        ...data,
        ...(children?.length ? { content: children } : undefined),
      };
    },
  });

export const transformLexicalStateToPerf = (lexicalState) => {
  const perf = { sequences: {} };
  perf.mainSequence = convertLexicalStateNode({
    node: lexicalState.root,
    nodeBuilder: (props) => customNodeBuilder({ ...props, perf }),
  });
  return perf;
};
