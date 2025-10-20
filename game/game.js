// ===== WRIGHT ROYALE GAME ENGINE (UPDATED) =====

// ===== CONFIGURATION =====
const CONFIG = {
    gridWidth: 16,
    gridHeight: 24,
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
    deck: ['knight', 'archers', 'minions', 'arrows', 'fireball', 'giant', 'miniokran', 'musketeer'], // Default deck with all 8 cards
    collection: ['knight', 'archers', 'minions', 'arrows', 'fireball', 'giant', 'miniokran', 'musketeer']
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

        // Map zones and bridges
        this.setupMapZones();

        // Towers (grid coordinates with hitboxes)
        // Bridge is at y=12 (center of 24-tile grid)
        // Princess towers should be 7 tiles from bridge
        const bridgeY = CONFIG.gridHeight / 2; // 12
        const centerX = CONFIG.gridWidth / 2; // 8

        // Player towers (bottom)
        const playerPrincessTop = bridgeY + 7; // 7 tiles below bridge = y:19
        const playerKingTop = bridgeY + 8; // Behind princess towers = y:20

        this.playerTowers = {
            king: {
                x: centerX,
                y: playerKingTop + 2, // Center of 4x4
                left: centerX - 2,
                top: playerKingTop,
                width: 4,
                height: 4,
                health: 4400,
                maxHealth: 4400,
                active: true
            },
            left: {
                x: 3, // Left side
                y: playerPrincessTop + 1.5, // Center of 3x3
                left: 3 - 1.5,
                top: playerPrincessTop,
                width: 3,
                height: 3,
                health: 2500,
                maxHealth: 2500,
                active: true
            },
            right: {
                x: CONFIG.gridWidth - 3, // Right side (mirror of left)
                y: playerPrincessTop + 1.5, // Center of 3x3
                left: CONFIG.gridWidth - 3 - 1.5,
                top: playerPrincessTop,
                width: 3,
                height: 3,
                health: 2500,
                maxHealth: 2500,
                active: true
            }
        };

        // Enemy towers (top) - mirror layout
        const enemyPrincessTop = bridgeY - 7 - 3; // 7 tiles above bridge, minus 3 for tower height = y:2
        const enemyKingTop = bridgeY - 8 - 4; // Behind princess towers, minus 4 for tower height = y:0

        this.enemyTowers = {
            king: {
                x: centerX,
                y: enemyKingTop + 2, // Center of 4x4
                left: centerX - 2,
                top: enemyKingTop,
                width: 4,
                height: 4,
                health: 4400,
                maxHealth: 4400,
                active: true
            },
            left: {
                x: 3, // Left side
                y: enemyPrincessTop + 1.5, // Center of 3x3
                left: 3 - 1.5,
                top: enemyPrincessTop,
                width: 3,
                height: 3,
                health: 2500,
                maxHealth: 2500,
                active: true
            },
            right: {
                x: CONFIG.gridWidth - 3, // Right side (mirror of left)
                y: enemyPrincessTop + 1.5, // Center of 3x3
                left: CONFIG.gridWidth - 3 - 1.5,
                top: enemyPrincessTop,
                width: 3,
                height: 3,
                health: 2500,
                maxHealth: 2500,
                active: true
            }
        };

        // Game entities
        this.troops = [];
        this.projectiles = [];
        this.spellEffects = [];

        // Card hand
        this.hand = [];
        this.deck = [...PlayerData.deck];
        this.selectedCardIndex = null;
        this.placementPreview = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showLogoScreen();
        this.updatePlayerUI();
    }

    setupMapZones() {
        // Define deployment zones and restricted areas
        // Player side (bottom half)
        this.playerDeploymentZone = {
            // 6 center tiles at bottom
            centerStart: Math.floor(CONFIG.gridWidth / 2) - 3, // 5
            centerEnd: Math.floor(CONFIG.gridWidth / 2) + 3, // 11
            centerY: CONFIG.gridHeight - 1 // Bottom row (23)
        };

        // Enemy side (top half)
        this.enemyDeploymentZone = {
            centerStart: Math.floor(CONFIG.gridWidth / 2) - 3, // 5
            centerEnd: Math.floor(CONFIG.gridWidth / 2) + 3, // 11
            centerY: 0 // Top row
        };

        // Bridges (2 tiles wide, across river)
        const riverY = CONFIG.gridHeight / 2; // 12
        this.bridges = [
            {
                // Left bridge - starts 1 tile from left, 1 tile below river
                x: 1,
                y: riverY - 0.5,
                width: 2,
                height: 1
            },
            {
                // Right bridge - mirror on right side
                x: CONFIG.gridWidth - 3,
                y: riverY - 0.5,
                width: 2,
                height: 1
            }
        ];
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

        // Canvas interactions
        this.canvas.addEventListener('click', (e) => {
            if (this.state === GameState.PLAYING) {
                this.handleCanvasClick(e);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state === GameState.PLAYING && this.selectedCardIndex !== null) {
                this.handleCanvasHover(e);
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
            if (this.state === GameState.LOGO) {
                this.showMainMenu();
            }
        }, 3000);

        // Allow click to skip
        const skipHandler = () => {
            this.showMainMenu();
        };
        this.logoScreen.addEventListener('click', skipHandler, { once: true });
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
        this.spellEffects = [];
        this.selectedCardIndex = null;
        this.placementPreview = null;

        // Reset towers
        this.resetTowers();

        // Initialize player hand
        this.initializeHand();

        // Initialize enemy deck (same 8 cards, different shuffle)
        this.enemyDeckCycle = [...PlayerData.deck].sort(() => Math.random() - 0.5);
        this.enemyDeckPosition = 0;

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

        this.updateTowerHealthUI();
    }

    initializeHand() {
        this.hand = [];
        // Create shuffled cycle of 8 cards that will repeat
        this.deckCycle = [...PlayerData.deck].sort(() => Math.random() - 0.5);
        this.deckPosition = 0; // Track position in cycle

        // Draw initial 4 cards
        for (let i = 0; i < 4; i++) {
            this.drawCard();
        }

        this.updateHandUI();
    }

    drawCard() {
        // Get next card from the cycle
        const cardId = this.deckCycle[this.deckPosition];
        this.hand.push(cardId);

        // Move to next position in cycle, wrapping around after 8 cards
        this.deckPosition = (this.deckPosition + 1) % this.deckCycle.length;
    }

    handleCanvasClick(e) {
        if (this.selectedCardIndex === null) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * CONFIG.gridWidth;
        const y = (e.clientY - rect.top) / rect.height * CONFIG.gridHeight;

        this.playCard(this.selectedCardIndex, x, y);
    }

    handleCanvasHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * CONFIG.gridWidth;
        const y = (e.clientY - rect.top) / rect.height * CONFIG.gridHeight;

        this.placementPreview = { x, y };
    }

    canPlaceTroopAt(x, y) {
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);

        // Must be in player's half
        if (gridY < CONFIG.gridHeight / 2) {
            return false;
        }

        // Check if in restricted corner zones (5 tiles from each bottom corner)
        const inLeftCorner = gridX < 5 && gridY >= CONFIG.gridHeight - 3;
        const inRightCorner = gridX >= CONFIG.gridWidth - 5 && gridY >= CONFIG.gridHeight - 3;

        if (inLeftCorner || inRightCorner) {
            return false;
        }

        // Check if on tower hitbox
        const towers = Object.values(this.playerTowers);
        for (const tower of towers) {
            if (tower.active &&
                gridX >= tower.left && gridX < tower.left + tower.width &&
                gridY >= tower.top && gridY < tower.top + tower.height) {
                return false;
            }
        }

        return true;
    }

    playCard(cardIndex, x, y) {
        const cardId = this.hand[cardIndex];
        const cardData = getCard(cardId);

        // Check elixir
        if (this.elixir < cardData.elixirCost) {
            console.log('Not enough elixir!');
            return;
        }

        // Check placement zone
        if (cardData.type === CardType.TROOP) {
            if (!this.canPlaceTroopAt(x, y)) {
                console.log('Cannot place troop here!');
                return;
            }
        } else if (cardData.type === CardType.SPELL) {
            // Spells can be placed anywhere
        }

        // Spend elixir
        this.elixir -= cardData.elixirCost;
        this.updateElixirUI();

        // Spawn card
        if (cardData.type === CardType.TROOP) {
            this.spawnTroop(x, y, cardData, true);
        } else if (cardData.type === CardType.SPELL) {
            this.castSpell(x, y, cardData, true);
        }

        // Remove card from hand and draw new one
        this.hand.splice(cardIndex, 1);
        this.drawCard();

        // Deselect card
        this.selectedCardIndex = null;
        this.placementPreview = null;

        // Update hand UI
        this.updateHandUI();
    }

    spawnTroop(x, y, cardData, isPlayerTroop) {
        const count = cardData.count || 1;

        if (count === 1) {
            const troop = new Troop(x, y, cardData, isPlayerTroop, this);
            this.troops.push(troop);
        } else {
            // Spawn multiple troops in a circle formation
            const radius = 0.5;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const offsetX = Math.cos(angle) * radius;
                const offsetY = Math.sin(angle) * radius;
                const troop = new Troop(x + offsetX, y + offsetY, cardData, isPlayerTroop, this);
                this.troops.push(troop);
            }
        }
    }

    castSpell(x, y, cardData, isPlayerSpell) {
        const spellEffect = new SpellEffect(x, y, cardData, isPlayerSpell, this);
        this.spellEffects.push(spellEffect);
    }

    updateHandUI() {
        const handCardsEl = document.getElementById('handCards');
        handCardsEl.innerHTML = '';

        this.hand.forEach((cardId, index) => {
            const cardData = getCard(cardId);
            const cardEl = document.createElement('div');
            cardEl.className = 'hand-card';
            if (index === this.selectedCardIndex) {
                cardEl.classList.add('selected');
            }

            // Check if affordable
            if (this.elixir < cardData.elixirCost) {
                cardEl.classList.add('disabled');
            }

            cardEl.innerHTML = `
                <div class="card-preview" style="background-color: ${cardData.color}"></div>
                <div class="card-name">${cardData.name}</div>
                <div class="card-cost">${cardData.elixirCost}</div>
            `;

            cardEl.addEventListener('click', () => {
                if (this.elixir >= cardData.elixirCost) {
                    this.selectedCardIndex = this.selectedCardIndex === index ? null : index;
                    this.updateHandUI();
                }
            });

            handCardsEl.appendChild(cardEl);
        });
    }

    gameLoop() {
        if (this.state !== GameState.PLAYING) return;

        const now = Date.now();
        const deltaTime = 16; // Approximate 60 FPS

        // Update elixir
        if (now - this.lastElixirRegen >= CONFIG.elixirRegenRate) {
            if (this.elixir < CONFIG.elixirMax) {
                this.elixir = Math.min(CONFIG.elixirMax, this.elixir + 1);
                this.updateElixirUI();
                this.updateHandUI(); // Update to reflect affordable cards
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
        this.updateSpellEffects();

        // Simple enemy AI - spawn troops occasionally
        if (Math.random() < 0.001) {
            this.enemyAI();
        }

        // Render
        this.render();

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    enemyAI() {
        // Simple AI: spawn next card from deck cycle
        const cardId = this.enemyDeckCycle[this.enemyDeckPosition];
        const cardData = getCard(cardId);

        // Only spawn if it's a troop (skip spells for now in AI)
        if (cardData.type === CardType.TROOP) {
            const x = Math.random() * CONFIG.gridWidth;
            const y = Math.random() * (CONFIG.gridHeight / 2);
            this.spawnTroop(x, y, cardData, false);
        }

        // Move to next card in enemy's cycle
        this.enemyDeckPosition = (this.enemyDeckPosition + 1) % this.enemyDeckCycle.length;
    }

    updateTroops(deltaTime) {
        this.troops.forEach(troop => {
            if (troop.active) {
                troop.update(deltaTime);
            }
        });

        // Remove dead/inactive troops
        this.troops = this.troops.filter(troop => troop.active && troop.health > 0);
    }

    updateProjectiles(deltaTime) {
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
        });

        // Remove inactive projectiles
        this.projectiles = this.projectiles.filter(projectile => projectile.active);
    }

    updateSpellEffects() {
        this.spellEffects.forEach(effect => {
            effect.update();
        });

        // Remove inactive spell effects
        this.spellEffects = this.spellEffects.filter(effect => effect.active);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#3d5a45';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw restricted zones
        this.drawRestrictedZones();

        // Draw river
        this.drawRiver();

        // Draw bridges
        this.drawBridges();

        // Draw towers
        this.drawTowers();

        // Draw spell effects (under troops)
        this.spellEffects.forEach(effect => effect.draw(this.ctx));

        // Draw troops
        this.troops.forEach(troop => troop.draw(this.ctx));

        // Draw projectiles
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));

        // Draw placement preview
        if (this.placementPreview && this.selectedCardIndex !== null) {
            this.drawPlacementPreview();
        }
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

        // Center line (bridge level)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.gridHeight / 2 * CONFIG.tileSize);
        this.ctx.lineTo(this.canvas.width, CONFIG.gridHeight / 2 * CONFIG.tileSize);
        this.ctx.stroke();
    }

    drawBridges() {
        this.bridges.forEach(bridge => {
            this.ctx.fillStyle = '#8b7355';
            this.ctx.fillRect(
                bridge.x * CONFIG.tileSize,
                bridge.y * CONFIG.tileSize,
                bridge.width * CONFIG.tileSize,
                bridge.height * CONFIG.tileSize
            );

            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                bridge.x * CONFIG.tileSize,
                bridge.y * CONFIG.tileSize,
                bridge.width * CONFIG.tileSize,
                bridge.height * CONFIG.tileSize
            );
        });
    }

    drawRiver() {
        const riverY = CONFIG.gridHeight / 2;

        this.ctx.fillStyle = '#4a90e2';
        this.ctx.globalAlpha = 0.6;

        // Draw full river (bridges will be drawn on top)
        this.ctx.fillRect(
            0,
            (riverY - 0.5) * CONFIG.tileSize,
            CONFIG.gridWidth * CONFIG.tileSize,
            CONFIG.tileSize
        );

        this.ctx.globalAlpha = 1;
    }

    drawRestrictedZones() {
        // Draw restricted corner zones in darker color
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';

        // Player side (bottom)
        // Left corner - 5 tiles from left, bottom 3 rows
        this.ctx.fillRect(
            0,
            (CONFIG.gridHeight - 3) * CONFIG.tileSize,
            5 * CONFIG.tileSize,
            3 * CONFIG.tileSize
        );

        // Right corner - 5 tiles from right, bottom 3 rows
        this.ctx.fillRect(
            (CONFIG.gridWidth - 5) * CONFIG.tileSize,
            (CONFIG.gridHeight - 3) * CONFIG.tileSize,
            5 * CONFIG.tileSize,
            3 * CONFIG.tileSize
        );

        // Enemy side (top) - mirror
        // Left corner
        this.ctx.fillRect(
            0,
            0,
            5 * CONFIG.tileSize,
            3 * CONFIG.tileSize
        );

        // Right corner
        this.ctx.fillRect(
            (CONFIG.gridWidth - 5) * CONFIG.tileSize,
            0,
            5 * CONFIG.tileSize,
            3 * CONFIG.tileSize
        );
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

        const width = tower.width * CONFIG.tileSize;
        const height = tower.height * CONFIG.tileSize;
        const x = tower.left * CONFIG.tileSize;
        const y = tower.top * CONFIG.tileSize;

        // Tower body (full hitbox)
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);

        // Tower border
        this.ctx.strokeStyle = '#1a1f1a';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);

        // Health bar
        const barWidth = width;
        const barHeight = 8;
        const barX = x;
        const barY = y - 12;

        // Background
        this.ctx.fillStyle = '#1a1f1a';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health
        const healthPercent = tower.health / tower.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' : (healthPercent > 0.25 ? '#ffd700' : '#ff6b6b');
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    drawPlacementPreview() {
        const cardId = this.hand[this.selectedCardIndex];
        const cardData = getCard(cardId);
        const x = this.placementPreview.x * CONFIG.tileSize;
        const y = this.placementPreview.y * CONFIG.tileSize;

        // Check if valid placement
        const isValid = cardData.type === CardType.SPELL || this.canPlaceTroopAt(this.placementPreview.x, this.placementPreview.y);

        this.ctx.fillStyle = isValid ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 107, 107, 0.3)';
        this.ctx.strokeStyle = isValid ? '#4ecdc4' : '#ff6b6b';
        this.ctx.lineWidth = 3;

        if (cardData.type === CardType.SPELL) {
            // Draw radius circle for spells
            this.ctx.beginPath();
            this.ctx.arc(x, y, cardData.radius * CONFIG.tileSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        } else {
            // Draw placement marker for troops
            const size = 20;
            this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
            this.ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        }
    }

    updateElixirUI() {
        document.getElementById('elixirCount').textContent = Math.floor(this.elixir);
        const fillPercent = (this.elixir / CONFIG.elixirMax) * 100;
        const fillEl = document.getElementById('elixirFill');
        if (fillEl) {
            fillEl.style.width = fillPercent + '%';
        }
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

        // Count active towers
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

        alert(`Match ended: ${result}\nPlayer Towers: ${playerTowerCount}\nEnemy Towers: ${enemyTowerCount}`);
        this.updatePlayerUI();
        this.exitGame();
    }
}

// ===== START GAME =====
const game = new WrightRoyale();
