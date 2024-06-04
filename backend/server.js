const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  }
});

const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
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

sequelize.sync().then(() => {
  server.listen(process.env.PORT || 3001, () => {
    console.log(`listening on *:${process.env.PORT || 3001}`);
  });
});

io.on('connection', async (socket) => {
  console.log('a user connected');

  // Fetch all messages and emit them to the newly connected client
  const messages = await Message.findAll();
  socket.emit('initial messages', messages);

  socket.on('user connected', async (username) => {
    socket.username = username; // Save the username to the socket object
    await User.upsert({ username, online: true });
    io.emit('user status', { username, online: true });

    // Check if admin is online and emit status
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (admin) {
      socket.emit('user status', { username: 'admin', online: admin.online });
    }
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

  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });
});
