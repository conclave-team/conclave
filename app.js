const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const PORT2 = process.env.PORT || 443;
const ExpressPeerServer = require('peer').ExpressPeerServer;
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');

const sslOptions = {
  key: fs.readFileSync('./key.key'),
  cert: fs.readFileSync('./crt.crt'),
  passphrase: 'sunny',
  requestCert: false,
  rejectUnauthorized: false
}

// http.createServer(app).listen(PORT, function () {
//   console.log(`Conclave is listening on port ${PORT}`);
// });

const server = https.createServer(sslOptions, app).listen(PORT2);

app.use(express.static('public'));
app.set('views', './views');
app.set('view engine', 'pug');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  const address = req.protocol + '://' + req.get('host');
  const [ host, port ] = req.get('host').split(':');
  const id = req.query.id ? req.query.id : 0;
  res.render('index', { id: id, host: host, address: address, port: port });
});

app.use('/peerjs', ExpressPeerServer(server, {debug:true}));
