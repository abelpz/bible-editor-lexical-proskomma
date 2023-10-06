import UUID from "pure-uuid";
import base64 from "base-64";

const getAttributesHtml = (props) =>
  Object.keys(props).reduce(
    (html, propKey) =>
      props[propKey] !== undefined && props[propKey] !== null
        ? (html += ` ${propKey}="${props[propKey]}"`)
        : html,
    "",
  );

const getDatasetHtml = (data) =>
  Object.keys(data).reduce(
    (html, dataKey) =>
      data[dataKey] ? (html += ` data-${dataKey}="${data[dataKey]}"`) : html,
    "",
  );

const setClassList = (classList) =>
  classList && Array.isArray(classList)
    ? ` class="${classList.join(" ")}"`
    : ` class="${classList}"`;

const setElementAttributes = ({ classList, id, attributes, dataset }) =>
  `${setClassList(classList)}${id && ` id="${id}"`}${getDatasetHtml(
    dataset,
  )}${getAttributesHtml(attributes)}`;
export const createElement = ({
  tagName = "div",
  id = "",
  classList = "",
  dataset = {},
  children = "",
  attributes = {},
}) =>
  `<${tagName || "div"}${setElementAttributes({
    classList,
    id,
    attributes,
    dataset,
  })}>${children}</${tagName || "div"}>`;

export const mapHtml = ({ props, htmlMap }) => {
  const { type, subtype } = props;
  const setDefaultClassList = (type, subtype) => [
    ...(type ? [type] : []),
    ...(subtype ? [subtype.replace(":", " ")] : []),
  ];

  if (!htmlMap) return { classList: setDefaultClassList(type, subtype) };

  const maps = [
    htmlMap[type]?.[subtype],
    htmlMap["*"]?.[subtype],
    htmlMap[type]?.["*"],
    htmlMap["*"]?.["*"],
  ];

  const getClassList = (classList) =>
    classList && (Array.isArray(classList) ? classList : [classList]);
  const result = maps.reduce(
    (_result, map) => {
      const _map = map || {};
      const { classList, tagName, id, attributes } =
        typeof _map === "function" ? _map(props) : _map;
      _result.classList = _result.classList.concat(
        getClassList(classList) || [],
      );
      _result.attributes = { ..._result.attributes, ...attributes };
      if (!_result.tagName && tagName) _result.tagName = tagName;
      if (!_result.id && id) _result.id = id;
      return _result;
    },
    { classList: [], tagName: "", attributes: {} },
  );
  return {
    classList: result.classList.length
      ? [...new Set(result.classList)]
      : setDefaultClassList(type, subtype),
    tagName: result.tagName,
    id: result.id,
    attributes: result.attributes,
  };
};

export const handleAtts = (atts) =>
  atts
    ? Object.keys(atts).reduce((attsProps, key) => {
        attsProps[`atts-${key}`] =
          typeof atts[key] === "object" ? atts[key].join(",") : atts[key];
        return attsProps;
      }, {})
    : {};

export const handleSubtypeNS = (subtype) => {
  const subtypes = subtype.split(":");
  return subtypes.length > 1
    ? { "subtype-ns": subtypes[0], subtype: subtypes[1] }
    : { subtype };
};

export const generateId = () => base64.encode(new UUID(4)).substring(0, 12);

export const handleNewGrafts = (newGrafts) => {
  const newSequences = {};
  newGrafts.forEach((graft) => {
    const sequenceId = generateId();
    newSequences[sequenceId] = {
      type: graft.subtype,
      blocks: graft.content || [],
    };

    graft.target = sequenceId;
    delete graft.content;
    delete graft.new;
  });
  return newSequences;
};

export const createNode = ({
  type = "element",
  tagName = "span",
  id = "",
  classList = "",
  dataset = {},
  children = "",
  attributes = {},
}) =>
  `<${tagName || "div"}${setElementAttributes({
    classList,
    id,
    attributes,
    dataset,
  })}>${children}</${tagName || "div"}>`;
