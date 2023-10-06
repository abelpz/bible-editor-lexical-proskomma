import { addClassNamesToElement } from "@lexical/utils";
import { $applyNodeReplacement } from "lexical";
import { UsfmElementNode } from "./UsfmElementNode";

export class UsfmParagraphNode extends UsfmElementNode {
  static getType() {
    return "usfmparagraph";
  }

  static clone(node) {
    return new UsfmParagraphNode(node.__attributes, node.__data, node.__key);
  }

  constructor(attributes, data, key) {
    super(attributes, data, key);
  }

  static importJSON(serializedNode) {
    const { data, attributes, format, indent, direction } = serializedNode;
    const node = $createUsfmParagraphNode(attributes, data);
    node.setData(data);
    node.setAttributes(attributes);
    node.setFormat(format);
    node.setIndent(indent);
    node.setDirection(direction);
    return node;
  }

  createDOM(config) {
    const element = document.createElement("p");
    const attributes = this.getAttributes() || {};
    Object.keys(attributes).forEach((attKey) => {
      element.setAttribute(attKey, attributes[attKey]);
    });
    addClassNamesToElement(element, config.theme.sectionmark);
    return element;
  }

  isInline() {
    return false;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "usfmparagraph",
      version: 1,
    };
  }

  updateDOM(...updateDOMProps) {
    console.log({ updateDOMProps });
    return false;
  }
}

export function $createUsfmParagraphNode(attributes, data) {
  return $applyNodeReplacement(new UsfmParagraphNode(attributes, data));
}

export function $isUsfmParagraphNode(node) {
  return node instanceof UsfmParagraphNode;
}
