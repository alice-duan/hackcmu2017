"use strict";

var peer = new Peer({ key: "2nnnwv66dinhr529" });

console.log("peer data", peer);

peer.on("open", id => {
  console.log("My peer ID is: " + id);
});

peer.on("connection", conn => {
  console.log("got connection: from " + conn.peer, conn);

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
function connect() {
  console.log("trying to connect to", document.getElementById("peerId").value);
  const conn = peer.connect(document.getElementById("peerId").value);
  console.log("connection:", conn);

  connections.push(conn);
}

function send() {
  connections.forEach(conn => {
    conn.send(document.getElementById("message").value);
  });
}
