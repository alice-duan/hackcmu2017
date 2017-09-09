"use strict";

var peer = new Peer({ key: "2nnnwv66dinhr529" });

const state = {
  connections: {},
  queue: [],
  initialized: false
};
console.log("state:", state);

peer.on("open", peerId => {
  document.getElementById("id-here").innerHTML = peerId;

  state.id = peerId;
});

const playMedia = queueMedia => {
  if (queueMedia.content.type === "audio") {
    useAudio(queueMedia);
  } else {
    useVideo(queueMedia);
  }
};

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

    if (skipped === undefined) {
      addChatMessage("No media to skip");
      return;
    }

    addChatMessage(message.origin + " skipped " + skipped.name);
    playMedia(skipped);
  },
  queueNext(message) {
    // when current media is over
    const next = state.queue.pop();

    if (next === undefined) {
      addChatMessage("No media left to play");
      return;
    }

    playMedia(next);
  },
  queueAdd(message) {
    message.content.content.file = new Blob([message.content.content.file], {
      type: message.content.content.filetype
    });
    state.queue.push(message.content);
    addChatMessage(message.origin + " added " + message.content.name + " to the queue");
    addQueueRow(message.content);

    if (state.queue.length === 1) {
      playMedia(message.content);
    }
  },
  queueRemove(message) {
    const index = state.queue.findIndex(elem => elem.name === message.content.name);

    if (state.queue[index]) {
      addChatMessage(message.content + " removed " + state.queue[index].name + " from the queue");
      state.queue.splice(index, 1);
    }

    const row = document.getElementById(message.content.id);
    row.parentNode.removeChild(row)
  },
  chatMessage(message) {
    addChatMessage(message.origin + ": " + message.content);
  },
  play(message) {
    addChatMessage(message.origin + " resumed");
    state.currentMedia.currentTime = message.content.currentTime;
    state.currentMedia.play();
  },
  pause(message) {
    addChatMessage(message.origin + " paused");
    state.currentMedia.currentTime = message.content.currentTime;
    state.currentMedia.pause();
  },
  seek(message) {
    addChatMessage(message.origin + " changed the time to " + message.content.time);
    state.currentMedia.currentTime = message.content.time;
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

      // TODO: send queue and send waiting
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

  conn.on("close", () => {
    addChatMessage(conn.peer + " disconnected");

    delete state.connections[conn.peer];
  });

  conn.on("error", err => console.error(err));
});

peer.on("error", error => console.error(error));

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

function addQueue(file, fileType) {
  const content = {
    id: Date.now(),
    name: file.name,
    type: "file",
    content: {
      type: fileType,
      file: new Blob([file], { type: file.type }),
      filetype: file.type,
      confirmed: 0
    }
  };
  messageAllPeers("queueAdd", content);
  messageHandler.queueAdd({ origin: "you", content });
}

function removeQueue(event) {
  const content = {
    name: event.target.parentNode.childNodes[0].innerHTML,
    id: event.target.parentNode.parentNode.id
  }
  messageAllPeers("queueRemove", content);
  messageHandler.queueRemove({ origin: "you", content });
}

function skip() {
  messageAllPeers("skip");
  messageHandler.skip();
}

function play() {
  const content = {
    currentTime: state.currentMedia.currentTime
  };
  messageAllPeers("play", content);
  addChatMessage("you played");
}

function pause() {
  const content = {
    currentTime: state.currentMedia.currentTime
  };
  messageAllPeers("pause", content);
  addChatMessage("you paused");
}

function ended() {
  messageAllPeers("queueNext");
  messageHandler.queueNext();
}

function seek() {
  const content = {
    time: state.currentMedia.currentTime
  };
  messageAllPeers("seek", content);
  addChatMessage("you changed the time to " + content.time);
}

const messageAllPeers = (type, content) => {
  Object.values(state.connections).forEach(c => c.send({ type, origin: state.id, content }));
};

// Returns whether peer already existed
const connectToPeer = (peerId, hitback) => {
  if (state.connections[peerId] === undefined) {
    const conn = peer.connect(peerId);

    if (hitback) {
      addAdminChat(conn.peer + " connected");
    } else {
      addAdminChat("Connected to " + peerId);
    }
    addConnection(peerId);

    state.connections[peerId] = conn;

    return false
  }
  return true;
};

document.addEventListener(
  "DOMContentLoaded",
  () => {
    document.getElementById("video-input").addEventListener("change", function(event) {
      // make sure a file was actually selected
      if (this.files[0]) {
        addQueue(this.files[0], "video");
      }
    });
    document.getElementById("audio-input").addEventListener("change", function(event) {
      // make sure a file was actually selected
      if (this.files[0]) {
        addQueue(this.files[0], "audio");
      }
    });
  },
  false
);

// Replace media player with video
const useVideo = media => {
  const mediaBox = document.getElementById("media");
  mediaBox.innerHTML = "";

  const video = document.createElement("video");
  video.id = "v";
  video.controls = true;
  video.addEventListener("play", play);
  video.addEventListener("pause", pause);
  video.addEventListener("seeked", seek);
  video.addEventListener("ended", ended);

  video.src = URL.createObjectURL(media.content.file);

  mediaBox.appendChild(video);

  state.currentMedia = video;

  document.getElementById("video-input").hidden = true;
  document.getElementById("video-button").hidden = false;
};

// Replace media player with audio
const useAudio = media => {
  const mediaBox = document.getElementById("media");
  mediaBox.innerHTML = "";

  const audio = document.createElement("audio");
  audio.id = "a";
  audio.controls = true;
  audio.addEventListener("play", play);
  audio.addEventListener("pause", pause);
  audio.addEventListener("seeked", seek);
  audio.addEventListener("ended", ended);

  audio.src = URL.createObjectURL(media.content.file);

  mediaBox.appendChild(audio);

  state.currentMedia = audio;

  document.getElementById("audio-input").hidden = true;
  document.getElementById("audio-button").hidden = false;
};

// add msg to chat box
const addChatMessage = msg => {
  append("chat", msg);
  const objDiv = document.getElementById("chat");
  objDiv.scrollTop = objDiv.scrollHeight;
};

// add system message to chat box
const addAdminChat = msg => {
  append("chat", msg, "p", true);
  var objDiv = document.getElementById("chat");
  objDiv.scrollTop = objDiv.scrollHeight;
};

const addQueueRow = content => {
  const row = document.createElement("tr");
  row.id = content.id;

  const removeButtonCell = document.createElement("td");
  removeButtonCell.width = "35px";
  const removeButton = document.createElement("input");
  removeButton.type = "button";
  removeButton.className = "btn btn-info";
  removeButton.value = "Remove";
  removeButton.onclick = function(event) {
    removeQueue(event);
  };

  removeButtonCell.appendChild(removeButton);

  const nameCell = document.createElement("td");
  nameCell.innerHTML = content.name;

  row.appendChild(nameCell);
  row.appendChild(removeButtonCell);

  document.getElementById("queue").appendChild(row);
};

// add peer name to connections list
const addConnection = name => append("connections-here", name);

const append = (id, msg, elem = "p", admin = false) => {
  const element = document.createElement(elem);
  element.textContent = msg;
  if (admin) {
    element.setAttribute("style", "color:#0033cc");
  }
  document.getElementById(id).appendChild(element);
};

function showAudioBrowser() {
  document.getElementById("audio-input").hidden = false;
  document.getElementById("audio-button").hidden = true;

  document.getElementById("video-input").hidden = true;
  document.getElementById("video-button").hidden = false;
}

function showVideoBrowser() {
  document.getElementById("video-input").hidden = false;
  document.getElementById("video-button").hidden = true;

  document.getElementById("audio-input").hidden = true;
  document.getElementById("audio-button").hidden = false;
}
