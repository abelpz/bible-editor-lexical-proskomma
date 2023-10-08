import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { usfmText } from "./data/tit.usfm";
import { usfm2perf, transformPerfToLexicalState } from "./utils.js";
import { transformLexicalStateToPerf } from "./libraries/epitelete-lexical/lexicalConverter.js";
import EpiteleteHtml from "epitelete-html";
import { WrapperNode } from "./libraries/nodes/WrapperNode.js";
// import { DivisionNode } from "./libraries/nodes/DivisionNode.js";
// import { UsfmElementNode } from "./libraries/nodes/UsfmElementNode.js";
import { VerseNode } from "./libraries/nodes/VerseNode.js";
import { GraftNode } from "./libraries/nodes/GraftNode.js";
import { InlineNode } from "./libraries/nodes/InlineNode.js";

import { UsfmParagraphNode } from "./libraries/nodes/UsfmParagraphNode.js";

import Editor from "./Editor";

import {
  AutoSectionMarkNode,
  SectionMarkNode,
} from "./libraries/nodes/SectionMarkNode.js";

import { $getRoot, $getSelection } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import "./App.css";
import { useEffect, useState } from "react";

const theme = {
  // Theme styling goes here
};

function onError(error: Error) {
  console.error(error);
}

const perf = usfm2perf(usfmText, {
  serverName: "door43",
  organizationId: "unfoldingWord",
  languageCode: "en",
  versionId: "ult",
});

const bibleHandler = new EpiteleteHtml({
  docSetId: perf.metadata.translation.id,
  options: { historySize: 100 },
});

function App() {
  // const handleOnContent = (props) => initialTextLoaded && onContent(props);

  const [initialState, setInitialState] = useState(null);
  useEffect(() => {
    const readOptions = { readPipeline: "stripAlignmentPipeline" };
    const writeOptions = { writePipeline: "mergeAlignmentPipeline" };
    bibleHandler.sideloadPerf("RUT", perf, { ...readOptions }).then((perf) => {
      setInitialState(
        JSON.stringify(
          transformPerfToLexicalState(perf, perf.main_sequence_id),
        ),
      );
    });
  }, []);

  const OnChangePlugin = () => {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
      return editor.registerUpdateListener((listener) => {
        const getPerfFromNode = () =>
          transformLexicalStateToPerf(
            JSON.parse(JSON.stringify(listener.editorState)),
          );

        if (listener.dirtyElements.size > 0) {
          console.log("DIRTY ELEMENTS", {
            newPerf: getPerfFromNode(),
            dirtyElements: listener.dirtyElements,
          });
          for (const [nodeKey] of listener.dirtyElements) {
            const node = listener.editorState._nodeMap.get(nodeKey);
            const path = node?.__data?.path;
            if (path) console.log("node with path changed", { path, node });
          }
        }
        if (listener.dirtyLeaves.size > 0) {
          console.log("DIRTY LEAVES", {
            newPerf: getPerfFromNode(),
            dirtyLeaves: listener.dirtyLeaves,
          });
          for (const nodeKey of listener.dirtyLeaves) {
            const node = listener.editorState._nodeMap.get(nodeKey);
            console.log({ node });
          }
        }
      });
    }, [editor]);

    return null;
  };

  const initialConfig = {
    namespace: "MyEditor",
    theme,
    editorState: initialState,
    onError,
    nodes: [
      WrapperNode,
      SectionMarkNode,
      AutoSectionMarkNode,
      VerseNode,
      GraftNode,
      InlineNode,
      UsfmParagraphNode,
      // UsfmElementNode,
    ],
  };

  return initialState ? (
    <LexicalComposer initialConfig={initialConfig}>
      <Editor />
      <OnChangePlugin />
    </LexicalComposer>
  ) : null;
}

export default App;
