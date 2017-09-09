"use strict";

var peer = new Peer({ key: "2nnnwv66dinhr529" });

console.log("peer data", peer);

let id;
peer.on("open", peerId => {
  console.log("My peer ID is: " + peerId);
  document.getElementById("id-here").innerHTML = peerId;

  id = peerId;
});

const connections = [];

// TODO: disconnect!?

peer.on("connection", conn => {
  console.log("got connection: from " + conn.peer, conn);

  // connect back if not already connected
  if (!connections.find(c => c.peer === conn.peer)) {
    connections.push(peer.connect(conn.peer));
    addChatMessage(conn.peer + " connected!");
    console.log("Connected back to " + conn.peer);
  }

  // Receive messages
  conn.on("data", data => {
    console.log("Received", data);

    switch (data.type) {
      default:
        addChatMessage(conn.peer + ": " + data.content);
        break;
    }
  });

  // Send messages
  //conn.send("Hello!");
});

//connects to peer, updates connections displayed, and
//connects to all of the peer's connections
function connect() {
  const peerId = document.getElementById("peerId").value;

  console.log("trying to connect to", peerId);
  const conn = peer.connect(peerId);
  console.log("connection:", conn);

  addChatMessage("Connected to " + conn.peer + "!"); // TODO: server messages should be different
  addConnection(conn.peer);

  connections.push(conn);
}

function send() {
  const { value } = document.getElementById("message");
  addChatMessage("you: " + value);
  connections.forEach(conn => {
    conn.send({ type: "message", content: value });
  });
}

// add msg to chat box
const addChatMessage = msg => {
  append("chat", msg);
  var objDiv = document.getElementById("chat");
  objDiv.scrollTop = objDiv.scrollHeight;
}

// add peer name to connections list
const addConnection = name => append("connections-here", name);

const append = (id, msg, elem = "p") => {
  const element = document.createElement(elem);
  element.textContent = msg;
  document.getElementById(id).appendChild(element);
};

setInterval(() => {
  console.log("Current connections:", connections.slice(0));
}, 5000);
