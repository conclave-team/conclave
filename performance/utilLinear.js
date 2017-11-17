import Char from '../lib/char';
import CRDT from '../lib/crdtLinear';
import { mockController } from './scriptLinear';

const CELL_1_SIZE = 17;
const CELL_2_SIZE = 20;
const CELL_3_SIZE = 21;
const CELL_4_SIZE = 16;
const CELL_5_SIZE = 15;

function insertRandom(crdt, numberOfOperations) {
  const start = Date.now();
  let index;

  for(let i = 0; i < numberOfOperations; i++) {
    index = Math.floor(Math.random() * i);
    crdt.handleLocalInsert('a', index);
  }

  const end = Date.now();
  return end - start;
}

function remoteInsertRandom(crdt, numberOfOperations) {
  const chars = generateChars(numberOfOperations);
  const randomChars = shuffle(chars);

  return remoteInsert(crdt, randomChars);
}

function insertBeginning(crdt, numberOfOperations) {
  const start = Date.now();

  for(let i = 0; i < numberOfOperations; i++) {
    crdt.handleLocalInsert('a', 0);
  }

  const end = Date.now();
  return end - start;
}

function insertEnd(crdt, numberOfOperations) {
  const start = Date.now();

  for(let i = 0; i < numberOfOperations; i++) {
    crdt.handleLocalInsert('a', i);
  }

  const end = Date.now();
  return end - start;
}

function remoteInsertBeginning(crdt, numberOfOperations) {
  const chars = generateChars(numberOfOperations);
  const descChars = chars.reverse();

  return remoteInsert(crdt, descChars);
}

function remoteInsertEnd(crdt, numberOfOperations) {
  const ascChars = generateChars(numberOfOperations);

  return remoteInsert(crdt, ascChars);
}

function remoteInsert(crdt, chars) {
  const start = Date.now();

  chars.forEach(char => crdt.handleRemoteInsert(char));

  const end = Date.now();
  return end - start;
}

function deleteRandom(crdt) {
  const start = Date.now();
  let index;

  for(let i = crdt.struct.length - 1; i >= 0; i--) {
    index = Math.floor(Math.random() * i);
    crdt.handleLocalDelete(index);
  }

  const end = Date.now();
  return end - start;
}

function remoteDeleteRandom(crdt) {
  let toDel = [];
  crdt.struct.forEach(char => toDel.push(char));
  const randomToDel = shuffle(toDel);
  return remoteDelete(crdt, randomToDel);
}

function deleteBeginning(crdt) {
  const start = Date.now();

  for(let i = crdt.struct.length - 1; i >= 0; i--) {
    crdt.handleLocalDelete(0);
  }

  const end = Date.now();
  return end - start;
}

function remoteDeleteBeginning(crdt) {
  let toDel = [];
  crdt.struct.forEach(char => toDel.push(char));
  return remoteDelete(crdt, toDel);
}

function deleteEnd(crdt) {
  const start = Date.now();

  for(let i = crdt.struct.length - 1; i >= 0; i--) {
    crdt.handleLocalDelete(i);
  }

  const end = Date.now();
  return end - start;
}

function remoteDeleteEnd(crdt) {
  let toDel = [];
  crdt.struct.forEach(char => toDel.push(char));
  const reverseToDel = toDel.reverse();
  return remoteDelete(crdt, reverseToDel);
}

function remoteDelete(crdt, chars) {
  const start = Date.now();

  chars.forEach(char => crdt.handleRemoteDelete(char));

  const end = Date.now();
  return end - start;
}

function generateChars(numberOfOperations) {
  const structs = generateRemoteStructs(numberOfOperations);
  const charObjects = [];
  for (let i = 0; i < structs[0].length; i++) {
    structs.forEach(struct => charObjects.push(struct[i]));
  }
  return charObjects;
}

function generateRemoteStructs(numberOfOperations) {
  const remoteCRDTs = generateRemoteCRDTs(Math.log10(numberOfOperations));

  const numOfOps = numberOfOperations / remoteCRDTs.length;

  remoteCRDTs.forEach(crdt => insertRandom(crdt, numOfOps));

  return remoteCRDTs.map(crdt => crdt.struct);
}

function generateRemoteCRDTs(num) {
  let CRDTs = [];
  let crdt;
  for (let i = 0; i < num; i++) {
    crdt = new CRDT(mockController());
    CRDTs.push(crdt);
  }
  return CRDTs;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function avgIdLength(crdt) {
  const idArray = crdt.struct.map(char => char.position.map(id => id.digit).join(''));
  const digitLengthSum = idArray.reduce((acc, id) => { return acc + id.length }, 0);

  return Math.floor(digitLengthSum / idArray.length);
}

function avgPosLength(crdt) {
  const posArray = crdt.struct.map(char => char.position.length);
  const posLengthSum = posArray.reduce((acc, len) => { return acc + len }, 0);

  return Math.floor(posLengthSum / posArray.length);
}

function average(time, operations) {
  return time / operations;
}

function addPadding(value, cellSize) {
  value = String(value);

  if (value.length > cellSize) {
    value = value.slice(0, cellSize);
  }

  const padding = ((cellSize - value.length) / 2);
  return (' ').repeat(Math.floor(padding)) + value + (' ').repeat(Math.ceil(padding));
}

function addRowWithId(operations, crdt, func) {
  const totalTime = func(crdt, operations);
  const cell1 = addPadding(operations, CELL_1_SIZE);
  const cell2 = addPadding(totalTime, CELL_2_SIZE);
  const cell3 = addPadding(average(totalTime, operations), CELL_3_SIZE);
  const cell4 = addPadding(avgIdLength(crdt), CELL_4_SIZE);
  const cell5 = addPadding(avgPosLength(crdt), CELL_5_SIZE);

  return `|${cell1}|${cell2}|${cell3}|${cell4}|${cell5}|
${'-'.repeat(95)}`

}

function addRow(operations, crdt, func) {
  const totalTime = func(crdt, operations);
  const cell1 = addPadding(operations, CELL_1_SIZE);
  const cell2 = addPadding(totalTime, CELL_2_SIZE);
  const cell3 = addPadding(average(totalTime, operations), CELL_3_SIZE);

  return `|${cell1}|${cell2}|${cell3}|
${'-'.repeat(62)}`
}

function getTimestamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const date = now.getUTCDate();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();

  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}

export {
  addRow,
  addRowWithId,
  insertRandom,
  remoteInsertRandom,
  insertEnd,
  remoteInsertEnd,
  insertBeginning,
  remoteInsertBeginning,
  deleteRandom,
  remoteDeleteRandom,
  deleteEnd,
  remoteDeleteEnd,
  deleteBeginning,
  remoteDeleteBeginning,
  getTimestamp
};
