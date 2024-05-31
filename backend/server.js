const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors'); // Import cors

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow requests from this origin
    methods: ["GET", "POST"],
  }
});

const sequelize = new Sequelize('chat_app', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql'
});

const Message = sequelize.define('Message', {
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

sequelize.sync();

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('user connected', async (username) => {
    await User.upsert({ username, online: true });
    io.emit('user status', { username, online: true });
  });

  socket.on('disconnect', async () => {
    const username = socket.username;
    if (username) {
      await User.update({ online: false }, { where: { username } });
      io.emit('user status', { username, online: false });
    }
    console.log('user disconnected');
  });

  socket.on('chat message', async (data) => {
    const { username, message } = data;
    socket.username = username;
    const newMessage = await Message.create({ username, message });
    io.emit('chat message', newMessage);
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});
