// Game constants shared between client and server
module.exports = {
  // Arena dimensions
  ARENA: {
    WIDTH: 800,
    HEIGHT: 1200,
    BRIDGE_Y: 600,
  },

  // Elixir settings
  ELIXIR: {
    MAX: 10,
    START: 5,
    REGEN_RATE: 2800, // ms per elixir
    DOUBLE_TIME: 120000, // 2 minutes
    DOUBLE_REGEN_RATE: 1400,
  },

  // Tower positions and stats
  TOWERS: {
    KING: {
      HP_BASE: 4000,
      DAMAGE_BASE: 120,
      RANGE: 7,
      ATTACK_SPEED: 1000,
    },
    PRINCESS: {
      HP_BASE: 2400,
      DAMAGE_BASE: 90,
      RANGE: 7,
      ATTACK_SPEED: 800,
    },
  },

  // Card rarities
  RARITY: {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary',
  },

  // Card types
  CARD_TYPE: {
    TROOP: 'troop',
    SPELL: 'spell',
    BUILDING: 'building',
  },

  // Troop behaviors
  TARGET: {
    GROUND: 'ground',
    AIR: 'air',
    BOTH: 'both',
    BUILDINGS: 'buildings',
  },

  // Game states
  GAME_STATE: {
    WAITING: 'waiting',
    STARTING: 'starting',
    PLAYING: 'playing',
    OVERTIME: 'overtime',
    FINISHED: 'finished',
  },

  // Match duration
  MATCH_DURATION: 180000, // 3 minutes
  OVERTIME_DURATION: 180000, // 3 minutes overtime
};