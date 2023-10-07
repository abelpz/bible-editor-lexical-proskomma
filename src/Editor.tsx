import ClickableSectionMarkPlugin from "./libraries/plugins/ClickableSectionMarkPlugin.jsx";
import AutoSectionMarkPlugin from "./libraries/plugins/AutoSectionMarkPlugin.jsx";
import FloatingSectionMarkEditorPlugin from "./libraries/plugins/FloatingSectionMarkEditorPlugin.jsx";
import SectionMarkPlugin from "./libraries/plugins/SectionMarkPlugin.jsx";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import useLexicalEditable from "@lexical/react/useLexicalEditable";
import { useEffect, useState } from "react";

const CAN_USE_DOM =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.document.createElement !== "undefined";

export default function Editor() {
  const isEditable = useLexicalEditable();
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
  const [isSectionMarkEditMode, setIsSectionMarkEditMode] = useState(true);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState(false);
  console.log({
    CAN_USE_DOM,
    show: floatingAnchorElem,
  });
  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches;
      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);
    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);
  return (
    <div className={"editor-oce"}>
      <RichTextPlugin
        contentEditable={
          <div className="editor" ref={onRef}>
            <ContentEditable className="contentEditable" />
          </div>
        }
        placeholder={<div className="placeholder">Enter some text...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />

      {/* <AutoSectionMarkPlugin />
      <SectionMarkPlugin />
      {isEditable && <ClickableSectionMarkPlugin />}
      {floatingAnchorElem && (
        <FloatingSectionMarkEditorPlugin
          anchorElem={floatingAnchorElem}
          isSectionMarkEditMode={true}
          setIsSectionMarkEditMode={setIsSectionMarkEditMode}
        />
      )} */}
    </div>
  );
}
