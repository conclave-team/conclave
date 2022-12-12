const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
  res.render('index', {title: 'Conclave'});
});

app.get('/peers', (req, res) => {
  res.render('peerDiscovery', {title: 'Active Peers'});
});

app.get('/about', (req, res) => {
  res.render('about', {title: 'About'});
});

app.get('/bots', (req, res) => {
  res.render('bots', {title: 'Talk to Bots'});
});

app.get('/idLength', (req, res) => {
  res.render('idGraph');
});

app.get('/opTime', (req, res) => {
  res.render('timeGraph');
})

app.get('/arraysGraph', (req, res) => {
  res.render('arraysGraph');
})

var srv = app.listen(port, () => {
	console.log('Listening on ', port)
})

/***** PeerServer *****/

const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(srv, {
  debug: true
});

app.use('/peerjs', peerServer);

/***** WebSocket Server *****/ 

const { uniqueNamesGenerator, animals, colors } = require('unique-names-generator');

// library for websocket
const WebSocket = require('ws');
const WSport = 8886;
var wss = new WebSocket.Server({ port: WSport });

var users = {}; // store the connection details

wss.on('listening', () => { console.log('WS is running on port', WSport); });

wss.on('connection', connection => {
	// sucessful connection
	connection.on('message', message => onMessage(connection, message));

	setName(connection);
	
    notifyPeers('peer-joined', connection.name)

    /* When socket connection is closed */
	connection.on('close', () => {
		if (connection.name) {
			delete users[connection.name];
		}
	});
});

function onMessage(sender, message) {
    // Try to parse message 
    try {
        message = JSON.parse(message);
    } catch (e) {
        return; // TODO: handle malformed JSON
    }

    switch (message.type) {
        case 'disconnect':
            leaveRoom(sender);
            break;
        case 'pong':
            send(sender, { type: 'ping' });
            break;
    }

    // relay message to recipient
    if (message.to && sender) {
        const recipient = users[message.to];
        delete message.to;
        // add sender id
        message.sender = sender.name;
        send(recipient, message);
        return;
    }
}

function leaveRoom(user) {
    delete users[user.name];
    
    notifyPeers('peer-left', user.name);
}

function notifyPeers(update, user) {
    for (const peer in users) {
    	send(users[peer], { type: update, peer: user});
        const otherPeers = [];
        for (const otherPeer in users) {
            if (otherPeer === peer) {
                continue;
            } else {
                otherPeers.push(otherPeer);
            }
        }
        send(users[peer], { type: 'peers', peers: otherPeers });
    }
}

function setName(connection) {
	const name = uniqueNamesGenerator({
        length: 2,
        separator: ' ',
        dictionaries: [colors, animals],
        style: 'capital'
    })

	// store the connection details
	users[name] = connection;
	connection.name = name;

	send(connection, {
        type: 'display-name',
        message: {
            displayName: connection.name
        }
    });
}

function send(conn, message) {
	conn.send(JSON.stringify(message));
}