// Knight troop implementation
const { calculateStatsForLevel, findNearestTarget, isInRange } = require('../../gameUtils');
const CARDS = require('../cardData');

class Knight {
  constructor(id, level, position, playerId) {
    this.id = id;
    this.cardId = 'knight';
    this.level = level;
    this.position = position;
    this.playerId = playerId;
    this.type = 'troop';
    
    // Calculate stats for current level
    const stats = calculateStatsForLevel(CARDS.knight.baseStats, level);
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.range = stats.range;
    this.speed = stats.speed;
    this.attackSpeed = stats.attackSpeed;
    this.targets = stats.targets;
    
    // State
    this.target = null;
    this.lastAttackTime = 0;
    this.state = 'idle'; // idle, moving, attacking
    this.deployed = false;
  }

  /**
   * Update knight behavior each frame
   * @param {number} deltaTime - Time since last update
   * @param {Object} gameState - Current game state with all entities
   */
  update(deltaTime, gameState) {
    if (!this.deployed) return;

    // Find enemies (troops, buildings, towers)
    const enemies = this.getEnemies(gameState);
    
    // Find nearest target
    this.target = findNearestTarget(this, enemies, this.targets);

    if (this.target) {
      if (isInRange(this, this.target)) {
        // Attack if in range
        this.state = 'attacking';
        this.attack(gameState.currentTime);
      } else {
        // Move towards target
        this.state = 'moving';
        this.moveTowards(this.target.position, deltaTime);
      }
    } else {
      // No target, move forward
      this.state = 'moving';
      this.moveForward(deltaTime);
    }
  }

  /**
   * Move towards a position
   * @param {Object} targetPos - {x, y}
   * @param {number} deltaTime - Time delta
   */
  moveTowards(targetPos, deltaTime) {
    const dx = targetPos.x - this.position.x;
    const dy = targetPos.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const moveAmount = this.speed * (deltaTime / 1000) * 50; // 50 pixels per tile
      this.position.x += (dx / distance) * moveAmount;
      this.position.y += (dy / distance) * moveAmount;
    }
  }

  /**
   * Move forward towards enemy base
   * @param {number} deltaTime - Time delta
   */
  moveForward(deltaTime) {
    const moveAmount = this.speed * (deltaTime / 1000) * 50;
    // Move towards opponent's side (positive Y for player 1, negative for player 2)
    this.position.y += (this.playerId === 1 ? -moveAmount : moveAmount);
  }

  /**
   * Perform attack
   * @param {number} currentTime - Current game time
   */
  attack(currentTime) {
    if (currentTime - this.lastAttackTime >= this.attackSpeed) {
      if (this.target && this.target.hp > 0) {
        this.target.takeDamage(this.damage);
        this.lastAttackTime = currentTime;
      }
    }
  }

  /**
   * Take damage
   * @param {number} damage - Damage amount
   */
  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
    }
  }

  /**
   * Get all enemy entities
   * @param {Object} gameState - Current game state
   * @returns {Array} Enemy entities
   */
  getEnemies(gameState) {
    const enemies = [];
    const enemyPlayerId = this.playerId === 1 ? 2 : 1;

    // Add enemy troops
    if (gameState.troops) {
      enemies.push(...gameState.troops.filter(t => t.playerId === enemyPlayerId && t.hp > 0));
    }

    // Add enemy buildings
    if (gameState.buildings) {
      enemies.push(...gameState.buildings.filter(b => b.playerId === enemyPlayerId && b.hp > 0));
    }

    // Add enemy towers
    if (gameState.towers) {
      enemies.push(...gameState.towers[enemyPlayerId].filter(t => t.hp > 0));
    }

    return enemies;
  }

  /**
   * Serialize for network transmission
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      id: this.id,
      cardId: this.cardId,
      level: this.level,
      position: this.position,
      playerId: this.playerId,
      hp: this.hp,
      maxHp: this.maxHp,
      state: this.state,
      targetId: this.target ? this.target.id : null,
    };
  }
}

module.exports = Knight;