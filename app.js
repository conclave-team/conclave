const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  res.render('index', {title: 'Conclave'});
});

app.get('/about', function (req, res) {
  res.render('about', {title: 'About'});
});

app.get('/bots', function(req, res) {
  res.render('bots', {title: 'Talk to Bots'});
});

app.get('/idLength', function (req, res) {
  res.render('idGraph');
});

app.get('/opTime', function (req, res) {
  res.render('timeGraph');
})

app.get('/arraysGraph', function (req, res) {
  res.render('arraysGraph');
})

var srv = app.listen(port, function() {
	console.log('Listening on '+port)
})

app.use('/peerjs', require('peer').ExpressPeerServer(srv, {
	debug: true
}))
