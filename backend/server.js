const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST"],
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
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

// Sync models and start the server
sequelize.sync().then(() => {
  server.listen(process.env.PORT || 3001, () => {
    console.log(`listening on *:${process.env.PORT || 3001}`);
  });
});

// Endpoint to delete all messages
app.delete('/messages', async (req, res) => {
  try {
    await Message.destroy({ where: {} });
    res.status(200).send('All messages deleted');
  } catch (error) {
    res.status(500).send('Error deleting messages');
  }
});

io.on('connection', async (socket) => {
  console.log('a user connected');

  const messages = await Message.findAll();
  socket.emit('initial messages', messages);

  socket.on('user connected', async (username) => {
    socket.username = username;
    await User.upsert({ username, online: true });
    io.emit('user status', { username, online: true });

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

  socket.on('typing', (data) => {
    const { username, message } = data;
    socket.broadcast.emit('typing', { username, message });
  });
});
