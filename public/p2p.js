"use strict";

var peer = new Peer({ key: "2nnnwv66dinhr529" });

const state = {
  connections: {},
  queue: [],
  initialized: false
};
console.log("state:", state);

peer.on("open", peerId => {
  console.log("My peer ID is: " + peerId);
  document.getElementById("id-here").innerHTML = peerId;

  state.id = peerId;
});

// TODO: disconnect!?

const messageHandler = {
  init(message) {
    // in case user tries to manually connect to everyone
    if (!state.initialized) {
      // try to connect to all existing connections
      message.content.connections
        .filter(peerId => peerId !== state.id)
        .forEach(peerId => connectToPeer(peerId));
      state.initialized = true;
    }
  },
  queueSkip(message) {
    // when someone decides to skip the current
    const skipped = state.queue.pop();
    if (skipped !== undefined) {
      addChatMessage(message.origin + " skipped " + skipped.name);
    }
  },
  queueNext(message) {
    // when current media is over
    state.queue.pop();
  },
  queueAdd(message) {
    state.queue.push(message.content);
    addChatMessage(message.origin + " added " + message.content.name + " to the queue");
    if (message.content.type === "file") {
      // TODO: trigger open file prompt
    }
  },
  queueRemove(message) {
    // TODO: maybe allow for race conditions and just send index
    const index = state.queue.findIndex(elem => elem.name === message.content);

    if (state.queue[index]) {
      addChatMessage(message.content + " removed " + state.queue[index].name + " from the queue");
      state.queue.splice(index, 1);
    }
  },
  queueReorder(message) {},
  queueReject(message) {},
  chatMessage(message) {
    addChatMessage(message.origin + ": " + message.content);
  }
};

peer.on("connection", conn => {
  console.log("got connection: from " + conn.peer, conn);

  // connect back if needed
  const alreadyConnected = connectToPeer(conn.peer, true);

  // initialize new friends
  if (!alreadyConnected) {
    // TODO: setting metadata for whether someone is initialized
    setTimeout(() => {
      console.log("delayed send... not sure why but this is necessary");
      state.connections[conn.peer].send({
        type: "init",
        origin: state.id,
        content: {
          connections: Object.keys(state.connections)
        }
      });
    }, 500);
  }

  // Receive messages
  conn.on("data", message => {
    if (typeof message.type !== "string" || typeof message.origin !== "string") {
      console.error("Invalid message", message);
      return;
    }

    console.log("Received validly structured message: ", message);

    if (messageHandler[message.type]) {
      messageHandler[message.type](message);
      return;
    }

    console.error("Unknown message type " + message.type, message);
  });
});

// DOM interface
function connect() {
  const peerId = document.getElementById("peerId").value;

  connectToPeer(peerId);
  document.getElementById("peerId").value = "";
}

// DOM interface
function sendChatMessage() {
  const { value } = document.getElementById("message");
  messageAllPeers("chatMessage", value);
  messageHandler.chatMessage({ origin: "you", content: value });
  document.getElementById("message").value = "";
}

function addQueue() {
  const content = {
    name: "hardcode"
  };
  messageAllPeers("queueAdd", content);
  messageHandler.queueAdd({ origin: "you", content });
}

function removeQueue() {
  const content = {
    name: "hardcode"
  };
  messageAllPeers("queueRemove", content);
  messageHandler.queueRemove({ origin: "you", content });
}

function skip() {
  messageAllPeers("skip");
  messageHandler.skip();
}

// TODO: reordering queue will be harder

const messageAllPeers = (type, content) => {
  Object.values(state.connections).forEach(c => c.send({ type, origin: state.id, content }));
};

// Returns whether peer already existed
const connectToPeer = (peerId, hitback) => {
  if (state.connections[peerId] === undefined) {
    const conn = peer.connect(peerId);

    if (hitback) {
      addAdminChat(conn.peer + " connected!");
    } else {
      addAdminChat("Connected to " + peerId + "!");
    }
    addConnection(peerId);

    state.connections[peerId] = conn;

    return false;
  }
  return true;
};

// add msg to chat box
const addChatMessage = msg => {
  append("chat", msg);
  var objDiv = document.getElementById("chat");
  objDiv.scrollTop = objDiv.scrollHeight;
}

const addAdminChat = msg => {
  append("chat", msg, "p", true);
  var objDiv = document.getElementById("chat");
  objDiv.scrollTop = objDiv.scrollHeight;
};

// add peer name to connections list
const addConnection = name => append("connections-here", name);

const append = (id, msg, elem = "p", admin = false) => {
  const element = document.createElement(elem);
  element.textContent = msg;
  if (admin) {
     element.setAttribute('style', 'color:#0033cc');
  }
  document.getElementById(id).appendChild(element);
};

const remove = (id) => {
  var elem = document.getElementById(id);
  return elem.parentNode.removeChild(elem);
}
