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

let multipliers, bases, boundaries, strategies, crdt, xs, ys, data, name, title;
const ops = [100, 500, 1000, 3000, 5000];
const funcs = [
  [Util.insertRandom, 'Inserted Randomly'],
  [Util.insertEnd, 'Inserted at End'],
  [Util.insertBeginning, 'Inserted at Beginning']
];


// comparing multipliers

multipliers = [1, 2, 3];
data = [];

multipliers.forEach(mult => {
  funcs.forEach(func => {
    xs = [];
    ys = [];
    crdt = new CRDT(mockController(), 32, 10, 'random', mult);
    crdt.insertText = function() {};
    crdt.deleteText = function() {};
    ops.forEach(op => {
      func[0](crdt, op);
      xs.push(op);
      ys.push(Util.avgIdLength(crdt));
      crdt.struct = [];
    });
    name = `multiplier: ${mult}, ${func[1]}`;
    data.push({x: xs, y: ys, type: 'scatter', name: name});
  });
});

title = 'Different Base Multiplications (base = 32, boundary = 10, strategy = random)'
Plotly.newPlot('g0', data, {title: title, height: 600});


// comparing base

bases = [32, 1024, 4096];
data = [];

bases.forEach(base => {
  funcs.forEach(func => {
    xs = [];
    ys = [];
    crdt = new CRDT(mockController(), base, 10, 'random', 2);
    crdt.insertText = function() {};
    crdt.deleteText = function() {};
    ops.forEach(op => {
      func[0](crdt, op);
      xs.push(op);
      ys.push(Util.avgIdLength(crdt));
      crdt.struct = [];
    });
    name = `base: ${base}, ${func[1]}`;
    data.push({x: xs, y: ys, type: 'scatter', name: name});
  });
});

title = 'Different Starting Bases (mult = 2, boundary = 10, strategy = random)';
Plotly.newPlot('g1', data, {title: title, height: 600});


// comparing boundary

boundaries = [10, 20, 30];
data = [];

boundaries.forEach(boundary => {
  funcs.forEach(func => {
    xs = [];
    ys = [];
    crdt = new CRDT(mockController(), 32, boundary, 'random', 2);
    crdt.insertText = function() {};
    crdt.deleteText = function() {};
    ops.forEach(op => {
      func[0](crdt, op);
      xs.push(op);
      ys.push(Util.avgIdLength(crdt));
      crdt.struct = [];
    });
    name = `boundary: ${boundary}, ${func[1]}`;
    data.push({x: xs, y: ys, type: 'scatter', name: name});
  });
});

title = 'Different Boundaries (mult = 2, base = 32, strategy = random)';
Plotly.newPlot('g2', data, {title: title, height: 600});


// comparing strategy

strategies = ['every2nd', 'every3rd', 'random'];
data = [];

strategies.forEach(strat => {
  funcs.forEach(func => {
    xs = [];
    ys = [];
    crdt = new CRDT(mockController(), 32, 10, strat, 2);
    crdt.insertText = function() {};
    crdt.deleteText = function() {};
    ops.forEach(op => {
      func[0](crdt, op);
      xs.push(op);
      ys.push(Util.avgIdLength(crdt));
      crdt.struct = [];
    });
    name = `strategy: ${strat}, ${func[1]}`;
    data.push({x: xs, y: ys, type: 'scatter', name: name});
  });
});

title = 'Different Strategies (mult = 2, base = 32, boundary = 10)';
Plotly.newPlot('g3', data, {title: title, height: 600});
