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

// ── Lưu trạng thái của từng người (socketId → { react, msg })
// Dùng Map để nhiều người tồn tại song song
const userStates = new Map(); // socketId → { react: {emoji,name}, msg: {text,name} }
const userTimers = new Map(); // socketId → intervalId

function broadcastAll() {
  // Gom tất cả reactions và messages đang active
  const reacts = [];
  const msgs   = [];
  for (const state of userStates.values()) {
    if (state.react) reacts.push(state.react);
    if (state.msg)   msgs.push(state.msg);
  }
  if (reacts.length) io.emit('react_batch', reacts);
  if (msgs.length)   io.emit('msg_batch',   msgs);
}

// Broadcast chung mỗi 2 giây
setInterval(broadcastAll, 2000);

io.on('connection', (socket) => {
  // Khởi tạo state cho người mới
  userStates.set(socket.id, { react: null, msg: null });

  // Gửi state hiện tại ngay khi vào
  const reacts = [], msgs = [];
  for (const state of userStates.values()) {
    if (state.react) reacts.push(state.react);
    if (state.msg)   msgs.push(state.msg);
  }
  if (reacts.length) socket.emit('react_batch', reacts);
  if (msgs.length)   socket.emit('msg_batch',   msgs);

  socket.on('react', (data) => {
    const state = userStates.get(socket.id) || {};
    state.react = { emoji: data.emoji, name: data.name };
    userStates.set(socket.id, state);
    // Broadcast ngay
    io.emit('react_batch', [state.react]);
  });

  socket.on('msg', (data) => {
    const state = userStates.get(socket.id) || {};
    state.msg = { text: data.text, name: data.name };
    userStates.set(socket.id, state);
    // Broadcast ngay
    io.emit('msg_batch', [state.msg]);
  });

  socket.on('disconnect', () => {
    userStates.delete(socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
