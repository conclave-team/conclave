import { JSDOM } from 'jsdom';

import Editor from '../lib/editor';
//import CRDT from '../lib/crdt';
//import SimpleMDE from 'simplemde';

describe("Editor", () => {
  describe("bindChangeEvent", () => {
    it("is triggered by a change in the codemirror", () => {

    });

    it("changes the character text to a new line", () => {

    });

    it("calls controller.handleInsert when change was an insert", () => {

    });

    it("calls controller.handleDelete when change was a deletion", () => {

    });
  });

  describe("updateView", () => {
    beforeEach(() => {
      const dom = new JSDOM(`<!DOCTYPE html><textarea></textarea>`);
    });

    it("adds text to the view", () => {
      // document.createElement("textarea");
      // const editor = new Editor(null);
      // const newText = "I am here."
      // editor.updateView(newText);
      //
      // expect(editor.mde.value()).toEqual(newText);
    });

    it("removes text from the view", () => {

    });

    it("retains the cursor position", () => {

    });
  });

  describe("findLinearIdx", () => {
    it("splits the editor contents by line", () => {

    });

    it("calculates linear index from a single line of text", () => {

    });

    it("calculates linear index from multiple lines of text", () => {

    });
  });
});
