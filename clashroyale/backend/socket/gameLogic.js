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

 WIP 


getDistance(pos1, pos2) {
   const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
   return Math.sqrt(dx * dx + dy *dy);
  }

  cleanup() {
    // Remove dead troops
    this.state.troops = this.state.troops.filter(t => t.hp > 0 && t.state !== 'dead');
    
    // Remove destroyed/expired buildings
    this.state.buildings = this.state.buildings.filter(b => 
      b.hp > 0 && b.state !== 'destroyed' && b.state !== 'expired'
    );
    
    // Remove completed spells
    this.state.spells = this.state.spells.filter(s => s.state !== 'complete');
  }

  checkWinCondition() {
    // Check if match time is up
    if (this.state.elapsedTime >= MATCH_DURATION) {
      this.state.status = GAME_STATE.OVERTIME;
      
      // In overtime, first tower destroyed wins
      // Or if overtime duration is reached, higher tower HP wins
      if (this.state.elapsedTime >= MATCH_DURATION + 180000) {
        this.endGame();
      }
    }

    // Check if king tower is destroyed
    for (const playerId in this.state.towers) {
      const kingTower = this.state.towers[playerId].find(t => t.type === 'king');
      if (kingTower && kingTower.hp <= 0) {
        this.state.status = GAME_STATE.FINISHED;
        this.state.winner = playerId === '1' ? 2 : 1;
      }
    }
  }

  endGame() {
    this.state.status = GAME_STATE.FINISHED;
    
    // Calculate total tower HP for each player
    const player1HP = this.state.towers[1].reduce((sum, t) => sum + t.hp, 0);
    const player2HP = this.state.towers[2].reduce((sum, t) => sum + t.hp, 0);
    
    if (player1HP > player2HP) {
      this.state.winner = 1;
    } else if (player2HP > player1HP) {
      this.state.winner = 2;
    } else {
      this.state.winner = 0; // Draw
    }
  }

  deployCard(playerNumber, cardId, position, level) {
    const player = this.state.players[playerNumber];
    
    // Validate player has card in hand
    const cardIndex = player.hand.findIndex(c => c === cardId);
    if (cardIndex === -1) {
      return { success: false, error: 'Card not in hand' };
    }

    // Get card data
    const cardData = CARDS[cardId];
    if (!cardData) {
      return { success: false, error: 'Invalid card' };
    }

    // Check elixir
    if (player.elixir < cardData.elixir) {
      return { success: false, error: 'Not enough elixir' };
    }

    // Validate position
    if (!isValidDeployPosition(position, playerNumber - 1)) {
      return { success: false, error: 'Invalid deploy position' };
    }

    // Deduct elixir
    player.elixir -= cardData.elixir;

    // Deploy card based on type
    const entityId = generateEntityId();
    
    switch (cardData.type) {
      case 'troop':
        this.deployTroop(cardId, entityId, level, position, playerNumber);
        break;
      case 'spell':
        this.castSpell(cardId, entityId, level, position, playerNumber);
        break;
      case 'building':
        this.placeBuilding(cardId, entityId, level, position, playerNumber);
        break;
    }

    // Replace card in hand with next card from deck
    player.hand[cardIndex] = player.deck[player.nextCardIndex % player.deck.length];
    player.nextCardIndex++;

    return { success: true };
  }

  deployTroop(cardId, entityId, level, position, playerNumber) {
    let troops = [];

    switch (cardId) {
      case 'knight':
        troops = [new Knight(entityId, level, position, playerNumber)];
        break;
      case 'archers':
        troops = createArchers(entityId, level, position, playerNumber);
        break;
      case 'giant':
        troops = [new Giant(entityId, level, position, playerNumber)];
        break;
      // Add more troop types here
      default:
        console.warn(`Troop type ${cardId} not implemented, using Knight as placeholder`);
        troops = [new Knight(entityId, level, position, playerNumber)];
    }

    troops.forEach(troop => {
      troop.deployed = true;
      this.state.troops.push(troop);
    });
  }

  castSpell(cardId, entityId, level, position, playerNumber) {
    let spell;

    switch (cardId) {
      case 'fireball':
        spell = new Fireball(entityId, level, position, playerNumber);
        break;
      // Add more spell types here
      default:
        console.warn(`Spell type ${cardId} not implemented`);
        spell = new Fireball(entityId, level, position, playerNumber);
    }

    this.state.spells.push(spell);
  }

  placeBuilding(cardId, entityId, level, position, playerNumber) {
    let building;

    switch (cardId) {
      case 'cannon':
        building = new Cannon(entityId, level, position, playerNumber);
        break;
      // Add more building types here
      default:
        console.warn(`Building type ${cardId} not implemented`);
        building = new Cannon(entityId, level, position, playerNumber);
    }

    building.deployed = true;
    this.state.buildings.push(building);
  }

  getState() {
    return {
      ...this.state,
      // Serialize entities for network transmission
      troops: this.state.troops.map(t => t.serialize()),
      buildings: this.state.buildings.map(b => b.serialize()),
      spells: this.state.spells.map(s => s.serialize()),
    };
  }

  isFinished() {
    return this.state.status === GAME_STATE.FINISHED;
  }

  getResult() {
    return {
      winner: this.state.winner,
      player1: {
        username: this.state.players[1].username,
        towersDestroyed: this.state.towers[2].filter(t => t.hp <= 0).length,
      },
      player2: {
        username: this.state.players[2].username,
        towersDestroyed: this.state.towers[1].filter(t => t.hp <= 0).length,
      },
      duration: this.state.elapsedTime,
    };
  }
}

module.exports = { GameEngine };
