import CRDT from './crdtLinear';
import * as Util from './utilLinear';
import UUID from 'uuid/v1';

function mockController() {
  return {
    siteId: UUID(),
    broadcastInsertion: function() {},
    broadcastDeletion: function() {},
    insertIntoEditor: function() {},
    deleteFromEditor: function() {},
    vector: {
      localVersion: {
        counter: 0
      },
      increment: function() {
        this.localVersion.counter++;
      }
    }
  }
}

const multipliers = [1, 2, 3];
const baseBounds = [[32, 10], [3200, 3000]];
const strategies = ['every2nd', 'every3rd', 'random', 'plus', 'minus'];
const ops = [10, 100, 500, 1000, 3000];
let funcs = [[Util.insertRandom, 'Inserted Randomly'], [Util.insertEnd, 'Inserted at End'], [Util.insertBeginning, 'Inserted at Beginning']];
let crdt;
let xs;
let ys;
let data;
let name;

funcs.forEach((func, i) => {
  data = [];
  multipliers.forEach(mult => {
    strategies.forEach(strat => {
      baseBounds.forEach(baseBound => {
        xs = [];
        ys = [];
        crdt = new CRDT(mockController(), baseBound[0], baseBound[1], strat, mult);
        crdt.insertText = function() {};
        crdt.deleteText = function() {};
        ops.forEach(op => {
          if (!(strat === 'minus' && func[1] === 'Inserted at End' && mult > 1 && op > 500) &&
              !(strat === 'plus' && func[1] === 'Inserted at Beginning' && op > 1000)) {
            func[0](crdt, op);
            xs.push(op);
            ys.push(Util.avgIdLength(crdt));
            crdt.struct = [];
          }
        });
        name = `mult: ${mult}, base: ${baseBound[0]}, bound: ${baseBound[1]}, strat: ${strat}`
        data.push({x: xs, y: ys, type: 'scatter', name: name});
      });
    });
  });
  Plotly.newPlot(`g${i}`, data, {title: `Average Id Digit Length, ${func[1]}`, height: 600});
});
