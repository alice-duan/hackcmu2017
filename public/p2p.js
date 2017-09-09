"use strict";

var peer = new Peer({ key: "2nnnwv66dinhr529" });

console.log("peer data", peer);

const state = {};

peer.on("open", peerId => {
  console.log("My peer ID is: " + peerId);
  document.getElementById("id-here").innerHTML = peerId;

  state.id = peerId;
});

state.connections = {};
state.queue = [];
console.log("state, look back later", state);

// TODO: disconnect!?

state.initialized = false;

peer.on("connection", conn => {
  console.log("got connection: from " + conn.peer, conn);

  // connect back if needed
  const alreadyConnected = connectToPeer(conn.peer, true);

  // initialize new friends
  if (!alreadyConnected) {
    // TODO: setting metadata for initialization
    setTimeout(() => {
      console.log("delayed send... not sure why but this is necessary");
      state.connections[conn.peer].send({
        type: "init",
        content: {
          connections: Object.keys(state.connections)
        }
      });
    }, 500);
  }

  // Receive messages
  conn.on("data", data => {
    console.log("Received", data);

    switch (data.type) {
      case "init":
        // in case user tries to manually connect to everyone
        if (!state.initialized) {
          // try to connect to all existing connections
          data.content.connections
            .filter(peerId => peerId !== state.id)
            .forEach(peerId => connectToPeer(peerId));
          state.initialized = true;
        }
        break;
      case "queue-add":
        break;
      case "queue-remove":
        break;
      case "queue-reorder":
        break;
      case "message":
        addChatMessage(conn.peer + ": " + data.content);
        break;
      default:
        console.error("Unknown data type " + data.type);
    }
  });
});

// DOM interface
function connect() {
  const peerId = document.getElementById("peerId").value;

  connectToPeer(peerId);
}

function send() {
  Object.values(state.connections).forEach(conn => {
    const { value } = document.getElementById("message");

    conn.send({ type: "message", content: value });

    addChatMessage("you: " + value);
  });
}

// Returns whether peer already existed
const connectToPeer = (peerId, hitback) => {
  if (state.connections[peerId] === undefined) {
    const conn = peer.connect(peerId);

    if (hitback) {
      addChatMessage(conn.peer + " connected!");
    } else {
      addChatMessage("Connected to " + peerId + "!"); // TODO: server messages should be different
    }
    addConnection(peerId);

    state.connections[peerId] = conn;

    return false;
  }
  return true;
};

// add msg to chat box
const addChatMessage = msg => append("chat", msg);

// add peer name to connections list
const addConnection = name => append("connections-here", name);

const append = (id, msg, elem = "p") => {
  const element = document.createElement(elem);
  element.textContent = msg;
  document.getElementById(id).appendChild(element);
};
