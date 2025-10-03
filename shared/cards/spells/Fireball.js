// Fireball spell - area damage
const { calculateStatsForLevel, getDistance } = require('../../gameUtils');
const CARDS = require('../cardData');

class Fireball {
  constructor(id, level, targetPosition, playerId) {
    this.id = id;
    this.cardId = 'fireball';
    this.level = level;
    this.targetPosition = targetPosition;
    this.playerId = playerId;
    this.type = 'spell';
    
    const stats = calculateStatsForLevel(CARDS.fireball.baseStats, level);
    this.damage = stats.damage;
    this.radius = CARDS.fireball.baseStats.radius * 50; // Convert to pixels
    this.castTime = CARDS.fireball.baseStats.castTime;
    
    this.state = 'casting';
    this.castStartTime = null;
    this.applied = false;
  }

  /**
   * Update fireball spell
   * @param {number} currentTime - Current game time
   * @param {Object} gameState - Current game state
   */
  update(currentTime, gameState) {
    if (this.applied) return;

    if (!this.castStartTime) {
      this.castStartTime = currentTime;
    }

    // Check if cast time has elapsed
    if (currentTime - this.castStartTime >= this.castTime) {
      this.applyDamage(gameState);
      this.applied = true;
      this.state = 'complete';
    }
  }

  /**
   * Apply damage to all entities in radius
   * @param {Object} gameState - Current game state
   */
  applyDamage(gameState) {
    const enemyPlayerId = this.playerId === 1 ? 2 : 1;
    const affectedEntities = [];

    // Damage enemy troops
    if (gameState.troops) {
      gameState.troops.forEach(troop => {
        if (troop.playerId === enemyPlayerId && troop.hp > 0) {
          const distance = getDistance(this.targetPosition, troop.position);
          if (distance <= this.radius) {
            troop.takeDamage(this.damage);
            affectedEntities.push(troop.id);
          }
        }
      });
    }

    // Damage enemy buildings
    if (gameState.buildings) {
      gameState.buildings.forEach(building => {
        if (building.playerId === enemyPlayerId && building.hp > 0) {
          const distance = getDistance(this.targetPosition, building.position);
          if (distance <= this.radius) {
            building.takeDamage(this.damage);
            affectedEntities.push(building.id);
          }
        }
      });
    }

    // Damage towers (with reduced damage)
    if (gameState.towers) {
      gameState.towers[enemyPlayerId].forEach(tower => {
        if (tower.hp > 0) {
          const distance = getDistance(this.targetPosition, tower.position);
          if (distance <= this.radius) {
            tower.takeDamage(Math.floor(this.damage * 0.4)); // 40% damage to towers
            affectedEntities.push(tower.id);
          }
        }
      });
    }

    return affectedEntities;
  }

  serialize() {
    return {
      id: this.id,
      cardId: this.cardId,
      level: this.level,
      targetPosition: this.targetPosition,
      playerId: this.playerId,
      state: this.state,
      damage: this.damage,
      radius: this.radius,
    };
  }
}

module.exports = Fireball;