const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'Frontend')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const activeRooms = {};
const COLORS = ['green', 'yellow', 'blue', 'red'];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create_room', (name) => {
    const code = generateRoomCode();
    const playerName = name || 'Player 1';
    activeRooms[code] = {
      host: socket.id,
      players: [
        { socketId: socket.id, color: 'green', name: playerName, isCpu: false }
      ],
      turn: 'green',
      active: true
    };
    socket.join(code);
    socket.emit('room_created', { code, color: 'green', players: activeRooms[code].players });
    console.log(`Room ${code} created by ${socket.id}`);
  });

  socket.on('join_room', (code, name) => {
    const room = activeRooms[code];
    if (!room || !room.active) {
      socket.emit('join_error', 'Invalid room code.');
      return;
    }
    if (room.players.length >= 4) {
      socket.emit('join_error', 'Room is full.');
      return;
    }
    if (room.players.find(p => p.socketId === socket.id)) {
      socket.emit('join_error', 'Already in room.');
      return;
    }

    const color = COLORS[room.players.length];
    const playerName = name || `Player ${room.players.length + 1}`;
    room.players.push({ socketId: socket.id, color, name: playerName, isCpu: false });
    socket.join(code);
    socket.emit('room_joined', { code, color, players: room.players });

    io.to(code).emit('player_joined', {
      playerCount: room.players.length,
      players: room.players
    });
    console.log(`${socket.id} joined room ${code} as ${color}`);

    if (room.players.length === 4) {
      room.started = true;
      io.to(code).emit('game_start', { players: room.players });
      io.to(code).emit('turn_change', { turn: room.turn });
    }
  });

  socket.on('start_game', (code) => {
    const room = activeRooms[code];
    if (!room || !room.active) return;
    if (room.host !== socket.id) {
      socket.emit('start_error', 'Only the host can start the game.');
      return;
    }
    if (room.players.length < 2) {
      socket.emit('start_error', 'Need at least 2 players to start.');
      return;
    }

    // Fill remaining seats with CPU players so 4 seats are active in total
    let cpuNum = 1;
    while (room.players.length < 4) {
      const color = COLORS[room.players.length];
      room.players.push({
        socketId: null,
        color: color,
        name: `CPU ${cpuNum++}`,
        isCpu: true,
        connected: true
      });
    }

    room.started = true;
    room.turn = 'green';
    io.to(code).emit('game_start', { players: room.players });
    io.to(code).emit('turn_change', { turn: room.turn });
  });

  socket.on('reconnect_player', (data) => {
    const { roomCode, playerColor } = data || {};
    const room = activeRooms[roomCode];
    if (!room || !room.active) {
      socket.emit('reconnect_failed', 'Room no longer exists.');
      return;
    }
    const player = room.players.find(p => p.color === playerColor);
    if (!player) {
      socket.emit('reconnect_failed', 'Player not found in room.');
      return;
    }

    player.socketId = socket.id;
    player.connected = true;
    socket.join(roomCode);

    const currentHost = room.players.find(p => p.socketId === room.host);
    if (!currentHost || !currentHost.connected) {
      room.host = socket.id;
    }

    socket.emit('reconnect_success', {
      code: roomCode,
      color: playerColor,
      players: room.players,
      started: room.started,
      turn: room.turn,
      isHost: room.host === socket.id
    });

    io.to(roomCode).emit('player_reconnected', {
      color: playerColor,
      name: player.name,
      players: room.players
    });
    console.log(`Player ${player.name} (${playerColor}) reconnected to room ${roomCode}`);
  });

  socket.on('request_roll', (code) => {
    const room = activeRooms[code];
    if (!room || !room.active) return;
    const currentTurn = room.turn;
    const activePlayer = room.players.find(p => p.color === currentTurn);
    if (!activePlayer) return;

    if (activePlayer.isCpu) {
      if (room.host !== socket.id) {
        socket.emit('roll_error', 'Only host controls CPU.');
        return;
      }
    } else {
      if (activePlayer.socketId !== socket.id) {
        socket.emit('roll_error', 'Not your turn.');
        return;
      }
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;
    io.to(code).emit('roll_result', {
      value: diceValue,
      player: currentTurn
    });
  });

  socket.on('move_token', (data) => {
    const { roomCode, playerColor } = data;
    const room = activeRooms[roomCode];
    if (!room || !room.active) return;

    if (room.turn !== playerColor) {
      socket.emit('move_error', 'Not your turn.');
      return;
    }

    const activePlayer = room.players.find(p => p.color === playerColor);
    if (!activePlayer) return;

    if (activePlayer.isCpu) {
      if (room.host !== socket.id) {
        socket.emit('move_error', 'Only host controls CPU.');
        return;
      }
    } else {
      if (activePlayer.socketId !== socket.id) {
        socket.emit('move_error', 'Not your turn.');
        return;
      }
    }

    io.to(roomCode).emit('sync_move', data);
  });

  socket.on('turn_end', (code) => {
    const room = activeRooms[code];
    if (!room || !room.active) return;
    const currentIdx = COLORS.indexOf(room.turn);
    let nextIdx = (currentIdx + 1) % 4;
    let attempts = 0;
    while (attempts < 4) {
      const nextColor = COLORS[nextIdx];
      if (room.players.find(p => p.color === nextColor)) {
        room.turn = nextColor;
        break;
      }
      nextIdx = (nextIdx + 1) % 4;
      attempts++;
    }
    io.to(code).emit('turn_change', { turn: room.turn });
  });

  socket.on('leave_room', (code) => {
    const room = activeRooms[code];
    if (!room) return;
    const idx = room.players.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) {
      const leavingColor = room.players[idx].color;
      room.players.splice(idx, 1);
      io.to(code).emit('player_left', {
        playerCount: room.players.length,
        players: room.players,
        leftColor: leavingColor
      });
      if (room.players.length === 0) {
        delete activeRooms[code];
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const code of Object.keys(activeRooms)) {
      const room = activeRooms[code];
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.connected = false;
        player.socketId = null;

        if (room.started) {
          const activeHumans = room.players.filter(p => !p.isCpu && p.connected && p.socketId);
          if (room.host === socket.id && activeHumans.length > 0) {
            room.host = activeHumans[0].socketId;
          }
          io.to(code).emit('player_disconnected', {
            color: player.color,
            name: player.name,
            players: room.players
          });
        } else {
          const idx = room.players.indexOf(player);
          room.players.splice(idx, 1);
          if (room.players.length === 0) {
            delete activeRooms[code];
          } else {
            if (room.host === socket.id) {
              room.host = room.players[0].socketId;
            }
            io.to(code).emit('player_left', {
              playerCount: room.players.length,
              players: room.players,
              leftColor: player.color
            });
          }
        }
      }
    }
  });
});

const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 8080 : 3001);
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ludo Multiplayer Server running on port ${PORT}`);
  });
}

module.exports = { app, server, io };
