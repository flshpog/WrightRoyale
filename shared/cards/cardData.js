// Complete card database for Clash Royale
const { RARITY, CARD_TYPE } = require('../constants');

const CARDS = {
  // TROOPS
  knight: {
    id: 'knight',
    name: 'Knight',
    description: 'A tough melee fighter with moderate hit points.',
    elixir: 3,
    type: CARD_TYPE.TROOP,
    rarity: RARITY.COMMON,
    baseStats: {
      hp: 1400,
      damage: 120,
      range: 1,
      speed: 1, // tiles per second
      attackSpeed: 1200, // ms
      deployTime: 1000,
      targets: 'ground',
    },
  },

  archers: {
    id: 'archers',
    name: 'Archers',
    description: 'Two ranged attackers that target air and ground.',
    elixir: 3,
    type: CARD_TYPE.TROOP,
    rarity: RARITY.COMMON,
    count: 2, // Spawns 2 units
    baseStats: {
      hp: 250,
      damage: 90,
      range: 5,
      speed: 1,
      attackSpeed: 1200,
      deployTime: 1000,
      targets: 'both',
    },
  },

  giant: {
    id: 'giant',
    name: 'Giant',
    description: 'Slow but durable, targets buildings.',
    elixir: 5,
    type: CARD_TYPE.TROOP,
    rarity: RARITY.RARE,
    baseStats: {
      hp: 3200,
      damage: 200,
      range: 1,
      speed: 0.7,
      attackSpeed: 1500,
      deployTime: 1000,
      targets: 'buildings',
    },
  },

  miniPekka: {
    id: 'miniPekka',
    name: 'Mini P.E.K.K.A',
    description: 'High damage melee unit.',
    elixir: 4,
    type: CARD_TYPE.TROOP,
    rarity: RARITY.RARE,
    baseStats: {
      hp: 1200,
      damage: 600,
      range: 1,
      speed: 1.2,
      attackSpeed: 1600,
      deployTime: 1000,
      targets: 'ground',
    },
  },

  musketeer: {
    id: 'musketeer',
    name: 'Musketeer',
    description: 'Long-range single-target shooter.',
    elixir: 4,
    type: CARD_TYPE.TROOP,
    rarity: RARITY.RARE,
    baseStats: {
      hp: 600,
      damage: 180,
      range: 6,
      speed: 1,
      attackSpeed: 1000,
      deployTime: 1000,
      targets: 'both',
    },
  },

  babyDragon: {
    id: 'babyDragon',
    name: 'Baby Dragon',
    description: 'Flying troop with area damage.',
    elixir: 4,
    type: CARD_TYPE.TROOP,
    rarity: RARITY.EPIC,
    baseStats: {
      hp: 1200,
      damage: 140,
      range: 3,
      speed: 1.5,
      attackSpeed: 1600,
      deployTime: 1000,
      targets: 'both',
      flying: true,
      areaRadius: 1.5,
    },
  },

  prince: {
    id: 'prince',
    name: 'Prince',
    description: 'Charges and deals double damage on first hit.',
    elixir: 5,
    type: CARD_TYPE.TROOP,
    rarity: RARITY.EPIC,
    baseStats: {
      hp: 1600,
      damage: 325,
      range: 2,
      speed: 1.5,
      attackSpeed: 1400,
      deployTime: 1000,
      targets: 'ground',
      chargeMultiplier: 2,
      chargeDuration: 3000,
    },
  },

  skeletonArmy: {
    id: 'skeletonArmy',
    name: 'Skeleton Army',
    description: 'Summons a group of skeletons.',
    elixir: 3,
    type: CARD_TYPE.TROOP,
    rarity: RARITY.EPIC,
    count: 15,
    baseStats: {
      hp: 70,
      damage: 70,
      range: 1,
      speed: 1.5,
      attackSpeed: 1000,
      deployTime: 1000,
      targets: 'ground',
    },
  },

  hogRider: {
    id: 'hogRider',
    name: 'Hog Rider',
    description: 'Fast building-targeting unit.',
    elixir: 4,
    type: CARD_TYPE.TROOP,
    rarity: RARITY.RARE,
    baseStats: {
      hp: 1600,
      damage: 260,
      range: 1,
      speed: 2.5,
      attackSpeed: 1600,
      deployTime: 1000,
      targets: 'buildings',
    },
  },

  // SPELLS
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Area damage spell.',
    elixir: 4,
    type: CARD_TYPE.SPELL,
    rarity: RARITY.RARE,
    baseStats: {
      damage: 575,
      radius: 2.5,
      castTime: 1000,
    },
  },

  goblinBarrel: {
    id: 'goblinBarrel',
    name: 'Goblin Barrel',
    description: 'Spawns 3 goblins at target.',
    elixir: 3,
    type: CARD_TYPE.SPELL,
    rarity: RARITY.EPIC,
    spawns: {
      unit: 'goblin',
      count: 3,
    },
    baseStats: {
      castTime: 1200,
    },
  },

  arrows: {
    id: 'arrows',
    name: 'Arrows',
    description: 'Covers a wide area with instant damage.',
    elixir: 3,
    type: CARD_TYPE.SPELL,
    rarity: RARITY.COMMON,
    baseStats: {
      damage: 240,
      radius: 4,
      castTime: 500,
    },
  },

  // BUILDINGS
  cannon: {
    id: 'cannon',
    name: 'Cannon',
    description: 'Defensive building that targets ground.',
    elixir: 3,
    type: CARD_TYPE.BUILDING,
    rarity: RARITY.COMMON,
    baseStats: {
      hp: 870,
      damage: 180,
      range: 5.5,
      attackSpeed: 800,
      lifetime: 30000, // 30 seconds
      deployTime: 1000,
      targets: 'ground',
    },
  },

  inferno: {
    id: 'inferno',
    name: 'Inferno Tower',
    description: 'Ramps up damage over time.',
    elixir: 5,
    type: CARD_TYPE.BUILDING,
    rarity: RARITY.RARE,
    baseStats: {
      hp: 1100,
      damage: 50, // Starting damage
      maxDamage: 1000,
      range: 6,
      attackSpeed: 400,
      lifetime: 40000,
      deployTime: 1000,
      targets: 'both',
      rampUpTime: 3000,
    },
  },

  tombstone: {
    id: 'tombstone',
    name: 'Tombstone',
    description: 'Spawns skeletons periodically.',
    elixir: 3,
    type: CARD_TYPE.BUILDING,
    rarity: RARITY.RARE,
    baseStats: {
      hp: 450,
      lifetime: 40000,
      deployTime: 1000,
      spawnInterval: 3000,
      spawnUnit: 'skeleton',
    },
  },
};

module.exports = CARDS;