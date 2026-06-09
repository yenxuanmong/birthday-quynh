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

io.on('connection', (socket) => {
  // Nhận emoji reaction → broadcast cho tất cả
  socket.on('react', (data) => {
    io.emit('react', { emoji: data.emoji, name: data.name });
  });

  // Nhận tin nhắn → broadcast cho tất cả
  socket.on('msg', (data) => {
    io.emit('msg', { text: data.text, name: data.name });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
