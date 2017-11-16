const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
// const server = require('http').createServer(app);
let listener;

app.use(express.static('public'));
app.set('views', './views');
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/demo', function (req, res) {
  res.render('demo');
});

var srv = app.listen(port, function() {
	console.log('Listening on '+port)
})

app.use('/peerjs', require('peer').ExpressPeerServer(srv, {
	debug: true
}))
