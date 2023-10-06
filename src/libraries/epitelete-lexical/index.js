import Epitelete from "epitelete";
import perf2html from "./perf2html";
import html2perf from "./html2perf";
import { handleNewGrafts } from "./helpers";

const ACTIONS = {
  WRITE_HTML: "writeHtml",
  READ_HTML: "readHtml",
  LOAD_HTML: "loadHtml",
  UNDO_HTML: "undoHtml",
  REDO_HTML: "redoHtml",
};
class EpiteleteHtml extends Epitelete {
  constructor({ proskomma = null, docSetId, htmlMap, options = {} }) {
    super({ proskomma, docSetId, options });
    this._htmlObservers = [];
    this.htmlMap = htmlMap;
  }

  unobserveHtml(observer) {
    this._htmlObservers = this._htmlObservers.filter((o) => o !== observer);
  }

  observeHtml(observer) {
    this._htmlObservers.push(observer);
    return () => this.unobserve(observer);
  }

  notifyHtmlObservers(...args) {
    this._htmlObservers.forEach((observer) => {
      observer(...args);
    });
  }

  _outputHtml(doc) {
    const sequencesHtml = Object.keys(doc.sequences).reduce(
      (sequences, seqId) => {
        sequences[seqId] = perf2html(doc, seqId, this.htmlMap);
        return sequences;
      },
      {},
    );
    return {
      docSetId: this.docSetId,
      mainSequenceId: doc.main_sequence_id,
      schema: doc.schema,
      metadata: doc.metadata,
      sequencesHtml,
    };
  }

  /**
   * Return current perfHtmlContainer
   * @param {string} bookCode
   * @param {object} [options]
   * @param {string} options.readPipeline - the name of the read pipeline
   */
  async readHtml(bookCode, options = {}) {
    const perfHtml = this._outputHtml(
      await this.readPerf(bookCode, { ...options, cloning: false }),
    );
    return perfHtml;
  }

  /**
   * Returns previous perfHtmlContainer in history
   * @param {string} bookCode
   * @param {object} [options]
   * @param {string} options.readPipeline - the name of the read pipeline
   */
  async undoHtml(bookCode, options = {}) {
    const perfHtml = this._outputHtml(
      await this.undoPerf(bookCode, { ...options, cloning: false }),
    );
    this.notifyHtmlObservers({ action: ACTIONS.UNDO_HTML, data: perfHtml });
    return perfHtml;
  }

  /**
   * Returns next perfHtmlContainer in history
   * @param {string} bookCode
   * @param {object} [options]
   * @param {string} options.readPipeline - the name of the read pipeline
   */
  async redoHtml(bookCode, options = {}) {
    const perfHtml = this._outputHtml(
      await this.redoPerf(bookCode, { ...options, cloning: false }),
    );
    this.notifyHtmlObservers({ action: ACTIONS.REDO_HTML, data: perfHtml });
    return perfHtml;
  }

  /**
   * Saves current perfHtmlContainer
   * @param {string} bookCode
   * @param {string} sequenceId
   * @param {object} perfHtml
   * @param {object} [options]
   * @param {string} options.writePipeline - the name of the write pipeline
   * @param {string} options.readPipeline - the name of the read pipeline
   */
  async writeHtml(bookCode, sequenceId, perfHtml, options = {}) {
    const { writePipeline, readPipeline, insertSequences } = options;
    const { perfSequence, newSequences } = html2perf(perfHtml, sequenceId);

    const history = this.history[bookCode];

    const newSequencesArray = Object.entries(newSequences);
    const hasNewSequences = !!newSequencesArray.length;
    if (hasNewSequences) {
      newSequencesArray.forEach(([sequenceId, perfSequence]) => {
        const validatorResult = this.validator.validate(
          "constraint",
          "perfSequence",
          "0.3.0",
          perfSequence,
        );
        if (!validatorResult.isValid) {
          throw `PERF sequence  ${sequenceId} for ${bookCode} is not valid: ${JSON.stringify(
            validatorResult,
          )}`;
        }
      });
      const doc = { ...this.getDocument(bookCode, false) };
      doc.sequences = { ...doc.sequences, ...newSequences };
      history.stack.unshift({ perfDocument: doc });
    }
    try {
      await this.writePerf(bookCode, sequenceId, perfSequence, {
        writePipeline,
        cloning: false,
      });
    } catch (e) {
      if (hasNewSequences) history.stack.shift();
      throw new Error(e.message);
    }
    if (hasNewSequences) history.stack.splice(1, 1);
    const writtenPerfHtml = await this.readHtml(bookCode, { readPipeline });
    this.notifyHtmlObservers({
      action: ACTIONS.WRITE_HTML,
      data: writtenPerfHtml,
    });
    return writtenPerfHtml;
  }
}

export default EpiteleteHtml;
