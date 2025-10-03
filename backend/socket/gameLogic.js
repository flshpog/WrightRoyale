// Core game logic engine
const { ELIXIR, MATCH_DURATION, GAME_STATE } = require('../../shared/constants');
const { generateEntityId, isValidDeployPosition, calculateTowerStats } = require('../../shared/gameUtils');
const CARDS = require('../../shared/cards/cardData');

// Import card classes
const Knight = require('../../shared/cards/troops/Knight');
const { createArchers } = require('../../shared/cards/troops/Archers');
const Giant = require('../../shared/cards/troops/Giant');
const Fireball = require('../../shared/cards/spells/Fireball');
const Cannon = require('../../shared/cards/buildings/Cannon');

class GameEngine {
  constructor(room) {
    this.room = room;
    this.startTime = Date.now();
    this.lastUpdate = this.startTime;
    
    // Initialize game state
    this.state = {
      status: GAME_STATE.PLAYING,
      currentTime: 0,
      elapsedTime: 0,
      
      // Player data
      players: {
        1: {
          id: room.hostId,
          username: room.hostUsername,
          elixir: ELIXIR.START,
          deck: room.hostDeck,
          hand: [],
          nextCardIndex: 4,
        },
        2: {
          id: room.guestId,
          username: room.guestUsername,
          elixir: ELIXIR.START,
          deck: room.guestDeck,
          hand: [],
          nextCardIndex: 4,
        },
      },
      
      // Entities on battlefield
      troops: [],
      buildings: [],
      spells: [],
      
      // Towers
      towers: {
        1: this.initializeTowers(1),
        2: this.initializeTowers(2),
      },
    };
    
    // Initialize player hands
    this.initializeHands();
  }

  initializeTowers(playerNumber) {
    const yPos = playerNumber === 1 ? 1100 : 100;
    const kingStats = calculateTowerStats('king', 9);
    const princessStats = calculateTowerStats('princess', 9);
    
    return [
      {
        id: `tower-${playerNumber}-left`,
        type: 'princess',
        position: { x: 200, y: yPos },
        ...princessStats,
        maxHp: princessStats.hp,
        playerId: playerNumber,
      },
      {
        id: `tower-${playerNumber}-king`,
        type: 'king',
        position: { x: 400, y: yPos },
        ...kingStats,
        maxHp: kingStats.hp,
        playerId: playerNumber,
      },
      {
        id: `tower-${playerNumber}-right`,
        type: 'princess',
        position: { x: 600, y: yPos },
        ...princessStats,
        maxHp: princessStats.hp,
        playerId: playerNumber,
      },
    ];
  }

  initializeHands() {
    // Shuffle and deal initial hands
    for (const playerId in this.state.players) {
      const player = this.state.players[playerId];
      const shuffled = [...player.deck].sort(() => Math.random() - 0.5);
      player.deck = shuffled;
      player.hand = shuffled.slice(0, 4);
    }
  }

  start() {
    this.lastElixirTime = Date.now();
  }

  update() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;
    
    this.state.currentTime = now;
    this.state.elapsedTime = now - this.startTime;
    
    // Update elixir
    this.updateElixir(now);
    
    // Update all entities
    this.updateTroops(deltaTime);
    this.updateBuildings(deltaTime);
    this.updateSpells(now);
    this.updateTowers(deltaTime);
    
    // Clean up dead/expired entities
    this.cleanup();
    
    // Check win condition
    this.checkWinCondition();
  }

  updateElixir(now) {
    const elixirRate = this.state.elapsedTime > 120000 ? ELIXIR.DOUBLE_REGEN_RATE : ELIXIR.REGEN_RATE;
    
    if (now - this.lastElixirTime >= elixirRate) {
      for (const playerId in this.state.players) {
        const player = this.state.players[playerId];
        if (player.elixir < ELIXIR.MAX) {
          player.elixir = Math.min(player.elixir + 1, ELIXIR.MAX);
        }
      }
      this.lastElixirTime = now;
    }
  }

  updateTroops(deltaTime) {
    this.state.troops.forEach(troop => {
      troop.update(deltaTime, this.state);
    });
  }

  updateBuildings(deltaTime) {
    this.state.buildings.forEach(building => {
      building.update(deltaTime, this.state);
    });
  }

  updateSpells(now) {
    this.state.spells.forEach(spell => {
      spell.update(now, this.state);
    });
  }

  updateTowers(deltaTime) {
    // Towers attack nearby enemies
    for (const playerId in this.state.towers) {
      this.state.towers[playerId].forEach(tower => {
        if (tower.hp <= 0) return;
        
        // Find nearest enemy in range
        const enemies = this.getEnemiesForTower(tower, parseInt(playerId));
        const target = this.findNearestInRange(tower, enemies);
        
        if (target && now - (tower.lastAttackTime || 0) >= tower.attackSpeed) {
          target.takeDamage(tower.damage);
          tower.lastAttackTime = now;
        }
      });
    }
  }

  getEnemiesForTower(tower, playerId) {
    const enemyPlayerId = playerId === 1 ? 2 : 1;
    return this.state.troops.filter(t => t.playerId === enemyPlayerId && t.hp > 0);
  }

  findNearestInRange(attacker, targets) {
    let nearest = null;
    let minDist = Infinity;
    
    targets.forEach(target => {
      const dist = this.getDistance(attacker.position, target.position);
      if (dist <= attacker.range * 50 && dist < minDist) {
        minDist = dist;
        nearest = target;
      }
    });
    
    return nearest;
  }

// WIP 


 //* getDistance(pos1, pos2) {
//    const dx = pos2.x - pos1.x;
//    const dy = pos2.y - pos1.y;
 //   return Math.sqrt(dx * dx + dy *
