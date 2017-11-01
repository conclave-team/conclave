import Editor from './editor';

const editor1 = new Editor(document.querySelector('#edit-1'));
const editor2 = new Editor(document.querySelector('#edit-2'));

editor1.on('localInsert', char => {
  editor2.model.insertChar(char);
});

editor2.on('localInsert', char => {
  editor1.model.insertChar(char);
});

editor1.on('localDelete', char => {
  editor2.model.deleteChar(char);
});

editor2.on('localDelete', char => {
  editor1.model.deleteChar(char);
});
