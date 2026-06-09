const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── State ──────────────────────────────────────────────────────
let currentReaction = null; // { emoji, name }
let currentMsg      = null; // { text, name }
let broadcastTimer  = null;
let msgTimer        = null;

function startBroadcast(reaction) {
  if (broadcastTimer) clearInterval(broadcastTimer);
  currentReaction = reaction;
  io.emit('react', reaction);
  broadcastTimer = setInterval(() => io.emit('react', currentReaction), 2000);
}

function startMsgBroadcast(msg) {
  if (msgTimer) clearInterval(msgTimer);
  currentMsg = msg;
  io.emit('msg', msg);
  msgTimer = setInterval(() => io.emit('msg', currentMsg), 2000);
}

io.on('connection', (socket) => {
  // Gửi state hiện tại cho người vừa vào
  if (currentReaction) socket.emit('react', currentReaction);
  if (currentMsg)      socket.emit('msg',   currentMsg);

  socket.on('react', (data) => {
    startBroadcast({ emoji: data.emoji, name: data.name });
  });

  socket.on('msg', (data) => {
    startMsgBroadcast({ text: data.text, name: data.name });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
