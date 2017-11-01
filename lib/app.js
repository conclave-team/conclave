import Editor from './editor';
import $ from 'jquery';

const editor = new Editor($('#write'));

editor.$editor.keydown(e => {
  const char = e.key;
  let index, charObj;
  
  if (char !== 'Backspace' && !char.match(/^(\w|\W)$/)) {
    return false;
  }

  if (char === 'Backspace') {

    index = editor.$editor.val().length - 1;
    charObj = editor.model.localDelete(index);

  } else {

    index = editor.$editor.val().length;
    charObj = editor.model.localInsert(char, index);

  }

  console.log(index, charObj);
  $('#read').val(editor.model.text);
});
