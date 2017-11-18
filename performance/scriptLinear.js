import CRDT from '../lib/crdtLinear';
import * as Util from './utilLinear';
import fs from 'fs';
import UUID from 'uuid/v1';

const logPath = 'performance/logs';

export function mockController() {
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

const crdt1 = new CRDT(mockController());
const crdt2 = new CRDT(mockController());
const crdt3 = new CRDT(mockController());
const crdt4 = new CRDT(mockController());
const crdt5 = new CRDT(mockController());

[crdt1, crdt2, crdt3, crdt4, crdt5].forEach(crdt => {
  crdt.insertText = function() {};
  crdt.deleteText = function() {};
});

let table = `
#### PERFORMANCE METRICS (Linear)
Base: ${crdt1.base} | Boundary: ${crdt1.boundary} | Strategy: ${crdt1.strategy}
================================================================================================

## RANDOM
---------

# LOCAL INSERTIONS
-----------------------------------------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time | Avg. ID Length | Avg. Position |
|                 |  (in milliseconds) |  (in milliseconds)  |                |    Length     |
-----------------------------------------------------------------------------------------------

${Util.addRowWithId(10, crdt1, Util.insertRandom)}
${Util.addRowWithId(100, crdt2, Util.insertRandom)}
${Util.addRowWithId(1000, crdt3, Util.insertRandom)}
${Util.addRowWithId(10000, crdt4, Util.insertRandom)}
${Util.addRowWithId(100000, crdt5, Util.insertRandom)}

# LOCAL DELETIONS
--------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time |
|                 |  (in milliseconds) |  (in milliseconds)  |
--------------------------------------------------------------
${Util.addRow(10, crdt1, Util.deleteRandom)}
${Util.addRow(100, crdt2, Util.deleteRandom)}
${Util.addRow(1000, crdt3, Util.deleteRandom)}
${Util.addRow(10000, crdt4, Util.deleteRandom)}
${Util.addRow(100000, crdt5, Util.deleteRandom)}

# REMOTE INSERTIONS
--------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time |
|                 |  (in milliseconds) |  (in milliseconds)  |
--------------------------------------------------------------
${Util.addRow(10, crdt1, Util.remoteInsertRandom)}
${Util.addRow(100, crdt2, Util.remoteInsertRandom)}
${Util.addRow(1000, crdt3, Util.remoteInsertRandom)}
${Util.addRow(10000, crdt4, Util.remoteInsertRandom)}
${Util.addRow(100000, crdt5, Util.remoteInsertRandom)}

# REMOTE DELETIONS
--------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time |
|                 |  (in milliseconds) |  (in milliseconds)  |
--------------------------------------------------------------
${Util.addRow(10, crdt1, Util.remoteDeleteRandom)}
${Util.addRow(100, crdt2, Util.remoteDeleteRandom)}
${Util.addRow(1000, crdt3, Util.remoteDeleteRandom)}
${Util.addRow(10000, crdt4, Util.remoteDeleteRandom)}
${Util.addRow(100000, crdt5, Util.remoteDeleteRandom)}


## AT THE BEGINNING
-------------------

# LOCAL INSERTIONS
-----------------------------------------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time | Avg. ID Length | Avg. Position |
|                 |  (in milliseconds) |  (in milliseconds)  |                |    Length     |
-----------------------------------------------------------------------------------------------
${Util.addRowWithId(10, crdt1, Util.insertBeginning)}
${Util.addRowWithId(100, crdt2, Util.insertBeginning)}
${Util.addRowWithId(1000, crdt3, Util.insertBeginning)}
${Util.addRowWithId(10000, crdt4, Util.insertBeginning)}
${Util.addRowWithId(100000, crdt5, Util.insertBeginning)}

# LOCAL DELETIONS
--------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time |
|                 |  (in milliseconds) |  (in milliseconds)  |
--------------------------------------------------------------
${Util.addRow(10, crdt1, Util.deleteBeginning)}
${Util.addRow(100, crdt2, Util.deleteBeginning)}
${Util.addRow(1000, crdt3, Util.deleteBeginning)}
${Util.addRow(10000, crdt4, Util.deleteBeginning)}
${Util.addRow(100000, crdt5, Util.deleteBeginning)}

# REMOTE INSERTIONS
--------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time |
|                 |  (in milliseconds) |  (in milliseconds)  |
--------------------------------------------------------------
${Util.addRow(10, crdt1, Util.remoteInsertBeginning)}
${Util.addRow(100, crdt2, Util.remoteInsertBeginning)}
${Util.addRow(1000, crdt3, Util.remoteInsertBeginning)}
${Util.addRow(10000, crdt4, Util.remoteInsertBeginning)}
${Util.addRow(100000, crdt5, Util.remoteInsertBeginning)}

# REMOTE DELETIONS
--------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time |
|                 |  (in milliseconds) |  (in milliseconds)  |
--------------------------------------------------------------
${Util.addRow(10, crdt1, Util.remoteDeleteBeginning)}
${Util.addRow(100, crdt2, Util.remoteDeleteBeginning)}
${Util.addRow(1000, crdt3, Util.remoteDeleteBeginning)}
${Util.addRow(10000, crdt4, Util.remoteDeleteBeginning)}
${Util.addRow(100000, crdt5, Util.remoteDeleteBeginning)}


## AT THE END
-------------

# LOCAL INSERTIONS
-----------------------------------------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time | Avg. ID Length | Avg. Position |
|                 |  (in milliseconds) |  (in milliseconds)  |                |    Length     |
-----------------------------------------------------------------------------------------------
${Util.addRowWithId(10, crdt1, Util.insertEnd)}
${Util.addRowWithId(100, crdt2, Util.insertEnd)}
${Util.addRowWithId(1000, crdt3, Util.insertEnd)}
${Util.addRowWithId(10000, crdt4, Util.insertEnd)}
${Util.addRowWithId(100000, crdt5, Util.insertEnd)}

# LOCAL DELETIONS
--------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time |
|                 |  (in milliseconds) |  (in milliseconds)  |
--------------------------------------------------------------
${Util.addRow(10, crdt1, Util.deleteEnd)}
${Util.addRow(100, crdt2, Util.deleteEnd)}
${Util.addRow(1000, crdt3, Util.deleteEnd)}
${Util.addRow(10000, crdt4, Util.deleteEnd)}
${Util.addRow(100000, crdt5, Util.deleteEnd)}

# REMOTE INSERTIONS
--------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time |
|                 |  (in milliseconds) |  (in milliseconds)  |
--------------------------------------------------------------
${Util.addRow(10, crdt1, Util.remoteInsertEnd)}
${Util.addRow(100, crdt2, Util.remoteInsertEnd)}
${Util.addRow(1000, crdt3, Util.remoteInsertEnd)}
${Util.addRow(10000, crdt4, Util.remoteInsertEnd)}
${Util.addRow(100000, crdt5, Util.remoteInsertEnd)}

# REMOTE DELETIONS
--------------------------------------------------------------
| # of Operations | Total Execute Time | Avg. Operation Time |
|                 |  (in milliseconds) |  (in milliseconds)  |
--------------------------------------------------------------
${Util.addRow(10, crdt1, Util.remoteDeleteEnd)}
${Util.addRow(100, crdt2, Util.remoteDeleteEnd)}
${Util.addRow(1000, crdt3, Util.remoteDeleteEnd)}
${Util.addRow(10000, crdt4, Util.remoteDeleteEnd)}
${Util.addRow(100000, crdt5, Util.remoteDeleteEnd)}
`;

fs.writeFile(`${logPath}/${Util.getTimestamp()}.log`, table, function(err) {
  if (err) {
    return console.log(err);
  }

  console.log(`Results saved to ${logPath}`)
})
