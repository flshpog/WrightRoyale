// Giant troop - targets buildings only
const { calculateStatsForLevel, findNearestTarget, isInRange } = require('../../gameUtils');
const CARDS = require('../cardData');

class Giant {
  constructor(id, level, position, playerId) {
    this.id = id;
    this.cardId = 'giant';
    this.level = level;
    this.position = position;
    this.playerId = playerId;
    this.type = 'troop';
    
    const stats = calculateStatsForLevel(CARDS.giant.baseStats, level);
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.range = stats.range;
    this.speed = stats.speed;
    this.attackSpeed = stats.attackSpeed;
    this.targets = stats.targets; // buildings only
    
    this.target = null;
    this.lastAttackTime = 0;
    this.state = 'idle';
    this.deployed = false;
  }

  update(deltaTime, gameState) {
    if (!this.deployed) return;

    // Giants only target buildings and towers
    const enemies = this.getBuildingTargets(gameState);
    this.target = findNearestTarget(this, enemies, 'ground');

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

  /**
   * Get only buildings and towers (Giant ignores troops)
   */
  getBuildingTargets(gameState) {
    const targets = [];
    const enemyPlayerId = this.playerId === 1 ? 2 : 1;

    // Add enemy buildings
    if (gameState.buildings) {
      targets.push(...gameState.buildings.filter(b => b.playerId === enemyPlayerId && b.hp > 0));
    }

    // Add enemy towers
    if (gameState.towers) {
      targets.push(...gameState.towers[enemyPlayerId].filter(t => t.hp > 0));
    }

    return targets;
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

module.exports = Giant;