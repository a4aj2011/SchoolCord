"use strict";

/*
  LinkChat
  ----------
  No database
  No accounts
  No saved messages
  Browser-to-browser messaging with WebRTC
*/

const $ = (id) => document.getElementById(id);

/* =========================
   APP STATE
========================= */

const state = {
  peer: null,
  channel: null,
  connected: false,
  isHost: false,
  myName: "You",
  friendName: "Friend",
  unread: 0
};

const rtcConfig = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
};

/* =========================
   ELEMENTS
========================= */

const messages = $("messages");
const messageForm = $("messageForm");
const messageInput = $("messageInput");
const sendBtn = $("sendBtn");
const typingIndicator = $("typingIndicator");

const friendItem = $("friendItem");
const friendNameElement = $("friendName");
const friendStatus = $("friendStatus");
const friendAvatar = $("friendAvatar");

const headerName = $("headerName");
const headerStatus = $("headerStatus");
const headerAvatar = $("headerAvatar");

const myNameLabel = $("myNameLabel");
const myAvatar = $("myAvatar");
const unreadBadge = $("unreadBadge");

const modalBackdrop = $("modalBackdrop");
const modalTitle = $("modalTitle");
const modalDescription = $("modalDescription");
const modalStatus = $("modalStatus");

const choiceStep = $("choiceStep");
const hostStep = $("hostStep");
const guestStep = $("guestStep");

const offerCode = $("offerCode");
const answerCode = $("answerCode");
const incomingOffer = $("incomingOffer");
const answerOutput = $("answerOutput");

const profileBackdrop = $("profileBackdrop");
const nameInput = $("nameInput");

const infoBackdrop = $("infoBackdrop");

/* =========================
   BASIC HELPERS
========================= */

function initials(name) {
  const clean = String(name || "").trim();

  if (!clean) {
    return "?";
  }

  return clean.charAt(0).toUpperCase();
}

function timeString() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function setStatusMessage(text, error = true) {
  modalStatus.textContent = text;

  if (error) {
    modalStatus.style.color = "var(--danger)";
  } else {
    modalStatus.style.color = "var(--green)";
  }
}

function clearStatus() {
  modalStatus.textContent = "";
}

function updateNames() {
  myNameLabel.textContent = state.myName;
  myAvatar.textContent = initials(state.myName);

  friendNameElement.textContent = state.friendName;
  friendAvatar.textContent = initials(state.friendName);
  headerName.textContent = state.connected
    ? state.friendName
    : "Welcome to LinkChat";
}

function setConnected(connected) {
  state.connected = connected;

  messageInput.disabled = !connected;
  sendBtn.disabled = !connected;

  if (connected) {
    friendStatus.textContent = "Connected";
    friendItem.classList.add("connected");
    friendAvatar.classList.add("online");

    headerName.textContent = state.friendName;
    headerAvatar.textContent = initials(state.friendName);

    headerStatus.textContent = "Direct peer-to-peer connection";

    messageInput.placeholder = `Message ${state.friendName}...`;
  } else {
    friendStatus.textContent = "Not connected";
    friendItem.classList.remove("connected");
    friendAvatar.classList.remove("online");

    headerName.textContent = "Welcome to LinkChat";
    headerAvatar.textContent = "F";

    headerStatus.textContent =
      "Connect with a friend to start messaging";

    messageInput.placeholder = "Connect to a friend first...";
  }
}

/* =========================
   WELCOME SCREEN
========================= */

function showWelcome() {
  messages.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "welcome-panel";

  const logo = document.createElement("div");
  logo.className = "welcome-logo";
  logo.textContent = "L";

  const title = document.createElement("h2");

  const description = document.createElement("p");

  const button = document.createElement("button");
  button.className = "primary-button";
  button.type = "button";

  if (state.connected) {
    title.textContent = `You're connected to ${state.friendName}`;

    description.textContent =
      "Your connection is ready. Send a message below to start chatting.";

    button.textContent = "Start typing";

    button.addEventListener("click", () => {
      messageInput.focus();
    });
  } else {
    title.textContent = "Welcome to LinkChat";

    description.textContent =
      "Simple messaging between friends. No accounts, no message database, and no saved chat history.";

    button.textContent = "Start a chat";

    button.addEventListener("click", openConnectModal);
  }

  panel.appendChild(logo);
  panel.appendChild(title);
  panel.appendChild(description);
  panel.appendChild(button);

  if (!state.connected) {
    const features = document.createElement("div");
    features.className = "feature-row";

    const featureNames = [
      "No account",
      "No database",
      "Peer-to-peer"
    ];

    featureNames.forEach((name) => {
      const item = document.createElement("div");

      const check = document.createElement("span");
      check.textContent = "✓";

      item.appendChild(check);
      item.appendChild(document.createTextNode(` ${name}`));

      features.appendChild(item);
    });

    panel.appendChild(features);
  }

  messages.appendChild(panel);
}

/* =========================
   MESSAGES
========================= */

function addMessage(text, mine, author) {
  const cleanText = String(text || "").trim();

  if (!cleanText) {
    return;
  }

  /*
    If the welcome screen is showing,
    remove it before displaying messages.
  */
  if (messages.querySelector(".welcome-panel")) {
    messages.innerHTML = "";
  }

  const row = document.createElement("article");
  row.className = mine ? "message mine" : "message";

  const avatar = document.createElement("div");
  avatar.className = "avatar message-avatar";
  avatar.textContent = initials(author);

  const body = document.createElement("div");
  body.className = "message-body";

  const header = document.createElement("div");

  const authorElement = document.createElement("span");
  authorElement.className = "message-author";
  authorElement.textContent = author;

  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = timeString();

  const textElement = document.createElement("div");
  textElement.className = "message-text";
  textElement.textContent = cleanText;

  header.appendChild(authorElement);
  header.appendChild(time);

  body.appendChild(header);
  body.appendChild(textElement);

  row.appendChild(avatar);
  row.appendChild(body);

  messages.appendChild(row);

  messages.scrollTop = messages.scrollHeight;
}

/* =========================
   MODALS
========================= */

function openConnectModal() {
  modalBackdrop.classList.remove("hidden");
  showChoiceStep();
}

function closeConnectModal() {
  modalBackdrop.classList.add("hidden");
  clearStatus();
}

function showChoiceStep() {
  choiceStep.classList.remove("hidden");
  hostStep.classList.add("hidden");
  guestStep.classList.add("hidden");

  modalTitle.textContent = "Start a chat";

  modalDescription.textContent =
    "Choose how you want to connect.";

  clearStatus();
}

function showHostStep() {
  choiceStep.classList.add("hidden");
  hostStep.classList.remove("hidden");
  guestStep.classList.add("hidden");

  modalTitle.textContent = "Create a chat";

  modalDescription.textContent =
    "Give your friend the connection code, then paste their response back here.";

  clearStatus();

  createHostConnection();
}

function showGuestStep() {
  choiceStep.classList.add("hidden");
  hostStep.classList.add("hidden");
  guestStep.classList.remove("hidden");

  modalTitle.textContent = "Join a chat";

  modalDescription.textContent =
    "Paste the connection code your friend gave you.";

  clearStatus();

  incomingOffer.focus();
}

/* =========================
   WEBRTC
========================= */

function closePeer() {
  if (state.channel) {
    try {
      state.channel.close();
    } catch (_) {}
  }

  if (state.peer) {
    try {
      state.peer.close();
    } catch (_) {}
  }

  state.channel = null;
  state.peer = null;
}

function createPeer() {
  closePeer();

  if (!window.RTCPeerConnection) {
    throw new Error(
      "WebRTC is not supported by this browser."
    );
  }

  const peer = new RTCPeerConnection(rtcConfig);

  peer.addEventListener("connectionstatechange", () => {
    const connectionState = peer.connectionState;

    if (connectionState === "connected") {
      setConnected(true);

      closeConnectModal();

      showWelcome();

      messageInput.focus();
    }

    if (
      connectionState === "failed" ||
      connectionState === "disconnected"
    ) {
      setConnected(false);

      typingIndicator.classList.add("hidden");

      headerStatus.textContent =
        "Connection lost. Create a new chat to reconnect.";
    }
  });

  peer.addEventListener("iceconnectionstatechange", () => {
    if (peer.iceConnectionState === "failed") {
      setStatusMessage(
        "The network connection could not be established. Create a new code and try again."
      );
    }
  });

  return peer;
}

function waitForIceGathering(peer) {
  return new Promise((resolve) => {
    if (peer.iceGatheringState === "complete") {
      resolve();
      return;
    }

    let finished = false;

    function finish() {
      if (finished) {
        return;
      }

      finished = true;

      peer.removeEventListener(
        "icegatheringstatechange",
        check
      );

      resolve();
    }

    function check() {
      if (peer.iceGatheringState === "complete") {
        finish();
      }
    }

    peer.addEventListener(
      "icegatheringstatechange",
      check
    );

    /*
      Don't wait forever if the network takes too long.
    */
    setTimeout(finish, 10000);
  });
}

/* =========================
   ENCODING / DECODING
========================= */

function encodeDescription(description) {
  const data = {
    type: description.type,
    sdp: description.sdp
  };

  return btoa(
    unescape(
      encodeURIComponent(
        JSON.stringify(data)
      )
    )
  );
}

function decodeDescription(code) {
  const clean = String(code || "").trim();

  if (!clean) {
    throw new Error("The connection code is empty.");
  }

  let decoded;

  try {
    decoded = decodeURIComponent(
      escape(
        atob(clean)
      )
    );
  } catch (_) {
    throw new Error(
      "That does not look like a valid connection code."
    );
  }

  let data;

  try {
    data = JSON.parse(decoded);
  } catch (_) {
    throw new Error(
      "The connection code could not be read."
    );
  }

  if (
    !data ||
    !["offer", "answer"].includes(data.type) ||
    typeof data.sdp !== "string"
  ) {
    throw new Error(
      "That connection code is invalid."
    );
  }

  return data;
}

/* =========================
   DATA CHANNEL
========================= */

function setupDataChannel(channel) {
  state.channel = channel;

  channel.addEventListener("open", () => {
    setConnected(true);

    closeConnectModal();

    showWelcome();

    sendPayload({
      type: "hello",
      name: state.myName
    });

    messageInput.focus();
  });

  channel.addEventListener("message", (event) => {
    if (typeof event.data !== "string") {
      return;
    }

    let payload;

    try {
      payload = JSON.parse(event.data);
    } catch (_) {
      payload = {
        type: "message",
        text: event.data
      };
    }

    /* Friend's name */
    if (payload.type === "hello") {
      if (
        typeof payload.name === "string" &&
        payload.name.trim()
      ) {
        state.friendName =
          payload.name.trim().slice(0, 20);

        updateNames();

        if (state.connected) {
          headerName.textContent =
            state.friendName;

          headerAvatar.textContent =
            initials(state.friendName);
        }
      }

      return;
    }

    /* Typing */
    if (payload.type === "typing") {
      if (payload.value) {
        typingIndicator.textContent =
          `${state.friendName} is typing...`;

        typingIndicator.classList.remove("hidden");

        clearTimeout(window.typingTimeout);

        window.typingTimeout = setTimeout(() => {
          typingIndicator.classList.add("hidden");
        }, 1800);
      } else {
        typingIndicator.classList.add("hidden");
      }

      return;
    }

    /* Message */
    if (
      payload.type === "message" &&
      typeof payload.text === "string"
    ) {
      const text = payload.text.trim();

      if (!text) {
        return;
      }

      addMessage(
        text,
        false,
        state.friendName
      );

      state.unread += 1;

      unreadBadge.textContent =
        String(state.unread);

      unreadBadge.classList.remove("hidden");

      typingIndicator.classList.add("hidden");
    }
  });

  channel.addEventListener("close", () => {
    setConnected(false);

    typingIndicator.classList.add("hidden");

    headerStatus.textContent =
      "Your friend disconnected.";
  });

  channel.addEventListener("error", () => {
    setStatusMessage(
      "The message connection encountered an error."
    );
  });
}

/* =========================
   CREATE CHAT
========================= */

async function createHostConnection() {
  try {
    closePeer();

    state.isHost = true;

    const peer = createPeer();
    state.peer = peer;

    /*
      Create the data channel.
    */
    const channel = peer.createDataChannel(
      "messages"
    );

    setupDataChannel(channel);

    /*
      Create the WebRTC offer.
    */
    const offer =
      await peer.createOffer();

    await peer.setLocalDescription(offer);

    /*
      Wait for network information to be added.
    */
    await waitForIceGathering(peer);

    offerCode.value =
      encodeDescription(
        peer.localDescription
      );

    answerCode.value = "";

    setStatusMessage(
      "Your code is ready. Send it to your friend.",
      false
    );

  } catch (error) {
    console.error(error);

    setStatusMessage(
      error.message ||
      "Could not create the connection."
    );
  }
}

/* =========================
   CREATE GUEST ANSWER
========================= */

async function createGuestAnswer() {
  try {
    const offer =
      decodeDescription(
        incomingOffer.value
      );

    if (offer.type !== "offer") {
      throw new Error(
        "This code is not a chat invitation."
      );
    }

    closePeer();

    state.isHost = false;

    const peer = createPeer();
    state.peer = peer;

    /*
      The guest receives the host's data channel.
    */
    peer.addEventListener(
      "datachannel",
      (event) => {
        setupDataChannel(
          event.channel
        );
      }
    );

    await peer.setRemoteDescription(
      offer
    );

    const answer =
      await peer.createAnswer();

    await peer.setLocalDescription(
      answer
    );

    await waitForIceGathering(peer);

    answerOutput.value =
      encodeDescription(
        peer.localDescription
      );

    setStatusMessage(
      "Your response is ready. Send it to your friend.",
      false
    );

  } catch (error) {
    console.error(error);

    setStatusMessage(
      error.message ||
      "Could not join the chat."
    );
  }
}

/* =========================
   FINISH HOST CONNECTION
========================= */

async function finishHostConnection() {
  try {
    if (!state.peer) {
      throw new Error(
        "Create a chat first."
      );
    }

    const answer =
      decodeDescription(
        answerCode.value
      );

    if (answer.type !== "answer") {
      throw new Error(
        "That code is not a valid response."
      );
    }

    await state.peer.setRemoteDescription(
      answer
    );

    setStatusMessage(
      "Response accepted. Connecting...",
      false
    );

  } catch (error) {
    console.error(error);

    setStatusMessage(
      error.message ||
      "Could not connect."
    );
  }
}

/* =========================
   SENDING DATA
========================= */

function sendPayload(payload) {
  if (
    !state.channel ||
    state.channel.readyState !== "open"
  ) {
    return false;
  }

  try {
    state.channel.send(
      JSON.stringify(payload)
    );

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function sendMessage() {
  if (!state.connected) {
    return;
  }

  const text =
    messageInput.value.trim();

  if (!text) {
    return;
  }

  const sent =
    sendPayload({
      type: "message",
      text: text
    });

  if (!sent) {
    setStatusMessage(
      "The connection is no longer available."
    );

    return;
  }

  addMessage(
    text,
    true,
    state.myName
  );

  messageInput.value = "";

  sendPayload({
    type: "typing",
    value: false
  });
}

/* =========================
   COPY BUTTON
========================= */

async function copyText(text, button) {
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);

    const original =
      button.textContent;

    button.textContent = "Copied!";

    setTimeout(() => {
      button.textContent = original;
    }, 1200);

  } catch (_) {
    /*
      Older browsers / restricted clipboard
      fallback.
    */
    try {
      const temporary =
        document.createElement("textarea");

      temporary.value = text;

      document.body.appendChild(
        temporary
      );

      temporary.select();

      document.execCommand("copy");

      temporary.remove();

      const original =
        button.textContent;

      button.textContent = "Copied!";

      setTimeout(() => {
        button.textContent = original;
      }, 1200);

    } catch (error) {
      setStatusMessage(
        "Could not copy automatically. Select the code and copy it manually."
      );
    }
  }
}

/* =========================
   PROFILE
========================= */

function openProfile() {
  nameInput.value = state.myName;

  profileBackdrop.classList.remove(
    "hidden"
  );

  nameInput.focus();
  nameInput.select();
}

function closeProfile() {
  profileBackdrop.classList.add(
    "hidden"
  );
}

function saveName() {
  const newName =
    nameInput.value.trim();

  if (!newName) {
    nameInput.value = state.myName;
    return;
  }

  state.myName =
    newName.slice(0, 20);

  updateNames();

  /*
    Tell the connected friend about the
    new name immediately.
  */
  sendPayload({
    type: "hello",
    name: state.myName
  });

  closeProfile();
}

/* =========================
   INFO MODAL
========================= */

function openInfo() {
  infoBackdrop.classList.remove(
    "hidden"
  );
}

function closeInfo() {
  infoBackdrop.classList.add(
    "hidden"
  );
}

/* =========================
   DISCONNECT
========================= */

function disconnect() {
  closePeer();

  state.connected = false;
  state.isHost = false;
  state.friendName = "Friend";
  state.unread = 0;

  unreadBadge.textContent = "0";
  unreadBadge.classList.add("hidden");

  typingIndicator.classList.add("hidden");

  setConnected(false);
  updateNames();
  showWelcome();
}

/* =========================
   BUTTON EVENTS
========================= */

/* Add friend buttons */
$("addFriendButton").addEventListener(
  "click",
  openConnectModal
);

$("headerAddButton").addEventListener(
  "click",
  openConnectModal
);

$("railAddFriend").addEventListener(
  "click",
  openConnectModal
);

$("startChatButton").addEventListener(
  "click",
  openConnectModal
);

/* Modal close */
$("modalClose").addEventListener(
  "click",
  closeConnectModal
);

/* Create / join choices */
$("createChatButton").addEventListener(
  "click",
  showHostStep
);

$("joinChatButton").addEventListener(
  "click",
  showGuestStep
);

/* Host */
$("copyOfferButton").addEventListener(
  "click",
  () => {
    copyText(
      offerCode.value,
      $("copyOfferButton")
    );
  }
);

$("connectAnswerButton").addEventListener(
  "click",
  finishHostConnection
);

/* Guest */
$("createAnswerButton").addEventListener(
  "click",
  createGuestAnswer
);

$("copyAnswerButton").addEventListener(
  "click",
  () => {
    copyText(
      answerOutput.value,
      $("copyAnswerButton")
    );
  }
);

/* Profile */
$("settingsButton").addEventListener(
  "click",
  openProfile
);

$("profileClose").addEventListener(
  "click",
  closeProfile
);

$("saveNameButton").addEventListener(
  "click",
  saveName
);

/* Info */
$("infoButton").addEventListener(
  "click",
  openInfo
);

$("infoClose").addEventListener(
  "click",
  closeInfo
);

$("infoDoneButton").addEventListener(
  "click",
  closeInfo
);

/* Friend item */
friendItem.addEventListener(
  "click",
  () => {
    if (state.connected) {
      state.unread = 0;

      unreadBadge.textContent = "0";
      unreadBadge.classList.add("hidden");

      messageInput.focus();
    } else {
      openConnectModal();
    }
  }
);

/* Send message */
messageForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();
    sendMessage();
  }
);

/* Typing */
messageInput.addEventListener(
  "input",
  () => {
    if (!state.connected) {
      return;
    }

    sendPayload({
      type: "typing",
      value: messageInput.value.length > 0
    });
  }
);

/* Enter to send */
messageInput.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  }
);

/* Emoji button */
$("emojiButton").addEventListener(
  "click",
  () => {
    if (!state.connected) {
      return;
    }

    messageInput.value += " 🙂";
    messageInput.focus();

    sendPayload({
      type: "typing",
      value: true
    });
  }
);

/* Escape closes modals */
document.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Escape") {
      return;
    }

    closeConnectModal();
    closeProfile();
    closeInfo();
  }
);

/* Clicking outside a modal closes it */
modalBackdrop.addEventListener(
  "click",
  (event) => {
    if (event.target === modalBackdrop) {
      closeConnectModal();
    }
  }
);

profileBackdrop.addEventListener(
  "click",
  (event) => {
    if (event.target === profileBackdrop) {
      closeProfile();
    }
  }
);

infoBackdrop.addEventListener(
  "click",
  (event) => {
    if (event.target === infoBackdrop) {
      closeInfo();
    }
  }
);

/* =========================
   INITIAL SETUP
========================= */

setConnected(false);
updateNames();
showWelcome();
