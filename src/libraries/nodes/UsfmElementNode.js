import { ElementNode } from "lexical";

export class UsfmElementNode extends ElementNode {
  constructor(attributes, data, key) {
    super(key);
    this.__data = data;
    this.__attributes = attributes;
  }

  getData() {
    return this.getLatest().__data;
  }

  setData(data) {
    const writable = this.getWritable();
    writable.__data = data;
  }

  getAttributes() {
    return this.getLatest().__attributes;
  }

  setAttributes(attributes) {
    const writable = this.getWritable();
    writable.__attributes = attributes;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      data: this.getData(),
      attributes: this.getAttributes(),
      type: "usfmelement",
      version: 1,
    };
  }
}
