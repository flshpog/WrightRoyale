// ===== WRIGHT ROYALE GAME ENGINE =====

// ===== CONFIGURATION =====
const CONFIG = {
    gridWidth: 16,
    gridHeight: 32,
    tileSize: 40,
    elixirMax: 10,
    elixirStart: 7,
    elixirRegenRate: 2600, // milliseconds per elixir
    matchDuration: 180, // seconds (3 minutes)
};

// ===== GAME STATE =====
const GameState = {
    LOGO: 'logo',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ENDED: 'ended'
};

// ===== PLAYER DATA =====
const PlayerData = {
    gold: 1000,
    gems: 50,
    level: 1,
    trophies: 0,
    deck: [], // Will hold 8 card IDs
    collection: [] // Will hold all unlocked cards
};

// ===== MAIN GAME CLASS =====
class WrightRoyale {
    constructor() {
        this.state = GameState.LOGO;
        this.currentTab = 'shopTab';

        // Game elements
        this.logoScreen = document.getElementById('logoScreen');
        this.mainMenu = document.getElementById('mainMenu');
        this.gameScreen = document.getElementById('gameScreen');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game state variables
        this.elixir = CONFIG.elixirStart;
        this.lastElixirRegen = 0;
        this.matchTime = CONFIG.matchDuration;
        this.matchStartTime = 0;

        // Towers
        this.playerTowers = {
            left: { x: 4, y: 28, health: 100, maxHealth: 100, active: true },
            right: { x: 11, y: 28, health: 100, maxHealth: 100, active: true },
            king: { x: 7.5, y: 30, health: 150, maxHealth: 150, active: true }
        };

        this.enemyTowers = {
            left: { x: 4, y: 3, health: 100, maxHealth: 100, active: true },
            right: { x: 11, y: 3, health: 100, maxHealth: 100, active: true },
            king: { x: 7.5, y: 1, health: 150, maxHealth: 150, active: true }
        };

        // Game entities
        this.troops = [];
        this.projectiles = [];
        this.buildings = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showLogoScreen();
        this.updatePlayerUI();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Play button
        document.getElementById('playButton').addEventListener('click', () => {
            this.startGame();
        });

        // Exit game button
        document.getElementById('exitGame').addEventListener('click', () => {
            this.exitGame();
        });

        // Canvas click for troop placement
        this.canvas.addEventListener('click', (e) => {
            if (this.state === GameState.PLAYING) {
                this.handleCanvasClick(e);
            }
        });
    }

    showLogoScreen() {
        this.state = GameState.LOGO;
        this.logoScreen.classList.remove('hidden');
        this.mainMenu.classList.add('hidden');
        this.gameScreen.classList.add('hidden');

        // Auto-transition to menu after 3 seconds
        setTimeout(() => {
            this.showMainMenu();
        }, 3000);

        // Allow click to skip
        this.logoScreen.addEventListener('click', () => {
            this.showMainMenu();
        }, { once: true });
    }

    showMainMenu() {
        this.state = GameState.MENU;
        this.logoScreen.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');

        // Default to shop tab
        this.switchTab('shopTab');
    }

    switchTab(tabId) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });

        // Remove active from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabId).classList.remove('hidden');

        // Set active nav tab
        const activeNavTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeNavTab) {
            activeNavTab.classList.add('active');
        }

        this.currentTab = tabId;
    }

    updatePlayerUI() {
        document.getElementById('playerGold').textContent = PlayerData.gold;
        document.getElementById('playerGems').textContent = PlayerData.gems;
        document.getElementById('playerLevel').textContent = PlayerData.level;
        document.getElementById('playerTrophies').textContent = PlayerData.trophies;
    }

    startGame() {
        this.state = GameState.PLAYING;
        this.logoScreen.classList.add('hidden');
        this.mainMenu.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');

        // Reset game state
        this.elixir = CONFIG.elixirStart;
        this.matchTime = CONFIG.matchDuration;
        this.matchStartTime = Date.now();
        this.lastElixirRegen = Date.now();
        this.troops = [];
        this.projectiles = [];
        this.buildings = [];

        // Reset towers
        this.resetTowers();

        // Start game loop
        this.gameLoop();
    }

    exitGame() {
        this.state = GameState.MENU;
        this.showMainMenu();
    }

    resetTowers() {
        Object.values(this.playerTowers).forEach(tower => {
            tower.health = tower.maxHealth;
            tower.active = true;
        });

        Object.values(this.enemyTowers).forEach(tower => {
            tower.health = tower.maxHealth;
            tower.active = true;
        });
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to grid coordinates
        const gridX = Math.floor(x / CONFIG.tileSize);
        const gridY = Math.floor(y / CONFIG.tileSize);

        console.log(`Clicked grid: (${gridX}, ${gridY})`);

        // TODO: Handle card placement when cards are implemented
    }

    gameLoop() {
        if (this.state !== GameState.PLAYING) return;

        const now = Date.now();
        const deltaTime = 16; // Approximate 60 FPS

        // Update elixir
        if (now - this.lastElixirRegen >= CONFIG.elixirRegenRate) {
            if (this.elixir < CONFIG.elixirMax) {
                this.elixir++;
                this.updateElixirUI();
            }
            this.lastElixirRegen = now;
        }

        // Update match timer
        const elapsed = Math.floor((now - this.matchStartTime) / 1000);
        this.matchTime = Math.max(0, CONFIG.matchDuration - elapsed);
        this.updateTimerUI();

        // Check for match end
        if (this.matchTime <= 0) {
            this.endMatch();
            return;
        }

        // Update game entities
        this.updateTroops(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateBuildings(deltaTime);

        // Render
        this.render();

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    updateTroops(deltaTime) {
        // TODO: Implement troop AI and movement
        this.troops = this.troops.filter(troop => troop.health > 0);
    }

    updateProjectiles(deltaTime) {
        // TODO: Implement projectile movement
        this.projectiles = this.projectiles.filter(projectile => projectile.active);
    }

    updateBuildings(deltaTime) {
        // TODO: Implement building functionality
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#3d5a45';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw bridge
        this.drawBridge();

        // Draw river
        this.drawRiver();

        // Draw towers
        this.drawTowers();

        // Draw troops
        this.troops.forEach(troop => this.drawTroop(troop));

        // Draw projectiles
        this.projectiles.forEach(projectile => this.drawProjectile(projectile));

        // Draw buildings
        this.buildings.forEach(building => this.drawBuilding(building));
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= CONFIG.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CONFIG.tileSize, 0);
            this.ctx.lineTo(x * CONFIG.tileSize, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= CONFIG.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CONFIG.tileSize);
            this.ctx.lineTo(this.canvas.width, y * CONFIG.tileSize);
            this.ctx.stroke();
        }

        // Center line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.gridHeight / 2 * CONFIG.tileSize);
        this.ctx.lineTo(this.canvas.width, CONFIG.gridHeight / 2 * CONFIG.tileSize);
        this.ctx.stroke();
    }

    drawBridge() {
        // Bridge at vertical center
        const bridgeY = CONFIG.gridHeight / 2;
        const bridgeStartX = CONFIG.gridWidth / 2 - 1;
        const bridgeWidth = 2;

        this.ctx.fillStyle = '#8b7355';
        this.ctx.fillRect(
            bridgeStartX * CONFIG.tileSize,
            (bridgeY - 0.5) * CONFIG.tileSize,
            bridgeWidth * CONFIG.tileSize,
            CONFIG.tileSize
        );

        // Bridge borders
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
            bridgeStartX * CONFIG.tileSize,
            (bridgeY - 0.5) * CONFIG.tileSize,
            bridgeWidth * CONFIG.tileSize,
            CONFIG.tileSize
        );
    }

    drawRiver() {
        // River on both sides of bridge
        const riverY = CONFIG.gridHeight / 2;
        const bridgeStartX = CONFIG.gridWidth / 2 - 1;
        const bridgeEndX = CONFIG.gridWidth / 2 + 1;

        this.ctx.fillStyle = '#4a90e2';
        this.ctx.globalAlpha = 0.6;

        // Left river
        this.ctx.fillRect(
            0,
            (riverY - 0.5) * CONFIG.tileSize,
            bridgeStartX * CONFIG.tileSize,
            CONFIG.tileSize
        );

        // Right river
        this.ctx.fillRect(
            bridgeEndX * CONFIG.tileSize,
            (riverY - 0.5) * CONFIG.tileSize,
            (CONFIG.gridWidth - bridgeEndX) * CONFIG.tileSize,
            CONFIG.tileSize
        );

        this.ctx.globalAlpha = 1;
    }

    drawTowers() {
        // Draw player towers (bottom)
        this.drawTower(this.playerTowers.left, '#4ecdc4', false);
        this.drawTower(this.playerTowers.right, '#4ecdc4', false);
        this.drawTower(this.playerTowers.king, '#ffd700', true);

        // Draw enemy towers (top)
        this.drawTower(this.enemyTowers.left, '#ff6b6b', false);
        this.drawTower(this.enemyTowers.right, '#ff6b6b', false);
        this.drawTower(this.enemyTowers.king, '#ff8787', true);
    }

    drawTower(tower, color, isKing) {
        if (!tower.active) return;

        const size = isKing ? CONFIG.tileSize * 1.5 : CONFIG.tileSize;
        const x = tower.x * CONFIG.tileSize;
        const y = tower.y * CONFIG.tileSize;

        // Tower body
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x - size / 2,
            y - size / 2,
            size,
            size
        );

        // Tower border
        this.ctx.strokeStyle = '#1a1f1a';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
            x - size / 2,
            y - size / 2,
            size,
            size
        );

        // Health bar
        const barWidth = size;
        const barHeight = 6;
        const barX = x - barWidth / 2;
        const barY = y - size / 2 - 12;

        // Background
        this.ctx.fillStyle = '#1a1f1a';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health
        const healthPercent = tower.health / tower.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' : (healthPercent > 0.25 ? '#ffd700' : '#ff6b6b');
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    drawTroop(troop) {
        // TODO: Implement troop rendering
    }

    drawProjectile(projectile) {
        // TODO: Implement projectile rendering
    }

    drawBuilding(building) {
        // TODO: Implement building rendering
    }

    updateElixirUI() {
        document.getElementById('elixirCount').textContent = this.elixir;
        const fillPercent = (this.elixir / CONFIG.elixirMax) * 100;
        document.getElementById('elixirFill').style.width = fillPercent + '%';
    }

    updateTimerUI() {
        const minutes = Math.floor(this.matchTime / 60);
        const seconds = this.matchTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('matchTimer').textContent = timeString;
    }

    updateTowerHealthUI() {
        // Player towers
        document.getElementById('playerLeftTower').textContent =
            Math.ceil((this.playerTowers.left.health / this.playerTowers.left.maxHealth) * 100) + '%';
        document.getElementById('playerKingTower').textContent =
            Math.ceil((this.playerTowers.king.health / this.playerTowers.king.maxHealth) * 100) + '%';
        document.getElementById('playerRightTower').textContent =
            Math.ceil((this.playerTowers.right.health / this.playerTowers.right.maxHealth) * 100) + '%';

        // Enemy towers
        document.getElementById('enemyLeftTower').textContent =
            Math.ceil((this.enemyTowers.left.health / this.enemyTowers.left.maxHealth) * 100) + '%';
        document.getElementById('enemyKingTower').textContent =
            Math.ceil((this.enemyTowers.king.health / this.enemyTowers.king.maxHealth) * 100) + '%';
        document.getElementById('enemyRightTower').textContent =
            Math.ceil((this.enemyTowers.right.health / this.enemyTowers.right.maxHealth) * 100) + '%';
    }

    endMatch() {
        this.state = GameState.ENDED;

        // Calculate winner
        const playerTowerCount = Object.values(this.playerTowers).filter(t => t.active).length;
        const enemyTowerCount = Object.values(this.enemyTowers).filter(t => t.active).length;

        let result;
        if (playerTowerCount > enemyTowerCount) {
            result = 'VICTORY!';
            PlayerData.trophies += 30;
            PlayerData.gold += 100;
        } else if (enemyTowerCount > playerTowerCount) {
            result = 'DEFEAT';
            PlayerData.trophies = Math.max(0, PlayerData.trophies - 20);
        } else {
            result = 'DRAW';
            PlayerData.gold += 20;
        }

        alert(`Match ended: ${result}`);
        this.updatePlayerUI();
        this.exitGame();
    }
}

// ===== CARD DATA STRUCTURES (for future implementation) =====

class Card {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type; // 'troop', 'spell', 'building'
        this.elixirCost = data.elixirCost;
        this.rarity = data.rarity; // 'common', 'rare', 'epic', 'legendary'
        this.description = data.description;
    }
}

class Troop {
    constructor(x, y, data, isPlayerTroop) {
        this.x = x;
        this.y = y;
        this.data = data;
        this.isPlayerTroop = isPlayerTroop;
        this.health = data.health;
        this.maxHealth = data.health;
        this.damage = data.damage;
        this.speed = data.speed;
        this.range = data.range;
        this.attackSpeed = data.attackSpeed;
        this.target = null;
        this.lastAttack = 0;
    }

    update(deltaTime) {
        // TODO: Implement troop AI
    }

    findTarget(enemies, towers) {
        // TODO: Implement target finding
    }

    attack() {
        // TODO: Implement attack logic
    }
}

// ===== PLACEHOLDER CARD DEFINITIONS =====
// These will be expanded with the 42 original cards

const CARD_TEMPLATES = {
    // Example troop card
    knight: {
        id: 'knight',
        name: 'Knight',
        type: 'troop',
        elixirCost: 3,
        rarity: 'common',
        description: 'Tough melee fighter',
        health: 100,
        damage: 20,
        speed: 1,
        range: 1,
        attackSpeed: 1.2,
        targetsAir: false,
        targetsGround: true,
        preferredTarget: 'troops'
    },

    musketeer: {
        id: 'musketeer',
        name: 'Musketeer',
        type: 'troop',
        elixirCost: 4,
        rarity: 'rare',
        description: 'Ranged attacker, hits air and ground',
        health: 60,
        damage: 15,
        speed: 1,
        range: 5,
        attackSpeed: 1,
        targetsAir: true,
        targetsGround: true,
        preferredTarget: 'any'
    },

    giant: {
        id: 'giant',
        name: 'Giant',
        type: 'troop',
        elixirCost: 5,
        rarity: 'rare',
        description: 'Slow but tanky, targets buildings',
        health: 300,
        damage: 30,
        speed: 0.5,
        range: 1,
        attackSpeed: 1.5,
        targetsAir: false,
        targetsGround: true,
        preferredTarget: 'buildings'
    },

    arrows: {
        id: 'arrows',
        name: 'Arrows',
        type: 'spell',
        elixirCost: 3,
        rarity: 'common',
        description: 'Area damage to air and ground units',
        damage: 40,
        radius: 3,
        delay: 0.5
    },

    fireball: {
        id: 'fireball',
        name: 'Fireball',
        type: 'spell',
        elixirCost: 4,
        rarity: 'rare',
        description: 'High damage area spell',
        damage: 80,
        radius: 2,
        delay: 1
    }
};

// ===== START GAME =====
const game = new WrightRoyale();
