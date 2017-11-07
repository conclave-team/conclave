const CELL_1_SIZE = 19;
const CELL_2_SIZE = 23;
const CELL_3_SIZE = 22;
const CELL_4_SIZE = 18;

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

function deleteBeginning(crdt) {
  const start = Date.now();

  for(let i = crdt.struct.length - 1; i >= 0; i--) {
    crdt.handleLocalDelete(0);
  }

  const end = Date.now();
  return end - start;
}

function deleteEnd(crdt) {
  const start = Date.now();

  for(let i = crdt.struct.length - 1; i >= 0; i--) {
    crdt.handleLocalDelete(i);
  }

  const end = Date.now();
  return end - start;
}

function avgIdLength(crdt) {
  const convertCharIntoDigit = (char) => char.position.map(id => id.digit).join('');
  const idArray = crdt.struct.map(convertCharIntoDigit);
  const digitLengthSum = idArray.reduce((acc, id) => { return acc + id.length }, 0);
  
  return Math.floor(digitLengthSum / idArray.length);
}

function reset(crdt) {
  crdt.struct = [];
  crdt.counter = 0;
  crdt.text = '';
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

function addInsertRow(operations, crdt, func) {
  const totalTime = func(crdt, operations);
  const cell1 = addPadding(operations, CELL_1_SIZE);
  const cell2 = addPadding(totalTime, CELL_2_SIZE);
  const cell3 = addPadding(average(totalTime, operations), CELL_3_SIZE);
  const cell4 = addPadding(avgIdLength(crdt), CELL_4_SIZE);

  return `|${cell1}|${cell2}|${cell3}|${cell4}|
${'-'.repeat(87)}`
}

function addDeleteRow(operations, crdt, func) {
  const totalTime = func(crdt, operations);
  const cell1 = addPadding(operations, CELL_1_SIZE);
  const cell2 = addPadding(totalTime, CELL_2_SIZE);
  const cell3 = addPadding(average(totalTime, operations), CELL_3_SIZE);

  return `|${cell1}|${cell2}|${cell3}|
${'-'.repeat(68)}`
}

export {
  addInsertRow,
  addDeleteRow,
  insertRandom,
  insertEnd,
  insertBeginning,
  deleteRandom,
  deleteEnd,
  deleteBeginning
};
