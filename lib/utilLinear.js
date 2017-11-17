import Char from './char';
import CRDT from './crdtLinear';
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

export {
  avgIdLength,
  average,
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
};
