import { addClassNamesToElement } from "@lexical/utils";
import { $applyNodeReplacement } from "lexical";
import { UsfmElementNode } from "./UsfmElementNode";

export class VerseNode extends UsfmElementNode {
  static getType() {
    return "verse";
  }

  static clone(node) {
    return new VerseNode(node.__attributes, node.__data, node.__key);
  }

  constructor(attributes, data, key) {
    super(attributes, data, key);
  }

  static importJSON(serializedNode) {
    const { data, attributes, format, indent, direction } = serializedNode;
    const node = $createVerseNode(attributes, data);
    node.setData(data);
    node.setAttributes(attributes);
    node.setFormat(format);
    node.setIndent(indent);
    node.setDirection(direction);
    return node;
  }

  createDOM(config) {
    const element = document.createElement("span");
    const attributes = this.getAttributes();
    Object.keys(attributes).forEach((attKey) => {
      element.setAttribute(attKey, attributes[attKey]);
    });
    addClassNamesToElement(element, config.theme.sectionmark);
    return element;
  }

  isInline(){
    return true;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "verse",
      version: 1,
    };
  }
}

export function $createVerseNode(attributes, data) {
  return $applyNodeReplacement(new VerseNode(attributes, data));
}

export function $isVerseNode(node) {
  return node instanceof VerseNode;
}
