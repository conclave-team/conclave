const peer = new Peer({key: 'mgk9l45fu1gfzuxr', debug: 3});
let conns = [];

peer.on('open', function(id) {
  document.getElementById('myId').append(id);
});

peer.on('error', function(err) {
  console.log(err);
});

document.getElementById('connect').onclick = (() => {
  const peerId = document.getElementById('idText').value;
  const conn = peer.connect(peerId);
  conns.push(conn);
  document.getElementById('peerId').append(conn.peer);
});

document.getElementById('send').onclick = (() => {
  conns.forEach((conn) => {
    conn.send(document.getElementById('dataText').value);
  });
});

peer.on('connection', function(connection) {
  console.log(peer.connections)
  if (conns.length < Object.keys(peer.connections).length) {
    connection.on('open', function() {
      const conn = peer.connect(Object.keys(peer.connections)[0])
      conns.push(conn);
      document.getElementById('peerId').append(conn.peer);
    });
  }

  connection.on('data', function(data) {
    document.getElementById('received').innerHTML += data;
  });
});
