import defaultPerfMap from "./perfmap.js";
import { createNode, handleAtts, handleSubtypeNS, mapPerf } from "./helpers";

const contentChildren = (content, perfMap = defaultPerfMap) =>
  content?.reduce(
    (contentHtml, element) =>
      (contentHtml +=
        typeof element === "string"
          ? element
          : contentElementHtml(element, perfMap)),
    "",
  ) ?? "";

const contentHtml = (content, className, perfMap = defaultPerfMap) =>
  content
    ? createNode({
        tagName: "span",
        classList: [className],
        children: content?.reduce(
          (contentsHtml, element) =>
            typeof element === "string"
              ? (contentsHtml += element)
              : (contentsHtml += contentElementHtml(element, perfMap)),
          "",
        ),
      })
    : "";

const contentElementHtml = (element, perfMap = defaultPerfMap) => {
  const { type, subtype, content, meta_content, atts, ...props } = element;
  const attsProps = handleAtts(atts);
  const subtypes = handleSubtypeNS(subtype);
  const { classList, tagName, id, attributes } = mapPerf({
    props: { type, subtype, atts, ...props },
    perfMap,
  });
  const innerHtml = (content) => {
    const getters = {
      // markHtml: () => ["chapter", "verses"].includes(subtype) ? "" : "",
      wrapperHtml: () =>
        contentChildren(content, perfMap) +
        contentHtml(meta_content, "meta-content", perfMap),
    };
    const getContentHtml = getters[`${type}Html`];
    return typeof getContentHtml === "function" ? getContentHtml() : "";
  };

  return createNode({
    tagName,
    id,
    classList,
    attributes,
    dataset: { type, ...subtypes, ...attsProps, ...props },
    children: innerHtml(content),
  });
};

const convertBlock = ({
  block,
  nodeCreator: createNode,
  perfMap = defaultPerfMap,
}) => {
  const { type, subtype, atts, content, ...props } = block;
  const attsProps = handleAtts(atts);
  const subtypes = handleSubtypeNS(subtype);
  const propsFromMap = mapPerf({
    props: { type, subtype, atts, ...props },
    perfMap,
  });
  return createNode({
    props: { type, ...subtypes, ...attsProps, ...props, ...propsFromMap },
    children: contentChildren(content, perfMap),
  });
};

const convertSequence = ({
  perfSequence,
  sequenceId,
  nodeCreator: createNode,
  perfMap = defaultPerfMap,
}) => {
  const { blocks, ...props } = perfSequence;
  const propsFromMap = mapPerf({
    props: { ...props, subtype: "sequence", sequenceId },
    perfMap,
  });
  return createNode({
    props: { ...props, ...propsFromMap },
    children: blocks?.reduce((convertedBlocks, block) => {
      convertedBlocks.push(
        convertBlock({ block, nodeCreator: createNode, perfMap }),
      );
      return convertedBlocks;
    }, []),
  });
};

function convertPerf({
  perfDocument,
  sequenceId,
  nodeCreator,
  perfMap = defaultPerfMap,
}) {
  const perfSequence = perfDocument.sequences[sequenceId];
  return convertSequence({ perfSequence, sequenceId, nodeCreator, perfMap });
}

export default convertPerf;
