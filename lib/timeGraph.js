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

let funcs = [[Util.insertRandom, Util.deleteRandom, Util.remoteInsertRandom, Util.remoteDeleteRandom, 'Inserted and Deleted Randomly'],
             [Util.insertEnd, Util.deleteEnd, Util.remoteInsertEnd, Util.remoteDeleteEnd, 'Inserted at and Deleted from End'],
             [Util.insertBeginning, Util.deleteBeginning, Util.remoteInsertBeginning, Util.remoteDeleteBeginning, 'Inserted at and Deleted from Beginning']];
let crdt;
let xs;
let ys;
let data;
let name;
let t1, t2, t3, t4;

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
          if (!(strat === 'minus' && func[4] === 'Inserted at and Deleted from End' && mult > 1 && op > 500) &&
              !(strat === 'minus' && func[4] === 'Inserted at and Deleted from End' && baseBound[0] === 32 && op > 1000) &&
              !(strat === 'plus' && func[4] === 'Inserted at and Deleted from Beginning' && baseBound[0] === 32 && op > 1000)) {
            t1 = Util.average(func[0](crdt, op), op);
            t2 = Util.average(func[1](crdt, op), op);
            t3 = Util.average(func[2](crdt, op), op);
            t4 = Util.average(func[3](crdt, op), op);
            xs.push(op);
            ys.push((t1 + t2 + t3 + t4) / 4);
          }
        });
        name = `mult: ${mult}, base: ${baseBound[0]}, bound: ${baseBound[1]}, strat: ${strat}`
        data.push({x: xs, y: ys, type: 'scatter', name: name});
      });
    });
  });
  Plotly.newPlot(`g${i}`, data, {title: `Average Local and Remote Operation Time, ${func[4]}`, height: 600});
});
