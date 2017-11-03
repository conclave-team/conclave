const express = require('express');
const app = express();
const server = require('http').createServer(app);

app.use(express.static('public'));
app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  const host = req.protocol + '://' + req.get('host');
  const id = req.query.id ? req.query.id : 0;
  res.render('index', { id: id, host: host });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
