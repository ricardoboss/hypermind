const countEl = document.getElementById("count");
const directEl = document.getElementById("direct");
const totalUniqueEl = document.getElementById("total-unique");
const canvas = document.getElementById("network");
const ctx = canvas.getContext("2d");
let particles = [];

function getThemeColor(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 1;
    this.vy = (Math.random() - 0.5) * 1;
    this.size = 3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = getThemeColor("--color-particle");
    ctx.fill();
  }
}

const updateParticles = (count) => {
  const limitAttr = canvas.getAttribute("data-visual-limit");
  const VISUAL_LIMIT = limitAttr ? parseInt(limitAttr) : 500;
  const visualCount = Math.min(count, VISUAL_LIMIT);

  const currentCount = particles.length;
  if (visualCount > currentCount) {
    for (let i = 0; i < visualCount - currentCount; i++) {
      particles.push(new Particle());
    }
  } else if (visualCount < currentCount) {
    particles.splice(visualCount, currentCount - visualCount);
  }
};

const animate = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = getThemeColor("--color-particle-link");
  ctx.lineWidth = 1;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 150) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  particles.forEach((p) => {
    p.update();
    p.draw();
  });

  requestAnimationFrame(animate);
};

const openDiagnostics = () => {
  document.getElementById("diagnosticsModal").classList.add("active");
};

const closeDiagnostics = () => {
  document.getElementById("diagnosticsModal").classList.remove("active");
};

document.getElementById("diagnosticsModal").addEventListener("click", (e) => {
  if (e.target.id === "diagnosticsModal") {
    closeDiagnostics();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDiagnostics();
    closeMap();
  }
});

// Map Logic
let map = null;
let mapInitialized = false;
let peerMarkers = {}; // id -> marker
let ipCache = {}; // ip -> { lat, lon }
let lastPeerData = [];
let myLocation = null;

const fetchMyLocation = async () => {
  if (myLocation) return;
  try {
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();
    if (data.success) {
      myLocation = {
        lat: data.latitude,
        lon: data.longitude,
        city: data.city,
        country: data.country,
      };
      updateMap(lastPeerData);
    }
  } catch (e) {
    console.error("My location fetch failed", e);
  }
};

const openMap = () => {
  document.getElementById("mapModal").classList.add("active");
  if (!mapInitialized) {
    initMap();
  } else {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }

  fetchMyLocation();

  if (lastPeerData.length > 0) {
    updateMap(lastPeerData);
  }
};

const closeMap = () => {
  document.getElementById("mapModal").classList.remove("active");
};

document.getElementById("mapModal").addEventListener("click", (e) => {
  if (e.target.id === "mapModal") {
    closeMap();
  }
});

const initMap = () => {
  if (mapInitialized) return;

  map = L.map("map").setView([20, 0], 2);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  mapInitialized = true;

  setTimeout(() => {
    map.invalidateSize();
  }, 100);
};

const fetchLocation = async (ip) => {
  if (ipCache[ip]) return ipCache[ip];

  // Skip local IPs
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  ) {
    return null;
  }

  try {
    const res = await fetch(`https://ipwho.is/${ip}`);
    const data = await res.json();
    if (data.success) {
      const loc = {
        lat: data.latitude,
        lon: data.longitude,
        city: data.city,
        country: data.country,
      };
      ipCache[ip] = loc;
      return loc;
    }
  } catch (e) {
    console.error("Geo fetch failed", e);
  }
  return null;
};

const updateMap = async (peers) => {
  if (!mapInitialized) return;
  if (!peers) peers = [];

  const currentIds = new Set(peers.map((p) => p.id));

  // Remove old markers
  for (const id in peerMarkers) {
    if (id !== "me" && !currentIds.has(id)) {
      map.removeLayer(peerMarkers[id]);
      delete peerMarkers[id];
    }
  }

  // Add/Update markers
  for (const peer of peers) {
    if (!peer.ip) continue;

    if (!peerMarkers[peer.id]) {
      const loc = await fetchLocation(peer.ip);
      if (loc) {
        const marker = L.circleMarker([loc.lat, loc.lon], {
          radius: 10,
          fillColor: "#4ade80",
          color: "transparent",
          weight: 0,
          opacity: 0,
          fillOpacity: 0.15,
        }).addTo(map);

        const peerName = window.generateScreenname
          ? window.generateScreenname(peer.id)
          : peer.id.slice(-8);
        marker.bindPopup(`<b>${peerName}</b><br>${loc.city}, ${loc.country}`);
        peerMarkers[peer.id] = marker;
      }
    }
  }

  // Add My Location
  if (myLocation && !peerMarkers["me"]) {
    const marker = L.circleMarker([myLocation.lat, myLocation.lon], {
      radius: 6,
      fillColor: "#ffffff",
      color: "#4ade80",
      weight: 2,
      opacity: 1,
      fillOpacity: 1,
    }).addTo(map);

    marker.bindPopup(
      `<b>This Node</b><br>${myLocation.city}, ${myLocation.country}`
    );
    peerMarkers["me"] = marker;
  }
};

const terminal = document.getElementById("terminal");
const terminalOutput = document.getElementById("terminal-output");
const systemStatusBar = document.getElementById("system-status-bar");
const terminalInput = document.getElementById("terminal-input");
const terminalToggle = document.getElementById("terminal-toggle");
const mapContainer = document.getElementById("map-container");
const promptEl = document.querySelector(".prompt");
let myId = null;
let myChatHistory = [];
let globalChatEnabled = true;
let showTimestamp = localStorage.getItem("showTimestamp") === "true";
let blockedUsers = new Set(
  JSON.parse(localStorage.getItem("blockedUsers") || "[]")
);

if (showTimestamp) {
  terminalOutput.classList.add("show-timestamps");
}

window.toggleTimestamp = () => {
  showTimestamp = !showTimestamp;
  localStorage.setItem("showTimestamp", showTimestamp);
  if (showTimestamp) {
    terminalOutput.classList.add("show-timestamps");
    systemStatusBar.innerText = "[SYSTEM] Timestamps enabled";
  } else {
    terminalOutput.classList.remove("show-timestamps");
    systemStatusBar.innerText = "[SYSTEM] Timestamps disabled";
  }
};
let nameToId = new Map();

// Context Menu Logic
const contextMenu = document.getElementById("contextMenu");
const contextWhisper = document.getElementById("contextWhisper");
const contextBlock = document.getElementById("contextBlock");
let activeContextUser = null;

const showContextMenu = (x, y, username) => {
  activeContextUser = username;
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add("active");

  // Adjust position if off-screen
  const rect = contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
  }
  if (rect.bottom > window.innerHeight) {
    contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
  }
};

const hideContextMenu = () => {
  contextMenu.classList.remove("active");
  activeContextUser = null;
};

document.addEventListener("click", (e) => {
  if (!contextMenu.contains(e.target)) {
    hideContextMenu();
  }
});

contextWhisper.addEventListener("click", () => {
  if (activeContextUser) {
    terminalInput.value = `/whisper ${activeContextUser} `;
    terminalInput.focus();
  }
  hideContextMenu();
});
contextBlock.addEventListener("click", () => {
  if (activeContextUser) {
    terminalInput.value = `/block ${activeContextUser}`;
    terminalInput.focus();
  }
  hideContextMenu();
});

terminalToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleChat();
});

// Initialize chat state from localStorage
const initChatState = () => {
  const isCollapsed = localStorage.getItem("chatCollapsed") === "true";
  const savedHeight = parseInt(localStorage.getItem("chatHeight")) || 250;

  if (savedHeight >= 100 && savedHeight <= window.innerHeight - 50) {
    terminal.style.height = `${savedHeight}px`;
  }

  if (isCollapsed) {
    terminal.classList.add("collapsed");
    terminalToggle.innerText = "▲";
    document.body.classList.remove("chat-active");
    document.body.classList.add("chat-collapsed");
  } else {
    terminal.classList.remove("collapsed");
    terminalToggle.innerText = "▼";
    document.body.classList.add("chat-active");
    document.body.classList.remove("chat-collapsed");
    document.body.style.paddingBottom = `${terminal.offsetHeight}px`;
  }
};

const toggleChat = () => {
  terminal.classList.toggle("collapsed");
  const isCollapsed = terminal.classList.contains("collapsed");
  terminalToggle.innerText = isCollapsed ? "▲" : "▼";

  localStorage.setItem("chatCollapsed", isCollapsed);

  if (isCollapsed) {
    document.body.classList.remove("chat-active");
    document.body.classList.add("chat-collapsed");
    document.body.style.paddingBottom = ""; // Reset to CSS default for collapsed
  } else {
    document.body.classList.add("chat-active");
    document.body.classList.remove("chat-collapsed");
    document.body.style.paddingBottom = `${terminal.offsetHeight}px`;
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }
};

// Chat Resizing Logic
const terminalResizer = document.getElementById("terminal-resizer");
let isResizing = false;
let startY, startHeight;

if (terminalResizer) {
  terminalResizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    startY = e.clientY;
    startHeight = terminal.offsetHeight;
    document.body.style.userSelect = "none"; // Prevent selection while dragging
    document.body.style.cursor = "ns-resize";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    // Calculate new height (drag up increases height)
    const diff = startY - e.clientY;
    let newHeight = startHeight + diff;

    // Limits
    if (newHeight < 100) newHeight = 100;
    if (newHeight > window.innerHeight - 50)
      newHeight = window.innerHeight - 50;

    terminal.style.height = `${newHeight}px`;

    if (!terminal.classList.contains("collapsed")) {
      document.body.style.paddingBottom = `${newHeight}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      localStorage.setItem("chatHeight", terminal.offsetHeight);
    }
  });
}

const updatePromptStatus = () => {
  const now = Date.now();
  myChatHistory = myChatHistory.filter((t) => now - t < 10000);

  if (myChatHistory.length >= 5) {
    promptEl.style.color = "orange";
  } else {
    promptEl.style.color = "#4ade80";
  }
};

setInterval(updatePromptStatus, 500);

const getColorFromId = (id) => {
  if (!id) return "#666";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const seenMessageIds = new Set();
const messageIdHistory = [];

const appendMessage = (msg) => {
  const div = document.createElement("div");

  if (msg.type === "CHAT") {
    if (msg.id) {
      if (seenMessageIds.has(msg.id)) return;
      seenMessageIds.add(msg.id);
      messageIdHistory.push(msg.id);
      if (messageIdHistory.length > 100) {
        const oldest = messageIdHistory.shift();
        seenMessageIds.delete(oldest);
      }
    }

    // Block check
    if (blockedUsers.has(msg.sender)) return;

    // Whisper check
    if (msg.target && msg.target !== myId && msg.sender !== myId) return;

    const senderColor = getColorFromId(msg.sender);

    let senderName = "Unknown";
    if (window.generateScreenname) {
      senderName = window.generateScreenname(msg.sender);
    } else {
      senderName = msg.sender.slice(-8);
    }

    // Update name map (before changing senderName to "You")
    nameToId.set(senderName, msg.sender);

    if (msg.sender === myId) senderName = "You";

    let scopeLabel = msg.scope === "LOCAL" ? "[LOCAL] " : "";
    if (msg.target) scopeLabel = "[WHISPER] ";

    const timestampSpan = document.createElement("span");
    timestampSpan.className = "timestamp";
    const date = new Date();
    timestampSpan.innerText = `[${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
      .getSeconds()
      .toString()
      .padStart(2, "0")}]`;

    const senderSpan = document.createElement("span");
    senderSpan.className = "msg-sender";
    senderSpan.style.color = senderColor;
    senderSpan.style.cursor = "pointer";
    senderSpan.innerText = `${scopeLabel}[${senderName}]`;
    senderSpan.dataset.name = senderName === "You" ? "" : senderName;

    senderSpan.onclick = (e) => {
      e.stopPropagation();
      const name = senderSpan.dataset.name;
      if (name) {
        showContextMenu(e.clientX, e.clientY, name);
      }
    };

    const contentSpan = document.createElement("span");
    contentSpan.className = "msg-content";

    const rawContent = ` > ${msg.content}`;
    if (window.ChatCommands) {
      contentSpan.innerHTML = window.ChatCommands.formatMessage(rawContent);
    } else {
      contentSpan.innerText = rawContent;
    }

    if (msg.target) {
      contentSpan.style.fontStyle = "italic";
      contentSpan.style.opacity = "0.8";
    }

    div.appendChild(timestampSpan);
    div.appendChild(senderSpan);
    div.appendChild(contentSpan);
  }

  terminalOutput.appendChild(div);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
};

terminalInput.addEventListener("keypress", async (e) => {
  // Init audio context on first interaction
  if (window.SoundManager) {
    window.SoundManager.init();
  }

  if (e.key === "Enter") {
    let content = terminalInput.value.trim();
    if (!content) return;

    terminalInput.value = "";

    // Pre-process commands (Easter eggs, formatting, local actions)
    if (window.ChatCommands) {
      const result = window.ChatCommands.processInput(content);
      if (result.type === "action") {
        const action = window.ChatCommands.actions[result.command];
        if (action && typeof action.execute === "function") {
          try {
            action.execute();
          } catch (err) {
            console.error("Command execution error:", err);
            systemStatusBar.innerText = `[SYSTEM] Command failed: ${result.command}`;
          }
        } else {
          systemStatusBar.innerText = `[SYSTEM] Unknown command: ${result.command}`;
        }
        return;
      } else if (result.type === "text") {
        content = result.content;
      }
    }


    let scope = "GLOBAL";
    let target = null;

    if (content.startsWith("/local ")) {
      scope = "LOCAL";
      content = content.replace(/^\/local\s+/, "").trim();
      if (!content) return;
    } else if (content.startsWith("/block ")) {
      const name = content.replace(/^\/block\s+/, "").trim();
      const id = nameToId.get(name);
      if (id) {
        blockedUsers.add(id);
        localStorage.setItem("blockedUsers", JSON.stringify([...blockedUsers]));
        systemStatusBar.innerText = `[SYSTEM] Blocked ${name}`;
      } else {
        systemStatusBar.innerText = `[SYSTEM] Unknown user ${name}`;
      }
      return;
    } else if (content.startsWith("/unblock ")) {
      const name = content.replace(/^\/unblock\s+/, "").trim();
      const id = nameToId.get(name);
      if (id && blockedUsers.has(id)) {
        blockedUsers.delete(id);
        localStorage.setItem("blockedUsers", JSON.stringify([...blockedUsers]));
        systemStatusBar.innerText = `[SYSTEM] Unblocked ${name}`;
      } else {
        if (blockedUsers.has(name)) {
          blockedUsers.delete(name);
          localStorage.setItem(
            "blockedUsers",
            JSON.stringify([...blockedUsers])
          );
          systemStatusBar.innerText = `[SYSTEM] Unblocked ID ${name.slice(-8)}`;
        } else {
          systemStatusBar.innerText = `[SYSTEM] Could not find blocked user ${name}`;
        }
      }
      return;
    } else if (content.startsWith("/whisper ")) {
      const parts = content.split(" ");
      if (parts.length < 3) {
        systemStatusBar.innerText = `[SYSTEM] Usage: /whisper <username> <message>`;
        return;
      }
      const potentialName = parts[1];
      const msg = parts.slice(2).join(" ");

      if (nameToId.has(potentialName)) {
        target = nameToId.get(potentialName);
        content = msg;
        scope = "GLOBAL";
      } else {
        systemStatusBar.innerText = `[SYSTEM] Unknown user ${potentialName}`;
        return;
      }
    } else if (content.startsWith("/")) {
      const parts = content.split(" ");
      const potentialName = parts[0].substring(1);
      const msg = parts.slice(1).join(" ");

      if (nameToId.has(potentialName) && msg) {
        target = nameToId.get(potentialName);
        content = msg;
        scope = "GLOBAL";
      } else if (!msg) {
        systemStatusBar.innerText = `[SYSTEM] Usage: /${potentialName} <message>`;
        return;
      } else {
        systemStatusBar.innerText = `[SYSTEM] Unknown user: ${potentialName}`;
        return;
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, scope, target }),
      });

      if (res.ok) {
        if (window.SoundManager) window.SoundManager.playSent();
        myChatHistory.push(Date.now());
        updatePromptStatus();
      } else if (res.status === 429) {
        // Force update if we hit the limit unexpectedly
        // Add a dummy timestamp to force the limit state if not already there
        if (myChatHistory.length < 5) {
          myChatHistory.push(Date.now());
        }
        updatePromptStatus();
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  }
});

const evtSource = new EventSource("/events");

evtSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "SYSTEM") {
    systemStatusBar.innerText = `[SYSTEM] ${data.content}`;
    return;
  }

  if (data.type === "CHAT") {
    // Play sounds
    if (window.SoundManager && data.sender !== myId) {
      if (data.target === myId) {
        window.SoundManager.playWhisper();
      } else {
        window.SoundManager.playReceived();
      }
    }
    appendMessage(data);
    return;
  }

  if (data.chatEnabled) {
    terminal.classList.remove("hidden");

    // Only initialize state once when chat becomes enabled
    if (!terminal.dataset.initialized) {
      initChatState();
      terminal.dataset.initialized = "true";
    }
  } else {
    terminal.classList.add("hidden");
    document.body.classList.remove("chat-active");
    document.body.classList.remove("chat-collapsed");
  }

  if (data.mapEnabled) {
    if (mapContainer) mapContainer.style.display = "inline";
  } else {
    if (mapContainer) mapContainer.style.display = "none";
    if (document.getElementById("mapModal").classList.contains("active")) {
      closeMap();
    }
  }

  if (data.id) {
    myId = data.id;
    const diagIdEl = document.getElementById("diag-id");
    if (diagIdEl && diagIdEl.innerText === "{{FULL_ID}}") {
      diagIdEl.innerText = data.id;
    }
  }

  if (data.screenname) {
    const screennameEl = document.getElementById("my-screenname");
    if (screennameEl) screennameEl.innerText = data.screenname;
  }

  if (data.peers) {
    lastPeerData = data.peers;
    if (
      mapInitialized &&
      document.getElementById("mapModal").classList.contains("active")
    ) {
      updateMap(data.peers);
    }
  }

  updateParticles(data.count);

  if (countEl.innerText != data.count) {
    countEl.innerText = data.count;
    countEl.classList.remove("pulse");
    void countEl.offsetWidth;
    countEl.classList.add("pulse");
  }

  directEl.innerText = data.direct;
  if (totalUniqueEl) totalUniqueEl.innerText = data.totalUnique;

  if (data.diagnostics) {
    const d = data.diagnostics;

    const formatBandwidth = (bytes) => {
      const kb = bytes / 1024;
      const mb = kb / 1024;
      const gb = mb / 1024;

      if (gb >= 1) {
        return gb.toFixed(2) + " GB";
      } else if (mb >= 1) {
        return mb.toFixed(2) + " MB";
      } else {
        return kb.toFixed(1) + " KB";
      }
    };

    document.getElementById("diag-heartbeats-rx").innerText =
      d.heartbeatsReceived.toLocaleString();
    document.getElementById("diag-heartbeats-tx").innerText =
      d.heartbeatsRelayed.toLocaleString();
    document.getElementById("diag-new-peers").innerText =
      d.newPeersAdded.toLocaleString();
    document.getElementById("diag-dup-seq").innerText =
      d.duplicateSeq.toLocaleString();
    document.getElementById("diag-invalid-pow").innerText =
      d.invalidPoW.toLocaleString();
    document.getElementById("diag-invalid-sig").innerText =
      d.invalidSig.toLocaleString();
    document.getElementById("diag-bandwidth-in").innerText = formatBandwidth(
      d.bytesReceived
    );
    document.getElementById("diag-bandwidth-out").innerText = formatBandwidth(
      d.bytesRelayed
    );
    document.getElementById("diag-leave").innerText =
      d.leaveMessages.toLocaleString();
  }
};

evtSource.onerror = (err) => {
  // Removing console error here as it's extremely spammy in the browser console and it will reconnct automatically anyway, so pretty redundant.
};

const initialCount = parseInt(countEl.dataset.initialCount) || 0;
countEl.innerText = initialCount;
countEl.classList.add("loaded");
updateParticles(initialCount);
animate();

const themes = [
  "default.css",
  "tokyo-night.css",
  "nord-dark.css",
  "solarized-light.css",
  "volcano.css",
  "hypermind.css",
];

let currentThemeIndex = 0;
let notificationTimeout;

function showThemeNotification(themeName) {
  const notification = document.getElementById("theme-notification");
  if (!notification) return;

  const displayName = themeName
    .replace(".css", "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  notification.innerText = `Theme: ${displayName}`;
  notification.classList.remove("hidden");

  notification.offsetHeight;
  
  notification.classList.add("show");

  if (notificationTimeout) clearTimeout(notificationTimeout);
  
  notificationTimeout = setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.classList.add("hidden");
    }, 300);
  }, 2000);
}

const currentThemeLink = document.getElementById("theme-css");
if (currentThemeLink) {
  const currentThemeName = currentThemeLink.href.split("/").pop();
  currentThemeIndex = themes.indexOf(currentThemeName);
  if (currentThemeIndex === -1) currentThemeIndex = 0;
}

function cycleTheme() {
  const btn = document.getElementById("theme-switcher");
  if (btn.disabled) return;

  btn.disabled = true;
  btn.style.opacity = "0.5";

  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  const newTheme = themes[currentThemeIndex];
  const oldLink = document.getElementById("theme-css");

  const newLink = document.createElement("link");
  newLink.rel = "stylesheet";
  newLink.href = `/themes/${newTheme}`;

  newLink.onload = () => {
    if (oldLink) oldLink.remove();
    newLink.id = "theme-css";
    localStorage.setItem("hypermind-theme", newTheme);
    btn.disabled = false;
    btn.style.opacity = "";
    showThemeNotification(newTheme);
  };

  newLink.onerror = () => {
    console.error("Failed to load theme:", newTheme);
    newLink.remove();
    btn.disabled = false;
    btn.style.opacity = "";
    currentThemeIndex = (currentThemeIndex - 1 + themes.length) % themes.length;
  };

  if (oldLink && oldLink.parentNode) {
    oldLink.parentNode.insertBefore(newLink, oldLink.nextSibling);
  } else {
    document.head.appendChild(newLink);
  }
}

window.cycleTheme = cycleTheme;

document.getElementById("theme-switcher").addEventListener("click", cycleTheme);
