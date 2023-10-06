import { Proskomma } from "proskomma-core";
import { convertSequence } from "./libraries/epitelete-lexical/perfConverter";

/** uses proskomma to convert USFM to PERF
 * @param {string} usfm the usfm formatted content
 * @param { Object } selectors an object to declare id selectors for this document
 */
export const usfm2perf = (
  usfm,
  {
    serverName = "server_unknown",
    organizationId = "organization_unknown",
    languageCode = "language_unknown",
    versionId = "version_unknown",
  },
) => {
  let perf;
  try {
    const CustomProskomma = class extends Proskomma {
      constructor() {
        super();
        this.selectors = [
          {
            name: "serverName",
            type: "string",
          },
          {
            name: "organizationId",
            type: "string",
          },
          {
            name: "languageCode",
            type: "string",
          },
          {
            name: "versionId",
            type: "string",
          },
        ];
        this.validateSelectors();
      }
    };
    const pk = new CustomProskomma();
    pk.importDocument(
      { serverName, organizationId, languageCode, versionId },
      "usfm",
      usfm,
    );
    const perfResultDocument = pk.gqlQuerySync(
      "{documents {id docSetId perf} }",
    ).data.documents[0];
    perf = JSON.parse(perfResultDocument.perf);
  } catch (e) {
    console.error(e);
    perf = null;
  }
  return perf;
};

/** a functions that allows easier mapping of PERF */
export const mapPerf = ({ props, path, children, defaults, perfMap }) => {
  const { type, subtype } = props;

  if (!perfMap) return defaults ? defaults : { props, path, children };

  const maps = [
    perfMap["*"]?.["*"],
    perfMap[type]?.["*"],
    perfMap["*"]?.[subtype],
    perfMap[type]?.[subtype],
  ];

  return maps.reduce(
    (_result, map) =>
      ((mapExists) =>
        mapExists
          ? typeof map === "function"
            ? map({ props, path, children })
            : map
          : _result)(map !== undefined),
    {},
  );
};

export const transformPerfToLexicalState = (perf, sequenceId) => ({
  root: convertSequence({
    sequence: perf.sequences[sequenceId],
    sequenceId,
    nodeBuilder: (props) => customNodeBuilder({ ...props, perfDocument: perf }),
  }),
});

export const customNodeBuilder = ({ props, children, path, perfDocument }) =>
  mapPerf({
    props,
    path,
    children,
    perfMap: buildPerfMap(perfDocument),
  });

export const buildPerfMap = (perf) =>
  ((context) => ({
    "*": {
      "*": ({ children, props: perfElementProps }) => {
        console.log("NOT SUPPORTED", { perfElementProps });
        return children?.length
          ? {
              data: perfElementProps,
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "color:red",
                  text: `NOT SUPPORTED ---->`,
                  type: "text",
                  version: 1,
                  data: perfElementProps,
                },
                ...children,

                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "color:red",
                  text: `<------`,
                  type: "text",
                  version: 1,
                  data: perfElementProps,
                },
              ],
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              type: "inline",
              version: 1,
            }
          : {
              data: perfElementProps,
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "color:red",
                  text: `[NOT SUPPORTED]`,
                  type: "text",
                  version: 1,
                },
              ],
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              type: "inline",
              version: 1,
            };
      },
      sequence: ({ children }) => ({
        children: children,
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      }),
    },
    text: {
      "*": ({ props: perfElementProps }) => ({
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: perfElementProps.text,
        type: "text",
        version: 1,
      }),
    },
    graft: {
      "*": ({ props: perfElementProps }) => ({
        children: ((lexicalState) => lexicalState.root.children)(
          transformPerfToLexicalState(perf, perfElementProps.target),
        ),
        data: perfElementProps,
        attributes: getAttributesFromPerfElementProps(perfElementProps),
        direction: "ltr",
        format: "",
        indent: 0,
        type: "graft",
        version: 1,
      }),
    },
    paragraph: {
      "*": ({ props: perfElementProps, children }) => ({
        children: children,
        data: perfElementProps,
        attributes: getAttributesFromPerfElementProps(perfElementProps),
        direction: "ltr",
        format: "",
        indent: 0,
        type: "usfmparagraph",
        version: 1,
      }),
    },
    wrapper: {
      "*": ({ children, props: perfElementProps }) => ({
        children,
        data: perfElementProps,
        attributes: getAttributesFromPerfElementProps(perfElementProps),
        direction: "ltr",
        format: "",
        indent: 0,
        type: "inline",
        version: 1,
      }),
    },
    mark: {
      ts: ({ props: perfElementProps }) => ({
        data: perfElementProps,
        type: "usfmparagraph",
        version: 1,
      }),
      verses: ({ props: perfElementProps }) => ({
        data: perfElementProps,
        attributes: {
          "data-atts-number": perfElementProps.atts.number,
          "data-type": perfElementProps.type,
          "data-subtype": perfElementProps.subtype,
          class: `${perfElementProps.subtype}`,
        },
        direction: "ltr",
        format: "",
        indent: 0,
        type: "verse",
        version: 1,
      }),
      chapter: ({ props: perfElementProps }) => ({
        data: perfElementProps,
        attributes: {
          "data-atts-number": perfElementProps.atts.number,
          "data-type": perfElementProps.type,
          "data-subtype": perfElementProps.subtype,
          class: `${perfElementProps.subtype}`,
        },
        direction: "ltr",
        format: "",
        indent: 0,
        type: "verse",
        version: 1,
      }),
    },
  }))({});

const getAttributesFromPerfElementProps = ({ metaContent, ...data }) =>
  Object.keys(data).reduce((atts, dataKey) => {
    atts[`data-${dataKey}`] = data[dataKey];
    return atts;
  }, {});
