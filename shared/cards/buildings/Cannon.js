// Cannon building - defensive structure
const { calculateStatsForLevel, findNearestTarget, isInRange } = require('../../gameUtils');
const CARDS = require('../cardData');

class Cannon {
  constructor(id, level, position, playerId) {
    this.id = id;
    this.cardId = 'cannon';
    this.level = level;
    this.position = position;
    this.playerId = playerId;
    this.type = 'building';
    
    const stats = calculateStatsForLevel(CARDS.cannon.baseStats, level);
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.range = stats.range * 50; // Convert to pixels
    this.attackSpeed = stats.attackSpeed;
    this.lifetime = CARDS.cannon.baseStats.lifetime;
    this.targets = stats.targets; // ground only
    
    this.target = null;
    this.lastAttackTime = 0;
    this.state = 'active';
    this.deployTime = null;
    this.deployed = false;
  }

  update(deltaTime, gameState) {
    if (!this.deployed) return;

    // Check lifetime
    if (!this.deployTime) {
      this.deployTime = gameState7678667
      .currentTime;
    }

    // Check if lifetime has expired
    if (gameState.currentTime - this.deployTime >= this.lifetime) {
      this.hp = 0;
      this.state = 'expired';
      return;
    }

    // Buildings don't move, only attack
    const enemies = this.getEnemies(gameState);
    this.target = findNearestTarget(this, enemies, this.targets);

    if (this.target && isInRange(this, this.target)) {
      this.state = 'attacking';
      this.attack(gameState.currentTime);
    } else {
      this.state = 'idle';
    }
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
      this.state = 'destroyed';
    }
  }

  getEnemies(gameState) {
    const enemies = [];
    const enemyPlayerId = this.playerId === 1 ? 2 : 1;

    // Cannons only target ground troops
    if (gameState.troops) {
      enemies.push(...gameState.troops.filter(t => 
        t.playerId === enemyPlayerId && 
        t.hp > 0 && 
        !t.flying
      ));
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
      remainingTime: this.deployTime ? this.lifetime - (Date.now() - this.deployTime) : this.lifetime,
    };
  }
}

module.exports = Cannon;