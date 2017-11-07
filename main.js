import CRDT from './lib/crdt';
import Char from './lib/char';
import Identifier from './lib/identifier';

const siteId = Math.floor(Math.random() * 1000);
const mockController = {
  siteId: siteId,
  broadcastInsertion: function() {},
  broadcastDeletion: function() {},
  updateEditor: function() {},
};

const crdt = new CRDT(mockController);
const siteCounter = 1;
const position = [new Identifier(1, siteId)];
const char1 = new Char('A', siteCounter, siteId, position);
const char2 = new Char('B', siteCounter + 1, siteId, [new Identifier(0, 0), new Identifier(5, 0)]);

crdt.insertChar(char1);
crdt.insertChar(char2);
console.log(crdt.struct);
console.log(char1.compareTo(char2));
