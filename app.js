const express = require('express');
const app = express();
const server = require('http').createServer(app);
let listener;

app.use(express.static('public'));
app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  let proto = req.protocol;

  if (req.get('host').split(":")[0] !== 'localhost') {
    proto = proto + 's';
  }
  const host = proto + '://' + req.get('host');
  const id = req.query.id ? req.query.id : 0;
  res.render('index', { id: id, host: host });
});

app.get('/demo', function (req, res) {
  res.render('demo');
});

listener = app.listen(process.env.PORT || 3000, function (port) {
  console.log(`Conclave is listening on port ${listener.address().port}`);
});
