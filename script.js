// DOM Elements
const modal = document.getElementById("username-modal");
const usernameForm = document.getElementById("username-form");
const usernameInput = document.getElementById("username-input");
const currentUserAvatar = document.getElementById("current-user-avatar");
const currentUserName = document.getElementById("current-user-name");
const shareLinkInput = document.getElementById("share-link");
const copyBtn = document.getElementById("copy-btn");
const statusText = document.getElementById("connection-status");

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");

let currentUser = localStorage.getItem("p2p_username") || "";
let peer = null;
let connections = []; // Stores peer connections if host
let hostConn = null;  // Connection to host if client
let isHost = false;

// Color helper
function getUserColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - color.length) + color;
}

function sanitizeHTML(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

function setupUser(username) {
  currentUser = username;
  localStorage.setItem("p2p_username", username);
  currentUserName.textContent = username;
  currentUserAvatar.textContent = username.charAt(0).toUpperCase();
  currentUserAvatar.style.backgroundColor = getUserColor(username);
  modal.style.display = "none";
}

if (currentUser) setupUser(currentUser);
else modal.style.display = "flex";

usernameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = usernameInput.value.trim();
  if (val) setupUser(val);
});

// Local Storage History
function loadLocalMessages() {
  const saved = JSON.parse(localStorage.getItem("p2p_chat_history") || "[]");
  messageContainer.innerHTML = "";
  saved.forEach(renderMessage);
}

function saveMessageLocally(msg) {
  const saved = JSON.parse(localStorage.getItem("p2p_chat_history") || "[]");
  saved.push(msg);
  localStorage.setItem("p2p_chat_history", JSON.stringify(saved));
}

// PeerJS Networking Setup
const urlParams = new URLSearchParams(window.location.search);
const targetRoom = urlParams.get("room");

if (!targetRoom) {
  // HOST MODE
  isHost = true;
  peer = new Peer();

  peer.on("open", (id) => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${id}`;
    shareLinkInput.value = inviteUrl;
    statusText.innerHTML = `<span class="status-dot"></span> Hosting Room`;
  });

  peer.on("connection", (conn) => {
    connections.push(conn);
    conn.on("data", (data) => {
      handleIncomingMessage(data);
      // Broadcast message to all other connected peers
      connections.forEach((c) => {
        if (c.peer !== conn.peer && c.open) c.send(data);
      });
    });
  });
} else {
  // CLIENT MODE
  isHost = false;
  peer = new Peer();

  peer.on("open", () => {
    hostConn = peer.connect(targetRoom);
    shareLinkInput.value = window.location.href;

    hostConn.on("open", () => {
      statusText.innerHTML = `<span class="status-dot"></span> Connected`;
    });

    hostConn.on("data", (data) => {
      handleIncomingMessage(data);
    });

    hostConn.on("close", () => {
      statusText.innerHTML = `<span class="status-dot" style="background:red"></span> Disconnected`;
    });
  });
}

// Send Message
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  const msg = {
    user: currentUser,
    text: text,
    timestamp: Date.now()
  };

  saveMessageLocally(msg);
  renderMessage(msg);

  if (isHost) {
    connections.forEach((c) => {
      if (c.open) c.send(msg);
    });
  } else if (hostConn && hostConn.open) {
    hostConn.send(msg);
  }

  messageInput.value = "";
});

function handleIncomingMessage(msg) {
  saveMessageLocally(msg);
  renderMessage(msg);
}

function renderMessage(msg) {
  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const userColor = getUserColor(msg.user || "Guest");
  const initial = msg.user ? msg.user.charAt(0).toUpperCase() : "?";

  const msgEl = document.createElement("div");
  msgEl.className = "message-item";
  msgEl.innerHTML = `
    <div class="avatar" style="background-color: ${userColor}">${initial}</div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-author" style="color: ${userColor}">${sanitizeHTML(msg.user)}</span>
        <span class="message-time">${timeStr}</span>
      </div>
      <div class="message-text">${sanitizeHTML(msg.text)}</div>
    </div>
  `;

  messageContainer.appendChild(msgEl);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Copy Invite Link
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(shareLinkInput.value);
  copyBtn.innerText = "Copied!";
  setTimeout(() => (copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy'), 2000);
});

loadLocalMessages();
