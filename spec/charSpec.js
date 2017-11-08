import Char from '../lib/char';
import Identifier from "../lib/identifier";

describe("Char", () => {
  describe("compareTo", () => {
    let char1;
    let id1;
    let id2;
    let id3;

    beforeEach(() => {
      id1 = new Identifier(2, 1);
      id2 = new Identifier(5, 1);
      id3 = new Identifier(1, 2);
      char1 = new Char("a", 0, 2, [id1, id2, id3]);
    });

    it("returns -1 if first position is 'lower' than second position", () => {
      const id21 = new Identifier(2, 1);
      const id22 = new Identifier(5, 1);
      const id23 = new Identifier(3, 2);
      const char2 = new Char("b", 0, 2, [id21, id22, id23]);
      expect(char1.compareTo(char2)).toEqual(-1);
    });

    it("returns -1 if first site is 'lower' than second site", () => {
      const id21 = new Identifier(2, 1);
      const id22 = new Identifier(5, 2);
      const id23 = new Identifier(1, 2);
      const char2 = new Char("b", 0, 2, [id21, id22, id23]);
      expect(char1.compareTo(char2)).toEqual(-1);
    });

    it("returns -1 if first position is 'shorter' than second position", () => {
      const id21 = new Identifier(2, 1);
      const id22 = new Identifier(5, 1);
      const id23 = new Identifier(1, 2);
      const id24 = new Identifier(8, 2);
      const char2 = new Char("b", 0, 2, [id21, id22, id23, id24]);
      expect(char1.compareTo(char2)).toEqual(-1);
    });

    it("returns 1 if first position is 'higher' than second position", () => {
      const id21 = new Identifier(2, 1);
      const id22 = new Identifier(3, 1);
      const id23 = new Identifier(1, 2);
      const char2 = new Char("b", 0, 2, [id21, id22, id23]);
      expect(char1.compareTo(char2)).toEqual(1);
    });

    it("returns 1 if first site is 'higher' than second site", () => {
      const id21 = new Identifier(2, 1);
      const id22 = new Identifier(5, 1);
      const id23 = new Identifier(1, 1);
      const char2 = new Char("b", 0, 1, [id21, id22, id23]);
      expect(char1.compareTo(char2)).toEqual(1);
    });

    it("returns 1 if first position is 'longer' than second position", () => {
      const id21 = new Identifier(2, 1);
      const id22 = new Identifier(5, 1);
      const char2 = new Char("b", 0, 1, [id21, id22]);
      expect(char1.compareTo(char2)).toEqual(1);
    });

    it("returns 0 if positions are exactly the same", () => {
      const id21 = new Identifier(2, 1);
      const id22 = new Identifier(5, 1);
      const id23 = new Identifier(1, 2);
      const char2 = new Char("b", 0, 2, [id21, id22, id23]);
      expect(char1.compareTo(char2)).toEqual(0);
    });
  });
});
