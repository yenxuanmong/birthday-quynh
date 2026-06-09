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

// Lưu theo tên → không mất khi disconnect/reload
// { name → { react: {emoji,name} | null, msg: {text,name} | null } }
const store = new Map();

function getAll() {
  const reacts = [], msgs = [];
  for (const state of store.values()) {
    if (state.react) reacts.push(state.react);
    if (state.msg)   msgs.push(state.msg);
  }
  return { reacts, msgs };
}

// Broadcast tất cả cho mọi người mỗi 2 giây
setInterval(() => {
  const { reacts, msgs } = getAll();
  if (reacts.length) io.emit('react_batch', reacts);
  if (msgs.length)   io.emit('msg_batch',   msgs);
}, 2000);

io.on('connection', (socket) => {
  // Gửi state hiện tại ngay khi người mới vào / reload
  const { reacts, msgs } = getAll();
  if (reacts.length) socket.emit('react_batch', reacts);
  if (msgs.length)   socket.emit('msg_batch',   msgs);

  socket.on('react', (data) => {
    const name = data.name;
    const state = store.get(name) || {};
    state.react = { emoji: data.emoji, name };
    store.set(name, state);
    io.emit('react_batch', [state.react]);
  });

  socket.on('msg', (data) => {
    const name = data.name;
    const state = store.get(name) || {};
    state.msg = { text: data.text, name };
    store.set(name, state);
    io.emit('msg_batch', [state.msg]);
  });

  // Không xóa khi disconnect — dữ liệu tồn tại mãi
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
