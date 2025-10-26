// ===== WRIGHT ROYALE CARD DEFINITIONS =====

// Card types
const CardType = {
    TROOP: 'troop',
    SPELL: 'spell',
    BUILDING: 'building',
    TOWER: 'tower'
};

// Rarity levels
const Rarity = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary',
    CHAMPION: 'champion'
};

// Target types
const TargetType = {
    GROUND: 'ground',
    AIR: 'air',
    AIR_AND_GROUND: 'air & ground',
    BUILDINGS: 'buildings'
};

// Transport types
const TransportType = {
    GROUND: 'ground',
    AIR: 'air'
};

// Speed values (tiles per second)
const Speed = {
    SLOW: 45,
    MEDIUM: 60,
    FAST: 90,
    VERY_FAST: 120
};

// ===== CARD DATABASE =====
const CARDS = {
    knight: {
        id: 'knight',
        name: 'Knight',
        description: "A tough melee fighter. The Barbarian's handsome, cultured cousin. Rumor has it that he was knighted based on the sheer awesomeness of his moustache alone.",
        type: CardType.TROOP,
        rarity: Rarity.COMMON,
        elixirCost: 3,

        // Troop stats
        health: 1766,
        damage: 202,
        hitSpeed: 1.2,
        firstHitSpeed: 0.5,
        speed: Speed.MEDIUM,
        deployTime: 1,
        range: 1.2,
        target: TargetType.GROUND,
        count: 1,
        transport: TransportType.GROUND,

        // Visual
        color: '#c0c0c0',
        size: 1.0
    },

    archers: {
        id: 'archers',
        name: 'Archers',
        description: "A pair of lightly armored ranged attackers. They'll help you take down ground and air units, but you're on your own with hair coloring advice.",
        type: CardType.TROOP,
        rarity: Rarity.COMMON,
        elixirCost: 3,

        // Troop stats
        health: 304,
        damage: 112,
        hitSpeed: 0.9,
        firstHitSpeed: 0.5,
        speed: Speed.MEDIUM,
        deployTime: 1,
        range: 5,
        projectileSpeed: 600,
        target: TargetType.AIR_AND_GROUND,
        count: 2,
        transport: TransportType.GROUND,

        // Visual
        color: '#ff69b4',
        size: 0.8
    },

    minions: {
        id: 'minions',
        name: 'Minions',
        description: "Three fast, unarmored flying attackers. Roses are red, minions are blue, they can fly, and will crush you!",
        type: CardType.TROOP,
        rarity: Rarity.COMMON,
        elixirCost: 3,

        // Troop stats
        health: 230,
        damage: 117,
        hitSpeed: 1.1,
        firstHitSpeed: 0.5,
        speed: Speed.FAST,
        deployTime: 1,
        range: 2.5,
        projectileSpeed: 1000,
        target: TargetType.AIR_AND_GROUND,
        count: 3,
        transport: TransportType.AIR,

        // Visual
        color: '#4169e1',
        size: 0.7
    },

    arrows: {
        id: 'arrows',
        name: 'Arrows',
        description: "Arrows pepper a large area, damaging all enemies hit. Reduced damage to crown towers. They will do damage across 3 very small intervals.",
        type: CardType.SPELL,
        rarity: Rarity.COMMON,
        elixirCost: 3,

        // Spell stats
        radius: 3.5,
        target: TargetType.AIR_AND_GROUND,
        areaDamage: 122,
        damageHits: 3,
        crownTowerDamage: 31,

        // Visual
        color: '#8b4513',
        effectDuration: 0.6
    },

    fireball: {
        id: 'fireball',
        name: 'Fireball',
        description: "Annnnnnd... Fireball. Incinerates a small area, dealing high damage. Reduced damage to crown towers.",
        type: CardType.SPELL,
        rarity: Rarity.RARE,
        elixirCost: 4,

        // Spell stats
        radius: 2.5,
        target: TargetType.AIR_AND_GROUND,
        areaDamage: 688,
        damageHits: 1,
        crownTowerDamage: 207,

        // Visual
        color: '#ff4500',
        effectDuration: 0.8
    },

    giant: {
        id: 'giant',
        name: 'Giant',
        description: "Slow but durable, only attacks buildings. A real one-man wrecking crew!",
        type: CardType.TROOP,
        rarity: Rarity.RARE,
        elixirCost: 5,

        // Troop stats
        health: 4090,
        damage: 253,
        hitSpeed: 1.5,
        firstHitSpeed: 0.5,
        speed: Speed.SLOW,
        deployTime: 1,
        range: 1.2,
        target: TargetType.BUILDINGS,
        count: 1,
        transport: TransportType.GROUND,

        // Visual
        color: '#d2691e',
        size: 1.6
    },

    miniokran: {
        id: 'miniokran',
        name: 'Mini O.K.R.A.N',
        description: "Miniature version of the fabled Okran! Does heaps of damage, but not quickly. Loves waffles!",
        type: CardType.TROOP,
        rarity: Rarity.RARE,
        elixirCost: 4,

        // Troop stats
        health: 1433,
        damage: 755,
        hitSpeed: 1.6,
        firstHitSpeed: 0.5,
        speed: Speed.FAST,
        deployTime: 1,
        range: 0.8,
        target: TargetType.GROUND,
        count: 1,
        transport: TransportType.GROUND,

        // Visual
        color: '#9370db',
        size: 1.1
    },

    musketeer: {
        id: 'musketeer',
        name: 'Musketeer',
        description: "Don't be fooled by her delicately coiffed hair, the Musketeer is a mean shot with her trusty broomstick.",
        type: CardType.TROOP,
        rarity: Rarity.RARE,
        elixirCost: 4,

        // Troop stats
        health: 598,
        damage: 176,
        hitSpeed: 1,
        firstHitSpeed: 0.7,
        speed: Speed.MEDIUM,
        deployTime: 1,
        range: 6,
        projectileSpeed: 1000,
        target: TargetType.AIR_AND_GROUND,
        count: 1,
        transport: TransportType.GROUND,

        // Visual
        color: '#ff1493',
        size: 0.9
    },

    princess_tower: {
        id: 'princess_tower',
        name: 'Princess Tower',
        description: "A defensive tower that protects your side of the arena. Shoots arrows at approaching enemies.",
        type: CardType.TOWER,
        rarity: Rarity.COMMON,
        elixirCost: 0, // Towers don't cost elixir

        // Tower stats
        health: 3052,
        damage: 109,
        hitSpeed: 0.8,
        firstHitSpeed: 0.8,
        speed: 0, // Towers don't move
        deployTime: 0,
        range: 7.5,
        projectileSpeed: 800,
        target: TargetType.AIR_AND_GROUND,
        count: 1,
        transport: TransportType.GROUND,

        // Visual
        color: '#9b59b6',
        size: 1.5
    },

    king_tower: {
        id: 'king_tower',
        name: 'King Tower',
        description: "The King's main tower. Activates when a Princess Tower is destroyed or when damaged. Protects the King!",
        type: CardType.TOWER,
        rarity: Rarity.COMMON,
        elixirCost: 0, // Towers don't cost elixir

        // Tower stats
        health: 4824,
        damage: 109,
        hitSpeed: 1.0,
        firstHitSpeed: 1.0,
        speed: 0, // Towers don't move
        deployTime: 0,
        range: 7,
        projectileSpeed: 800,
        target: TargetType.AIR_AND_GROUND,
        count: 1,
        transport: TransportType.GROUND,

        // Visual
        color: '#e74c3c',
        size: 2.0
    }
};

// Get all card IDs
function getAllCardIds() {
    return Object.keys(CARDS);
}

// Get card by ID
function getCard(cardId) {
    return CARDS[cardId];
}

// Get cards by type
function getCardsByType(type) {
    return Object.values(CARDS).filter(card => card.type === type);
}

// Get cards by rarity
function getCardsByRarity(rarity) {
    return Object.values(CARDS).filter(card => card.rarity === rarity);
}
