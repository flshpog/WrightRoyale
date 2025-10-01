// backend/src/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clash-royale', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ===== MODELS =====

// User Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Should be hashed
  email: { type: String, required: true, unique: true },
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    trophies: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 }
  },
  cards: [{
    cardId: String,
    level: { type: Number, default: 1 },
    count: { type: Number, default: 0 }
  }],
  decks: [{
    name: String,
    cards: [String], // Array of 8 card IDs
    isActive: Boolean
  }],
  gold: { type: Number, default: 100 },
  gems: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Battle Room Model
const battleRoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  players: [{
    userId: String,
    username: String,
    socketId: String,
    deck: [String],
    trophies: Number,
    isReady: Boolean
  }],
  gameState: {
    elixir: { player1: Number, player2: Number },
    towers: {
      player1: {
        king: { hp: Number },
        left: { hp: Number },
        right: { hp: Number }
      },
      player2: {
        king: { hp: Number },
        left: { hp: Number },
        right: { hp: Number }
      }
    },
    troops: Array,
    spells: Array,
    buildings: Array,
    currentTime: Number,
    isOvertime: Boolean
  },
  status: { type: String, enum: ['waiting', 'ready', 'in-progress', 'finished'], default: 'waiting' },
  winner: String,
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour
});

const BattleRoom = mongoose.model('BattleRoom', battleRoomSchema);

// ===== GAME LOGIC =====

// Card Definitions (Example cards)
const CARDS = {
  knight: {
    id: 'knight',
    name: 'Knight',
    type: 'troop',
    elixir: 3,
    stats: {
      hp: [600, 660, 726, 798, 876, 963, 1059, 1164, 1278, 1404, 1545],
      damage: [75, 82, 90, 99, 109, 120, 132, 144, 159, 174, 192],
      hitSpeed: 1.1,
      speed: 'medium',
      range: 'melee',
      targets: 'ground',
      deployTime: 1
    }
  },
  archer: {
    id: 'archer',
    name: 'Archers',
    type: 'troop',
    elixir: 3,
    count: 2,
    stats: {
      hp: [125, 137, 151, 166, 182, 200, 220, 241, 265, 291, 320],
      damage: [42, 46, 51, 56, 61, 67, 74, 81, 89, 98, 107],
      hitSpeed: 1.2,
      speed: 'medium',
      range: 5,
      targets: 'air_ground',
      deployTime: 1
    }
  },
  giant: {
    id: 'giant',
    name: 'Giant',
    type: 'troop',
    elixir: 5,
    stats: {
      hp: [2000, 2200, 2420, 2662, 2928, 3221, 3543, 3897, 4287, 4716, 5187],
      damage: [126, 138, 152, 167, 184, 202, 222, 244, 269, 295, 325],
      hitSpeed: 1.5,
      speed: 'slow',
      range: 'melee',
      targets: 'buildings',
      deployTime: 1
    }
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    type: 'spell',
    elixir: 4,
    stats: {
      damage: [325, 357, 393, 432, 476, 523, 572, 627, 689, 757, 833],
      radius: 2.5,
      duration: 0
    }
  },
  cannon: {
    id: 'cannon',
    name: 'Cannon',
    type: 'building',
    elixir: 3,
    stats: {
      hp: [450, 495, 544, 599, 659, 725, 797, 877, 965, 1061, 1167],
      damage: [60, 66, 72, 79, 87, 96, 105, 116, 127, 140, 154],
      hitSpeed: 0.8,
      range: 5.5,
      targets: 'ground',
      lifetime: 30
    }
  },
  arrows: {
    id: 'arrows',
    name: 'Arrows',
    type: 'spell',
    elixir: 3,
    stats: {
      damage: [115, 126, 139, 152, 168, 184, 203, 223, 245, 270, 297],
      radius: 4,
      duration: 0
    }
  },
  minion: {
    id: 'minion',
    name: 'Minions',
    type: 'troop',
    elixir: 3,
    count: 3,
    stats: {
      hp: [90, 99, 108, 119, 131, 144, 158, 173, 190, 209, 230],
      damage: [40, 44, 48, 53, 58, 64, 70, 77, 84, 93, 102],
      hitSpeed: 1,
      speed: 'fast',
      range: 2,
      targets: 'air_ground',
      deployTime: 1,
      flying: true
    }
  },
  goblin: {
    id: 'goblin',
    name: 'Goblins',
    type: 'troop',
    elixir: 2,
    count: 3,
    stats: {
      hp: [80, 88, 96, 106, 116, 128, 140, 154, 169, 186, 205],
      damage: [50, 55, 60, 66, 73, 80, 88, 96, 106, 116, 128],
      hitSpeed: 1.1,
      speed: 'very_fast',
      range: 'melee',
      targets: 'ground',
      deployTime: 1
    }
  }
};

// Game State Manager
class GameStateManager {
  constructor(io) {
    this.io = io;
    this.activeGames = new Map();
    this.gameLoops = new Map();
  }

  async createRoom(userId, username) {
    const roomCode = this.generateRoomCode();
    const room = new BattleRoom({
      roomCode,
      players: [{
        userId,
        username,
        socketId: null,
        deck: [],
        trophies: 0,
        isReady: false
      }],
      gameState: this.initializeGameState()
    });
    
    await room.save();
    return roomCode;
  }

  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  initializeGameState() {
    return {
      elixir: { player1: 5, player2: 5 },
      towers: {
        player1: {
          king: { hp: 2400, x: 8.5, y: 1 },
          left: { hp: 1400, x: 3.5, y: 6 },
          right: { hp: 1400, x: 13.5, y: 6 }
        },
        player2: {
          king: { hp: 2400, x: 8.5, y: 31 },
          left: { hp: 1400, x: 3.5, y: 26 },
          right: { hp: 1400, x: 13.5, y: 26 }
        }
      },
      troops: [],
      spells: [],
      buildings: [],
      currentTime: 180, // 3 minutes
      isOvertime: false
    };
  }

  startGameLoop(roomCode) {
    const loop = setInterval(async () => {
      const room = await BattleRoom.findOne({ roomCode });
      if (!room || room.status === 'finished') {
        this.stopGameLoop(roomCode);
        return;
      }

      // Update game state
      this.updateGameState(room);
      
      // Broadcast state to players
      this.io.to(roomCode).emit('gameStateUpdate', room.gameState);

      // Check win conditions
      const winner = this.checkWinCondition(room.gameState);
      if (winner) {
        room.status = 'finished';
        room.winner = winner;
        await room.save();
        this.io.to(roomCode).emit('gameEnd', { winner });
        this.stopGameLoop(roomCode);
      }

      await room.save();
    }, 100); // 10 updates per second

    this.gameLoops.set(roomCode, loop);
  }

  stopGameLoop(roomCode) {
    const loop = this.gameLoops.get(roomCode);
    if (loop) {
      clearInterval(loop);
      this.gameLoops.delete(roomCode);
    }
  }

  updateGameState(room) {
    const state = room.gameState;
    const deltaTime = 0.1; // 100ms

    // Update timer
    state.currentTime -= deltaTime;
    if (state.currentTime <= 0 && !state.isOvertime) {
      state.isOvertime = true;
      state.currentTime = 60; // 1 minute overtime
    }

    // Regenerate elixir (1 elixir per 2.8 seconds)
    const elixirRate = state.isOvertime ? 1/1.4 : 1/2.8;
    state.elixir.player1 = Math.min(10, state.elixir.player1 + elixirRate * deltaTime);
    state.elixir.player2 = Math.min(10, state.elixir.player2 + elixirRate * deltaTime);

    // Update troops
    state.troops = state.troops.filter(troop => {
      // Move troops
      this.moveTroop(troop, state, deltaTime);
      
      // Attack logic
      this.handleTroopAttack(troop, state, deltaTime);
      
      // Remove dead troops
      return troop.hp > 0;
    });

    // Update buildings (lifetime)
    state.buildings = state.buildings.filter(building => {
      building.lifetime -= deltaTime;
      this.handleBuildingAttack(building, state, deltaTime);
      return building.lifetime > 0 && building.hp > 0;
    });

    // Process spells (instant effects)
    state.spells = [];
  }

  moveTroop(troop, state, deltaTime) {
    if (troop.target) {
      const dx = troop.target.x - troop.x;
      const dy = troop.target.y - troop.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > troop.range) {
        // Move towards target
        const speed = this.getTroopSpeed(troop.speed);
        const moveDistance = speed * deltaTime;
        troop.x += (dx / distance) * moveDistance;
        troop.y += (dy / distance) * moveDistance;
      }
    } else {
      // Find new target
      troop.target = this.findTarget(troop, state);
    }
  }

  getTroopSpeed(speedType) {
    const speeds = {
      slow: 0.45,
      medium: 0.6,
      fast: 0.9,
      very_fast: 1.2
    };
    return speeds[speedType] || 0.6;
  }

  findTarget(troop, state) {
    const enemyPlayer = troop.owner === 'player1' ? 'player2' : 'player1';
    const targets = [];

    // Add enemy troops
    state.troops.forEach(t => {
      if (t.owner === enemyPlayer) {
        targets.push(t);
      }
    });

    // Add enemy buildings
    state.buildings.forEach(b => {
      if (b.owner === enemyPlayer) {
        targets.push(b);
      }
    });

    // Add enemy towers
    const towers = state.towers[enemyPlayer];
    if (towers.left.hp > 0) targets.push({ ...towers.left, type: 'tower' });
    if (towers.right.hp > 0) targets.push({ ...towers.right, type: 'tower' });
    if (towers.king.hp > 0) targets.push({ ...towers.king, type: 'tower' });

    // Find nearest target
    let nearest = null;
    let minDistance = Infinity;
    
    targets.forEach(target => {
      const dx = target.x - troop.x;
      const dy = target.y - troop.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = target;
      }
    });

    return nearest;
  }

  handleTroopAttack(troop, state, deltaTime) {
    troop.attackCooldown = (troop.attackCooldown || 0) - deltaTime;
    
    if (troop.target && troop.attackCooldown <= 0) {
      const dx = troop.target.x - troop.x;
      const dy = troop.target.y - troop.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= troop.range) {
        // Deal damage
        troop.target.hp -= troop.damage;
        troop.attackCooldown = troop.hitSpeed;

        // Check if target is a tower
        if (troop.target.type === 'tower') {
          const enemyPlayer = troop.owner === 'player1' ? 'player2' : 'player1';
          this.updateTowerHP(state.towers[enemyPlayer], troop.target);
        }
      }
    }
  }

  handleBuildingAttack(building, state, deltaTime) {
    building.attackCooldown = (building.attackCooldown || 0) - deltaTime;
    
    if (building.attackCooldown <= 0) {
      const enemyPlayer = building.owner === 'player1' ? 'player2' : 'player1';
      const targets = state.troops.filter(t => t.owner === enemyPlayer);
      
      // Find target in range
      const target = targets.find(t => {
        const dx = t.x - building.x;
        const dy = t.y - building.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= building.range;
      });

      if (target) {
        target.hp -= building.damage;
        building.attackCooldown = building.hitSpeed;
      }
    }
  }

  updateTowerHP(towers, targetTower) {
    if (targetTower.x === towers.king.x && targetTower.y === towers.king.y) {
      towers.king.hp = Math.max(0, targetTower.hp);
    } else if (targetTower.x === towers.left.x && targetTower.y === towers.left.y) {
      towers.left.hp = Math.max(0, targetTower.hp);
    } else if (targetTower.x === towers.right.x && targetTower.y === towers.right.y) {
      towers.right.hp = Math.max(0, targetTower.hp);
    }
  }

  checkWinCondition(state) {
    if (state.towers.player1.king.hp <= 0) return 'player2';
    if (state.towers.player2.king.hp <= 0) return 'player1';
    
    if (state.currentTime <= 0 && state.isOvertime) {
      // Count tower damage
      const p1Damage = (1400 - state.towers.player2.left.hp) + 
                       (1400 - state.towers.player2.right.hp) + 
                       (2400 - state.towers.player2.king.hp);
      const p2Damage = (1400 - state.towers.player1.left.hp) + 
                       (1400 - state.towers.player1.right.hp) + 
                       (2400 - state.towers.player1.king.hp);
      
      if (p1Damage > p2Damage) return 'player1';
      if (p2Damage > p1Damage) return 'player2';
      return 'draw';
    }
    
    return null;
  }

  async deployCard(roomCode, playerId, cardId, x, y) {
    const room = await BattleRoom.findOne({ roomCode });
    if (!room || room.status !== 'in-progress') return false;

    const card = CARDS[cardId];
    if (!card) return false;

    const playerKey = room.players[0].userId === playerId ? 'player1' : 'player2';
    
    // Check elixir
    if (room.gameState.elixir[playerKey] < card.elixir) return false;
    
    // Deduct elixir
    room.gameState.elixir[playerKey] -= card.elixir;

    // Deploy based on card type
    if (card.type === 'troop') {
      const count = card.count || 1;
      for (let i = 0; i < count; i++) {
        const offset = i * 0.5 - (count - 1) * 0.25;
        room.gameState.troops.push({
          id: `${cardId}_${Date.now()}_${i}`,
          cardId,
          owner: playerKey,
          x: x + offset,
          y,
          hp: card.stats.hp[0], // Level 1 for now
          damage: card.stats.damage[0],
          hitSpeed: card.stats.hitSpeed,
          speed: card.stats.speed,
          range: card.stats.range === 'melee' ? 0.5 : card.stats.range,
          target: null,
          attackCooldown: 0
        });
      }
    } else if (card.type === 'spell') {
      // Apply instant spell effect
      this.applySpellEffect(room.gameState, card, x, y, playerKey);
    } else if (card.type === 'building') {
      room.gameState.buildings.push({
        id: `${cardId}_${Date.now()}`,
        cardId,
        owner: playerKey,
        x,
        y,
        hp: card.stats.hp[0],
        damage: card.stats.damage[0],
        hitSpeed: card.stats.hitSpeed,
        range: card.stats.range,
        lifetime: card.stats.lifetime,
        attackCooldown: 0
      });
    }

    await room.save();
    this.io.to(roomCode).emit('cardDeployed', { playerId, cardId, x, y });
    return true;
  }

  applySpellEffect(state, card, x, y, owner) {
    const enemyPlayer = owner === 'player1' ? 'player2' : 'player1';
    
    // Damage all enemies in radius
    state.troops.forEach(troop => {
      if (troop.owner === enemyPlayer) {
        const dx = troop.x - x;
        const dy = troop.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= card.stats.radius) {
          troop.hp -= card.stats.damage[0];
        }
      }
    });

    // Check towers
    const towers = state.towers[enemyPlayer];
    ['king', 'left', 'right'].forEach(towerKey => {
      const tower = towers[towerKey];
      if (tower.hp > 0) {
        const dx = tower.x - x;
        const dy = tower.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= card.stats.radius) {
          tower.hp = Math.max(0, tower.hp - card.stats.damage[0] * 0.35); // Crown tower damage reduction
        }
      }
    });
  }
}

// Initialize game state manager
const gameManager = new GameStateManager(io);

// ===== ROUTES =====

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user (password should be hashed in production)
    const user = new User({
      username,
      password, // Hash this in production!
      email,
      cards: Object.keys(CARDS).map(cardId => ({
        cardId,
        level: 1,
        count: 10
      })),
      decks: [{
        name: 'Default Deck',
        cards: Object.keys(CARDS).slice(0, 8),
        isActive: true
      }]
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        stats: user.stats,
        cards: user.cards,
        decks: user.decks
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        stats: user.stats,
        cards: user.cards,
        decks: user.decks
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game routes
app.post('/api/rooms/create', authenticateToken, async (req, res) => {
  try {
    const roomCode = await gameManager.createRoom(req.user.userId, req.user.username);
    res.json({ roomCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rooms/join', authenticateToken, async (req, res) => {
  try {
    const { roomCode } = req.body;
    const room = await BattleRoom.findOne({ roomCode });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (room.players.length >= 2) {
      return res.status(400).json({ error: 'Room is full' });
    }

    room.players.push({
      userId: req.user.userId,
      username: req.user.username,
      socketId: null,
      deck: [],
      trophies: 0,
      isReady: false
    });
    
    await room.save();
    res.json({ roomCode, room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cards', (req, res) => {
  res.json(CARDS);
});

app.post('/api/decks/save', authenticateToken, async (req, res) => {
  try {
    const { deckName, cards } = req.body;
    
    if (cards.length !== 8) {
      return res.status(400).json({ error: 'Deck must contain exactly 8 cards' });
    }

    const user = await User.findById(req.user.userId);
    const existingDeckIndex = user.decks.findIndex(d => d.name === deckName);
    
    if (existingDeckIndex >= 0) {
      user.decks[existingDeckIndex].cards = cards;
    } else {
      user.decks.push({
        name: deckName,
        cards,
        isActive: user.decks.length === 0
      });
    }
    
    await user.save();
    res.json({ decks: user.decks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ===== SOCKET.IO HANDLERS =====

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', async ({ roomCode, userId, deck }) => {
    try {
      const room = await BattleRoom.findOne({ roomCode });
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Update player socket ID
      const player = room.players.find(p => p.userId === userId);
      if (player) {
        player.socketId = socket.id;
        player.deck = deck;
        await room.save();
      }

      socket.join(roomCode);
      io.to(roomCode).emit('roomUpdate', room);

      // Start game if both players ready
      if (room.players.length === 2 && room.players.every(p => p.deck.length === 8)) {
        room.status = 'in-progress';
        await room.save();
        gameManager.startGameLoop(roomCode);
        io.to(roomCode).emit('gameStart', room.gameState);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('deployCard', async ({ roomCode, userId, cardId, x, y }) => {
    try {
      const success = await gameManager.deployCard(roomCode, userId, cardId, x, y);
      if (!success) {
        socket.emit('deployError', { message: 'Cannot deploy card' });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    // Handle player disconnection
    const rooms = await BattleRoom.find({ 'players.socketId': socket.id });
    for (const room of rooms) {
      if (room.status === 'in-progress') {
        // Pause or end game
        room.status = 'finished';
        room.winner = 'opponent_disconnected';
        await room.save();
        gameManager.stopGameLoop(room.roomCode);
        io.to(room.roomCode).emit('playerDisconnected');
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});