// Archers troop implementation (spawns 2 units)
const { calculateStatsForLevel, findNearestTarget, isInRange } = require('../../gameUtils');
const CARDS = require('../cardData');

class Archer {
  constructor(id, level, position, playerId, index) {
    this.id = `${id}-${index}`;
    this.cardId = 'archers';
    this.level = level;
    // Spread archers slightly apart
    this.position = {
      x: position.x + (index === 0 ? -20 : 20),
      y: position.y,
    };
    this.playerId = playerId;
    this.type = 'troop';
    
    const stats = calculateStatsForLevel(CARDS.archers.baseStats, level);
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.range = stats.range;
    this.speed = stats.speed;
    this.attackSpeed = stats.attackSpeed;
    this.targets = stats.targets; // Can target air and ground
    
    this.target = null;
    this.lastAttackTime = 0;
    this.state = 'idle';
    this.deployed = false;
  }

  update(deltaTime, gameState) {
    if (!this.deployed) return;

    const enemies = this.getEnemies(gameState);
    this.target = findNearestTarget(this, enemies, this.targets);

    if (this.target) {
      if (isInRange(this, this.target)) {
        this.state = 'attacking';
        this.attack(gameState.currentTime);
      } else {
        this.state = 'moving';
        this.moveTowards(this.target.position, deltaTime);
      }
    } else {
      this.state = 'moving';
      this.moveForward(deltaTime);
    }
  }

  moveTowards(targetPos, deltaTime) {
    const dx = targetPos.x - this.position.x;
    const dy = targetPos.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const moveAmount = this.speed * (deltaTime / 1000) * 50;
      this.position.x += (dx / distance) * moveAmount;
      this.position.y += (dy / distance) * moveAmount;
    }
  }

  moveForward(deltaTime) {
    const moveAmount = this.speed * (deltaTime / 1000) * 50;
    this.position.y += (this.playerId === 1 ? -moveAmount : moveAmount);
  }

  attack(currentTime) {
    if (currentTime - this.lastAttackTime >= this.attackSpeed) {
      if (this.target && this.target.hp > 0) {
        this.target.takeDamage(this.damage);
        this.lastAttackTime = currentTime;
      }
    }
  }

  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
    }
  }

  getEnemies(gameState) {
    const enemies = [];
    const enemyPlayerId = this.playerId === 1 ? 2 : 1;

    if (gameState.troops) {
      enemies.push(...gameState.troops.filter(t => t.playerId === enemyPlayerId && t.hp > 0));
    }
    if (gameState.buildings) {
      enemies.push(...gameState.buildings.filter(b => b.playerId === enemyPlayerId && b.hp > 0));
    }
    if (gameState.towers) {
      enemies.push(...gameState.towers[enemyPlayerId].filter(t => t.hp > 0));
    }

    return enemies;
  }

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

// Factory function to create both archers
function createArchers(id, level, position, playerId) {
  return [
    new Archer(id, level, position, playerId, 0),
    new Archer(id, level, position, playerId, 1),
  ];
}

module.exports = { Archer, createArchers };