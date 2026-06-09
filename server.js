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
let broadcastTimer  = null;

function startBroadcast(reaction) {
  // Dừng vòng cũ
  if (broadcastTimer) clearInterval(broadcastTimer);
  currentReaction = reaction;

  // Broadcast ngay lập tức
  io.emit('react', reaction);

  // Lặp mỗi 2 giây cho tất cả
  broadcastTimer = setInterval(() => {
    io.emit('react', currentReaction);
  }, 2000);
}

io.on('connection', (socket) => {
  // Gửi reaction hiện tại cho người vừa vào
  if (currentReaction) {
    socket.emit('react', currentReaction);
  }

  socket.on('react', (data) => {
    startBroadcast({ emoji: data.emoji, name: data.name });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
