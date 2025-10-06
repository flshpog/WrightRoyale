// Utility functions for game calculations
const { TOWERS } = require('./constants');

/**
 * Calculate card stats at a given level
 * @param {Object} baseStats - Base stats at level 1
 * @param {number} level - Current level (1-11)
 * @returns {Object} Scaled stats
 */
function calculateStatsForLevel(baseStats, level) {
  const multiplier = 1 + ((level - 1) * 0.1); // 10% increase per level
  
  return {
    hp: Math.floor(baseStats.hp * multiplier),
    damage: Math.floor(baseStats.damage * multiplier),
    range: baseStats.range, // Range doesn't scale
    speed: baseStats.speed,
    attackSpeed: baseStats.attackSpeed,
  };
}

/**
 * Calculate tower stats at a given level
 * @param {string} towerType - 'king' or 'princess'
 * @param {number} level - Tower level
 * @returns {Object} Tower stats
 */
function calculateTowerStats(towerType, level) {
const baseStats = towerType === 'king' ? TOWERS.KING : TOWERS.PRINCESS;
  const multiplier = 1 + ((level - 1) * 0.1);
  
  return {
    hp: Math.floor(baseStats.HP_BASE * multiplier),
    damage: Math.floor(baseStats.DAMAGE_BASE * multiplier),
    range: baseStats.RANGE,
    attackSpeed: baseStats.ATTACK_SPEED,
  };
}

/**
 * Calculate distance between two points
 * @param {Object} pos1 - {x, y}
 * @param {Object} pos2 - {x, y}
 * @returns {number} Distance
 */
function getDistance(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if target is in range
 * @param {Object} attacker - Entity with position and range
 * @param {Object} target - Target entity with position
 * @returns {boolean} Is in range
 */
function isInRange(attacker, target) {
  const distance = getDistance(attacker.position, target.position);
  return distance <= attacker.range;
}

/**
 * Find nearest enemy target
 * @param {Object} entity - Entity looking for target
 * @param {Array} enemies - Array of potential targets
 * @param {string} targetType - What this entity can target
 * @returns {Object|null} Nearest valid target
 */
function findNearestTarget(entity, enemies, targetType) {
  let nearest = null;
  let minDistance = Infinity;

  for (const enemy of enemies) {
    // Check if this entity can target this enemy type
    if (targetType === 'ground' && enemy.flying) continue;
    if (targetType === 'air' && !enemy.flying) continue;
    
    const distance = getDistance(entity.position, enemy.position);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = enemy;
    }
  }

  return nearest;
}

/**
 * Calculate damage after considering armor/resistance
 * @param {number} baseDamage - Base damage value
 * @param {number} armor - Target's armor value
 * @returns {number} Final damage
 */
function calculateDamage(baseDamage, armor = 0) {
  const reduction = armor / (armor + 100);
  return Math.max(1, Math.floor(baseDamage * (1 - reduction)));
}

/**
 * Generate unique ID for entities
 * @returns {string} Unique ID
 */
function generateEntityId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if position is valid on battlefield
 * @param {Object} position - {x, y}
 * @param {number} playerSide - 0 for bottom, 1 for top
 * @returns {boolean} Is valid position
 */
function isValidDeployPosition(position, playerSide) {
  const { ARENA } = require('./constants');
  
  // Check if within arena bounds
  if (position.x < 0 || position.x > ARENA.WIDTH) return false;
  if (position.y < 0 || position.y > ARENA.HEIGHT) return false;
  
  // Check if on player's side
  if (playerSide === 0) {
    return position.y > ARENA.BRIDGE_Y;
  } else {
    return position.y < ARENA.BRIDGE_Y;
  }
}

module.exports = {
  calculateStatsForLevel,
  calculateTowerStats,
  getDistance,
  isInRange,
  findNearestTarget,
  calculateDamage,
  generateEntityId,
  isValidDeployPosition,
};