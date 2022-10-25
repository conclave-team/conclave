import CRDTLinear from './crdtLinear';
import * as UtilLinear from './utilLinear';
import CRDT from './crdt';
import * as Util from './util';
import UUID from 'uuid/v1';


function mockController() {
  return {
    siteId: UUID(),
    broadcastInsertion: function() {},
    broadcastDeletion: function() {},
    insertIntoEditor: function() {},
    deleteFromEditor: function() {},
    vector: {
      getLocalVersion: () => {},
      localVersion: {
        counter: 0
      },
      increment: function() {
        this.localVersion.counter++;
      }
    }
  }
}

let func, base, boundary, mult, boundaryStrategy, crdt, xs, ys, data, name, title;
const ops = [1000, 10000, 20000, 40000, 60000, 80000, 100000];
base = 32;
boundary = 10;
mult = 2;
boundaryStrategy = 'random';

// Local Insertions
title = 'Local Insertions';
data = [];

// LINEAR
func = UtilLinear.insertBeginning;
xs = [];
ys = [];

crdt = new CRDTLinear(mockController(), base, boundary, boundaryStrategy, mult);
crdt.insertText = function() {};
crdt.deleteText = function() {};
ops.forEach(op => {
  xs.push(op);
  ys.push(func(crdt, op));
  crdt.struct = [];
});

name = 'Linear';
data.push({x: xs, y: ys, type: 'scatter', name: name});

// array-of-arrays
func = Util.insertBeginning;
xs = [];
ys = [];

crdt = new CRDT(mockController(), base, boundary, boundaryStrategy, mult);
ops.forEach(op => {
  xs.push(op);
  ys.push(func(crdt, op));
  crdt.struct = [];
});

name = 'Array-of-Arrays';
data.push({x: xs, y: ys, type: 'scatter', name: name});

Plotly.newPlot('g0', data, {title: title, height: 600});

// Local Deletions
title = 'Local Deletions';
data = [];

// linear
func = UtilLinear.deleteBeginning;
xs = [];
ys = [];

crdt = new CRDTLinear(mockController(), base, boundary, boundaryStrategy, mult);
crdt.insertText = function() {};
crdt.deleteText = function() {};
ops.forEach(op => {
  xs.push(op);
  UtilLinear.insertEnd(crdt, op);
  ys.push(func(crdt, op));
  crdt.struct = [];
});

name = 'Linear';
data.push({x: xs, y: ys, type: 'scatter', name: name});

// array-of-arrays
func = Util.deleteBeginning;
xs = [];
ys = [];

crdt = new CRDT(mockController(), base, boundary, boundaryStrategy, mult);
ops.forEach(op => {
  xs.push(op);
  Util.insertRandom(crdt, op);
  ys.push(func(crdt, op));
  crdt.struct = [];
});

name = 'Array-of-Arrays';
data.push({x: xs, y: ys, type: 'scatter', name: name});

Plotly.newPlot('g1', data, {title: title, height: 600});

// Remote Insertions
title = "Remote Insertions";
data = [];

// linear
func = UtilLinear.remoteInsertBeginning;
xs = [];
ys = [];
crdt = new CRDTLinear(mockController(), base, boundary, boundaryStrategy, mult);
crdt.insertText = function() {};
crdt.deleteText = function() {};
ops.forEach(op => {
  xs.push(op);
  ys.push(func(crdt, op));
  crdt.struct = [];
});

name = 'Linear';
data.push({x: xs, y: ys, type: 'scatter', name: name});

// array-of-arrays
func = Util.insertBeginning;
xs = [];
ys = [];

crdt = new CRDT(mockController(), base, boundary, boundaryStrategy, mult);
ops.forEach(op => {
  xs.push(op);
  ys.push(func(crdt, op));
  crdt.struct = [];
});

name = 'Array-of-Arrays';
data.push({x: xs, y: ys, type: 'scatter', name: name});

Plotly.newPlot('g2', data, {title: title, height: 600});

// Remote Deletions
title = 'Remote Deletions';
data = [];

// linear
func = UtilLinear.remoteDeleteBeginning;
xs = [];
ys = [];
crdt = new CRDTLinear(mockController(), base, boundary, boundaryStrategy, mult);
crdt.insertText = function() {};
crdt.deleteText = function() {};
ops.forEach(op => {
  xs.push(op);
  UtilLinear.remoteInsertEnd(crdt, op);
  ys.push(func(crdt, op));
  crdt.struct = [];
});

name = 'Linear';
data.push({x: xs, y: ys, type: 'scatter', name: name});

// array-of-arrays
func = Util.deleteBeginning;
xs = [];
ys = [];

crdt = new CRDT(mockController(), base, boundary, boundaryStrategy, mult);
ops.forEach(op => {
  xs.push(op);
  Util.insertRandom(crdt, op);
  ys.push(func(crdt, op));
  crdt.struct = [];
});

name = 'Array-of-Arrays';
data.push({x: xs, y: ys, type: 'scatter', name: name});

Plotly.newPlot('g3', data, {title: title, height: 600});
