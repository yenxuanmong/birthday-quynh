const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const path      = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

// Lưu danh sách reactions: { id, emoji, name, label, ts }
const reactions = [];

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  // Gửi toàn bộ reactions hiện tại cho người vừa kết nối
  socket.emit('init', reactions);

  // Nhận reaction mới từ client
  socket.on('react', (data) => {
    const item = {
      id:    Date.now() + Math.random(),
      emoji: data.emoji,
      name:  data.name,
      ts:    Date.now()
    };
    reactions.push(item);
    if (reactions.length > 200) reactions.splice(0, reactions.length - 200);
    io.emit('react', item);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
