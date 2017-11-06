describe("Editor.findLinearIdx", () => {
  function findLinearIdx(lineIdx, chIdx, text) {
    if (lineIdx >= text.length) {
      return -1;
    }
    if (chIdx > text[lineIdx].length) {
      return -1;
    }

    const linesOfText = text;
    let index = 0
    for (let i = 0; i < lineIdx; i++) {
      index += linesOfText[i].length + 1;
    }

    return index + chIdx;
  }

  it("returns -1 if lines of text is empty", () => {
    const linesOfText = [];
    expect(findLinearIdx(0, 0, linesOfText)).toEqual(-1);
  })

  it("returns -1 if line index not found in lines of text", () => {
    const linesOfText = ["a"];
    expect(findLinearIdx(1, 0, linesOfText)).toEqual(-1);
  });

  it("returns -1 if ch index not found in lines of text", () => {
    const linesOfText = ["ab"];
    expect(findLinearIdx(0, 3, linesOfText)).toEqual(-1);
  })

  it("calculates linear index from a single line of text", () => {
    const linesOfText = ["abcdefghijklmnop"];
    expect(findLinearIdx(0, 7, linesOfText)).toEqual(7);
  });

  it("calculates linear index from multiple lines of text", () => {
    const linesOfText = ["abc", "defgh", "ijk", "lmnop"];
    expect(findLinearIdx(1, 2, linesOfText)).toEqual(6);
  });

  it("can find the linear index on the last line of text", () => {
    const linesOfText = ["abc", "defgh", "ijk", "lmnop"];
    expect(findLinearIdx(3, 2, linesOfText)).toEqual(16);
  });

  it("can find the linear index at the end of a line of text", () => {
    const linesOfText = ["abc", "defgh", "ijk", "lmnop"];
    expect(findLinearIdx(1, 5, linesOfText)).toEqual(9);
  });
});
