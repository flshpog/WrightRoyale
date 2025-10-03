// Socket.IO event handlers
const { nanoid } = require('nanoid');
const GameRoom = require('../models/GameRoom');
const { GameEngine } = require('./gameLogic');

// In-memory storage for active rooms and games
const activeRooms = new Map();
const activeGames = new Map();

function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Create room (host)
    socket.on('createRoom', ({ userId, username, deck }) => {
      const roomCode = nanoid(6).toUpperCase();
      const room = new GameRoom(roomCode, socket.id, username);
      room.hostDeck = deck;
      
      activeRooms.set(roomCode, room);
      socket.join(roomCode);
      
      socket.emit('roomCreated', { roomCode, room });
      console.log(`Room created: ${roomCode} by ${username}`);
    });

    // Join room (guest)
    socket.on('joinRoom', ({ roomCode, userId, username, deck }) => {
      const room = activeRooms.get(roomCode);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.isFull()) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      room.addGuest(socket.id, username);
      room.guestDeck = deck;
      socket.join(roomCode);
      
      io.to(roomCode).emit('roomUpdated', { room });
      console.log(`${username} joined room: ${roomCode}`);
    });

    // Start game
    socket.on('startGame', ({ roomCode }) => {
      const room = activeRooms.get(roomCode);
      
      if (!room || !room.isFull()) {
        socket.emit('error', { message: 'Cannot start game' });
        return;
      }

      room.status = 'playing';
      
      // Initialize game engine
      const gameEngine = new GameEngine(room);
      activeGames.set(roomCode, gameEngine);
      
      // Start game loop
      gameEngine.start();
      
      io.to(roomCode).emit('gameStarted', {
        gameState: gameEngine.getState(),
      });
      
      console.log(`Game started in room: ${roomCode}`);
    });

    // Deploy card
    socket.on('deployCard', ({ roomCode, cardId, position, level }) => {
      const gameEngine = activeGames.get(roomCode);
      const room = activeRooms.get(roomCode);
      
      if (!gameEngine || !room) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const playerNumber = room.getPlayerNumber(socket.id);
      const result = gameEngine.deployCard(playerNumber, cardId, position, level);
      
      if (result.success) {
        // Broadcast updated game state to both players
        io.to(roomCode).emit('gameStateUpdate', {
          gameState: gameEngine.getState(),
        });
      } else {
        socket.emit('error', { message: result.error });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      // Find and clean up rooms
      for (const [roomCode, room] of activeRooms.entries()) {
        if (room.hostId === socket.id || room.guestId === socket.id) {
          room.removePlayer(socket.id);
          
          // Notify other player
          io.to(roomCode).emit('playerDisconnected', {
            message: 'Opponent disconnected',
          });
          
          // Clean up
          activeGames.delete(roomCode);
          activeRooms.delete(roomCode);
          
          console.log(`Room ${roomCode} closed due to disconnect`);
        }
      }
    });
  });

  // Game update loop
  setInterval(() => {
    for (const [roomCode, gameEngine] of activeGames.entries()) {
      gameEngine.update();
      
      // Broadcast state to players
      io.to(roomCode).emit('gameStateUpdate', {
        gameState: gameEngine.getState(),
      });
      
      // Check if game is finished
      if (gameEngine.isFinished()) {
        const result = gameEngine.getResult();
        io.to(roomCode).emit('gameFinished', result);
        
        activeGames.delete(roomCode);
        activeRooms.delete(roomCode);
        
        console.log(`Game finished in room: ${roomCode}`);
      }
    }
  }, 1000 / 60); // 60 FPS update rate
}

module.exports = { initializeSocketHandlers };