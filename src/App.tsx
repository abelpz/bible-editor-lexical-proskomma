import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { usfmText } from "./data/tit.usfm";
import { usfm2perf, transformPerfToLexicalState } from "./utils.js";
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
        const retObj = {};
        console.log({
          changed: listener.prevEditorState === listener.editorState,
        });

        listener.prevEditorState.read(
          () => (retObj.prevText = $getRoot()?.__cachedText),
        );
        listener.editorState.read(() => {
          console.log({ listener });
          console.log({
            state: JSON.parse(JSON.stringify(editor.getEditorState())),
            ...((selection) => ({
              selection,
              node: selection?.focus.getNode(),
            }))($getSelection()),
          });
          return (retObj.curText = $getRoot()?.__cachedText);
        });
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
