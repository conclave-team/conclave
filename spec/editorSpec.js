import { JSDOM } from 'jsdom';

import Editor from '../lib/editor';

describe("Editor", () => {
  const mockMDE = {
    codemirror: {
      setOption: function() {}
    }
  };
  const editor = new Editor(mockMDE);
  editor.controller = {
    crdt: { text: '' }
  };

  describe("constructor", () => {
    it("sets the mde passed in to the.mde", () => {
      expect(editor.mde).toEqual(mockMDE);
    });
  });

  describe("bindChangeEvent", () => {
    // it("is triggered by a change in the codemirror", () => {
    //   spyOn(editor.mde.codemirror, "on");
    //   editor.mde.codemirror.trigger("change");
    //   expect(editor.mde.codemirror.on).toHaveBeenCalled();
    // });
    //
    // it("changes the character text to a new line", () => {
    //
    // });
    //
    // it("calls controller.handleInsert when change was an insert", () => {
    //
    // });
    //
    // it("calls controller.handleDelete when change was a deletion", () => {
    //
    // });
  });

  describe("updateView", () => {
    beforeEach(() => {
      const dom = new JSDOM(`<!DOCTYPE html><textarea></textarea>`);
    });

    // it("adds text to the view", () => {
    //   const editor = new Editor(null);
    //   const newText = "I am here."
    //   editor.updateView(newText);
    //
    //   expect(editor.mde.value()).toEqual(newText);
    // });
    //
    // it("removes text from the view", () => {
    //
    // });
    //
    // it("retains the cursor position", () => {
    //
    // });
  });

  describe("findLinearIdx", () => {
    it("returns 0 if lines of text is empty", () => {
      editor.controller.crdt.text = "";
      expect(editor.findLinearIdx(0, 0)).toEqual(0);
    });

    it("calculates linear index from a single line of text", () => {
      editor.controller.crdt.text = "abcdefghijklmnop";
      expect(editor.findLinearIdx(0, 7)).toEqual(7);
    });

    it("calculates linear index from multiple lines of text", () => {
      editor.controller.crdt.text = "abc\ndefgh\nijk\nlmnop";
      expect(editor.findLinearIdx(1, 2)).toEqual(6);
    });

    it("can find the linear index on the last line of text", () => {
      editor.controller.crdt.text = "abc\ndefgh\nijk\nlmnop";
      expect(editor.findLinearIdx(3, 2)).toEqual(16);
    });

    it("can find the linear index at the end of a line of text", () => {
      editor.controller.crdt.text = "abc\ndefgh\nijk\nlmnop";
      expect(editor.findLinearIdx(1, 5)).toEqual(9);
    });
  });
});
