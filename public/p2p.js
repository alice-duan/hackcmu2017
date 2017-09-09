"use strict";

var peer = new Peer({ key: "2nnnwv66dinhr529" });

console.log("peer data", peer);

peer.on("open", id => {
  console.log("My peer ID is: " + id);
  document.getElementById("id-here").innerHTML = id;
});

peer.on("connection", conn => {
  console.log("got connection: from " + conn.peer, conn);

  const newP = document.createElement("p");
  newP.textContent = conn.peer;
  document.getElementById("connections-here").appendChild(newP);

  // Receive messages
  conn.on("data", data => {
    console.log("Received", data);

    const newP = document.createElement("p");
    newP.textContent = data;
    document.getElementById("chat").appendChild(newP);
  });

  // Send messages
  conn.send("Hello!");
});

const connections = [];
//connects to peer, updates connections displayed, and
//connects to all of the peer's connections
function connect() {
  const peerId = document.getElementById("peerId").value

  console.log("trying to connect to", peerId);
  const conn = peer.connect(peerId);
  console.log("connection:", conn);

  const newP = document.createElement("p");
  newP.textContent = peerId;
  document.getElementById("connections-here").appendChild(newP);

  connections.push(conn);
}

function send() {
  connections.forEach(conn => {
    const data = document.getElementById("message").value

    conn.send(data);

    const newP = document.createElement("p");
    newP.textContent = data;
    document.getElementById("chat").appendChild(newP);
  });
}
