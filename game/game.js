// ===== WRIGHT ROYALE GAME ENGINE (UPDATED) =====

// ===== CONFIGURATION =====
const CONFIG = {
    gridWidth: 16,
    gridHeight: 24,
    tileSizeX: 25, // Horizontal tile size (narrower)
    tileSizeY: 40, // Vertical tile size (same)
    tileSize: 40, // Default for backwards compatibility
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
        this.playerCrowns = 0;
        this.enemyCrowns = 0;

        // Map zones and bridges
        this.setupMapZones();

        // Towers (grid coordinates with hitboxes)
        // Bridge is at y=12 (center of 24-tile grid)
        // Princess towers should be 7 tiles from bridge
        const bridgeY = CONFIG.gridHeight / 2; // 12
        const centerX = CONFIG.gridWidth / 2; // 5

        // Player towers (bottom)
        const playerPrincessTop = bridgeY + 7; // 7 tiles below bridge = y:19
        const playerKingTop = bridgeY + 8; // Behind princess towers = y:20

        const princessTowerCard = CARDS.princess_tower;
        const kingTowerCard = CARDS.king_tower;

        this.playerTowers = {
            king: {
                x: centerX,
                y: playerKingTop + 2, // Center of 4x4
                left: centerX - 2,
                top: playerKingTop,
                width: 4,
                height: 4,
                health: kingTowerCard.health,
                maxHealth: kingTowerCard.health,
                active: true,
                activated: false, // King tower starts inactive
                activatedTime: null,
                isPlayerTower: true,
                cardData: kingTowerCard,
                target: null,
                lastAttackTime: 0,
                crownAwarded: false
            },
            left: {
                x: 3, // Left side
                y: playerPrincessTop + 1.5, // Center of 3x3
                left: 3 - 1.5,
                top: playerPrincessTop,
                width: 3,
                height: 3,
                health: princessTowerCard.health,
                maxHealth: princessTowerCard.health,
                active: true,
                isPlayerTower: true,
                cardData: princessTowerCard,
                target: null,
                lastAttackTime: 0,
                crownAwarded: false
            },
            right: {
                x: CONFIG.gridWidth - 3, // Right side (mirror of left)
                y: playerPrincessTop + 1.5, // Center of 3x3
                left: CONFIG.gridWidth - 3 - 1.5,
                top: playerPrincessTop,
                width: 3,
                height: 3,
                health: princessTowerCard.health,
                maxHealth: princessTowerCard.health,
                active: true,
                isPlayerTower: true,
                cardData: princessTowerCard,
                target: null,
                lastAttackTime: 0,
                crownAwarded: false
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
                health: kingTowerCard.health,
                maxHealth: kingTowerCard.health,
                active: true,
                activated: false, // King tower starts inactive
                activatedTime: null,
                isPlayerTower: false,
                cardData: kingTowerCard,
                target: null,
                lastAttackTime: 0,
                crownAwarded: false
            },
            left: {
                x: 3, // Left side
                y: enemyPrincessTop + 1.5, // Center of 3x3
                left: 3 - 1.5,
                top: enemyPrincessTop,
                width: 3,
                height: 3,
                health: princessTowerCard.health,
                maxHealth: princessTowerCard.health,
                active: true,
                isPlayerTower: false,
                cardData: princessTowerCard,
                target: null,
                lastAttackTime: 0,
                crownAwarded: false
            },
            right: {
                x: CONFIG.gridWidth - 3, // Right side (mirror of left)
                y: enemyPrincessTop + 1.5, // Center of 3x3
                left: CONFIG.gridWidth - 3 - 1.5,
                top: enemyPrincessTop,
                width: 3,
                height: 3,
                health: princessTowerCard.health,
                maxHealth: princessTowerCard.health,
                active: true,
                isPlayerTower: false,
                cardData: princessTowerCard,
                target: null,
                lastAttackTime: 0,
                crownAwarded: false
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

        // End game OK button
        document.getElementById('endGameOK').addEventListener('click', () => {
            this.closeEndGameOverlay();
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
        // Define tab order for directional animation
        const tabOrder = ['shopTab', 'inventoryTab', 'playTab', 'clansTab', 'constructionTab'];
        const oldIndex = tabOrder.indexOf(this.currentTab);
        const newIndex = tabOrder.indexOf(tabId);

        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
            // Remove animation classes
            tab.classList.remove('slide-left', 'slide-right');
        });

        // Remove active from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab with directional animation
        const selectedTab = document.getElementById(tabId);
        selectedTab.classList.remove('hidden');

        // Add appropriate slide animation based on direction
        if (oldIndex !== -1 && newIndex !== -1) {
            if (newIndex > oldIndex) {
                selectedTab.classList.add('slide-right');
            } else {
                selectedTab.classList.add('slide-left');
            }
        }

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
        this.playerCrowns = 0;
        this.enemyCrowns = 0;
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
            tower.target = null;
            tower.lastAttackTime = 0;
            tower.crownAwarded = false;
            if (tower.hasOwnProperty('activated')) {
                tower.activated = false;
                tower.activatedTime = null;
            }
        });

        Object.values(this.enemyTowers).forEach(tower => {
            tower.health = tower.maxHealth;
            tower.active = true;
            tower.target = null;
            tower.lastAttackTime = 0;
            tower.crownAwarded = false;
            if (tower.hasOwnProperty('activated')) {
                tower.activated = false;
                tower.activatedTime = null;
            }
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
        this.updateTowers();

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

    updateTowers() {
        // Update player towers
        Object.values(this.playerTowers).forEach(tower => {
            if (tower.active && tower.cardData) {
                // King tower only shoots if activated
                if (tower.cardData.id === 'king_tower' && !tower.activated) {
                    return;
                }
                this.updateTowerTargeting(tower);
            }
        });

        // Update enemy towers
        Object.values(this.enemyTowers).forEach(tower => {
            if (tower.active && tower.cardData) {
                // King tower only shoots if activated
                if (tower.cardData.id === 'king_tower' && !tower.activated) {
                    return;
                }
                this.updateTowerTargeting(tower);
            }
        });
    }

    updateTowerTargeting(tower) {
        const cardData = tower.cardData;
        const now = Date.now();

        // Find enemy troops within range (player towers shoot enemy troops, enemy towers shoot player troops)
        const enemyTroops = this.troops.filter(troop =>
            troop.isPlayerTroop !== tower.isPlayerTower &&
            troop.health > 0 &&
            troop.active
        );

        // Filter by range
        const targetsInRange = enemyTroops.filter(troop => {
            const dx = troop.x - tower.x;
            const dy = troop.y - tower.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= cardData.range;
        });

        // Find closest target
        if (targetsInRange.length > 0) {
            let closest = null;
            let closestDist = Infinity;

            targetsInRange.forEach(troop => {
                const dx = troop.x - tower.x;
                const dy = troop.y - tower.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = troop;
                }
            });

            tower.target = closest;

            // Try to attack
            const hitSpeed = cardData.hitSpeed * 1000; // Convert to ms
            if (now - tower.lastAttackTime >= hitSpeed) {
                this.towerAttack(tower);
                tower.lastAttackTime = now;
            }
        } else {
            tower.target = null;
        }
    }

    towerAttack(tower) {
        if (!tower.target || tower.target.health <= 0) return;

        const cardData = tower.cardData;

        // Create projectile
        const projectile = new Projectile(
            tower.x,
            tower.y,
            tower.target,
            cardData.damage,
            cardData.projectileSpeed / 1000,
            cardData.color,
            this
        );
        this.projectiles.push(projectile);
    }

    onTowerDamaged(tower, isPlayerTower) {
        // Activate king tower if it's damaged
        if (tower.cardData && tower.cardData.id === 'king_tower' && !tower.activated) {
            tower.activated = true;
            tower.activatedTime = Date.now();
            console.log(`${isPlayerTower ? 'Player' : 'Enemy'} King Tower activated!`);
        }
    }

    onPrincessTowerDestroyed(tower) {
        // Check if this tower has already awarded its crown
        if (tower.crownAwarded) {
            return;
        }

        // Mark this tower as having awarded its crown
        tower.crownAwarded = true;

        // Award 1 crown to the attacker
        if (tower.isPlayerTower) {
            this.enemyCrowns += 1;
            console.log(`Enemy destroyed a Princess Tower! Enemy crowns: ${this.enemyCrowns}`);
        } else {
            this.playerCrowns += 1;
            console.log(`Player destroyed a Princess Tower! Player crowns: ${this.playerCrowns}`);
        }

        // Activate king tower when princess tower is destroyed
        const kingTower = tower.isPlayerTower ? this.playerTowers.king : this.enemyTowers.king;
        if (!kingTower.activated) {
            kingTower.activated = true;
            kingTower.activatedTime = Date.now();
            console.log(`${tower.isPlayerTower ? 'Player' : 'Enemy'} King Tower activated (Princess Tower destroyed)!`);
        }
    }

    onKingTowerDestroyed(tower) {
        // Check if this tower has already awarded its crown
        if (tower.crownAwarded) {
            return;
        }

        // Mark this tower as having awarded its crown
        tower.crownAwarded = true;

        // Award 3 crowns to the attacker
        if (tower.isPlayerTower) {
            this.enemyCrowns += 3;
            console.log(`Enemy destroyed the King Tower! Enemy crowns: ${this.enemyCrowns}`);
        } else {
            this.playerCrowns += 3;
            console.log(`Player destroyed the King Tower! Player crowns: ${this.playerCrowns}`);
        }

        // End the game immediately when King Tower is destroyed
        this.endMatch();
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
            this.ctx.moveTo(x * CONFIG.tileSizeX, 0);
            this.ctx.lineTo(x * CONFIG.tileSizeX, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= CONFIG.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CONFIG.tileSizeY);
            this.ctx.lineTo(this.canvas.width, y * CONFIG.tileSizeY);
            this.ctx.stroke();
        }

        // Center line (bridge level)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.gridHeight / 2 * CONFIG.tileSizeY);
        this.ctx.lineTo(this.canvas.width, CONFIG.gridHeight / 2 * CONFIG.tileSizeY);
        this.ctx.stroke();
    }

    drawBridges() {
        this.bridges.forEach(bridge => {
            this.ctx.fillStyle = '#8b7355';
            this.ctx.fillRect(
                bridge.x * CONFIG.tileSizeX,
                bridge.y * CONFIG.tileSizeY,
                bridge.width * CONFIG.tileSizeX,
                bridge.height * CONFIG.tileSizeY
            );

            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                bridge.x * CONFIG.tileSizeX,
                bridge.y * CONFIG.tileSizeY,
                bridge.width * CONFIG.tileSizeX,
                bridge.height * CONFIG.tileSizeY
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
            (riverY - 0.5) * CONFIG.tileSizeY,
            CONFIG.gridWidth * CONFIG.tileSizeX,
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
            (CONFIG.gridHeight - 3) * CONFIG.tileSizeY,
            5 * CONFIG.tileSizeX,
            3 * CONFIG.tileSizeY
        );

        // Right corner - 5 tiles from right, bottom 3 rows
        this.ctx.fillRect(
            (CONFIG.gridWidth - 5) * CONFIG.tileSizeX,
            (CONFIG.gridHeight - 3) * CONFIG.tileSizeY,
            5 * CONFIG.tileSizeX,
            3 * CONFIG.tileSizeY
        );

        // Enemy side (top) - mirror
        // Left corner
        this.ctx.fillRect(
            0,
            0,
            5 * CONFIG.tileSizeX,
            3 * CONFIG.tileSizeY
        );

        // Right corner
        this.ctx.fillRect(
            (CONFIG.gridWidth - 5) * CONFIG.tileSizeX,
            0,
            5 * CONFIG.tileSizeX,
            3 * CONFIG.tileSizeY
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

        const width = tower.width * CONFIG.tileSizeX;
        const height = tower.height * CONFIG.tileSizeY;
        const x = tower.left * CONFIG.tileSizeX;
        const y = tower.top * CONFIG.tileSizeY;

        // Tower body (full hitbox)
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);

        // Tower border
        this.ctx.strokeStyle = '#1a1f1a';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);

        // Determine if we should show health bar
        const showHealthBar = !isKing || (isKing && tower.activated);

        if (showHealthBar) {
            const barWidth = width;
            const barHeight = 10;
            const barX = x;
            const barY = y - 16;

            // Animation for King Tower activation
            let scale = 1;
            let alpha = 1;
            if (isKing && tower.activatedTime) {
                const timeSinceActivation = Date.now() - tower.activatedTime;
                const animDuration = 800; // 800ms animation
                if (timeSinceActivation < animDuration) {
                    const progress = timeSinceActivation / animDuration;
                    // Ease out elastic effect
                    scale = 1 + (1 - progress) * 0.5;
                    alpha = progress;
                }
            }

            this.ctx.save();
            this.ctx.globalAlpha = alpha;

            // Background
            this.ctx.fillStyle = '#1a1f1a';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Health
            const healthPercent = tower.health / tower.maxHealth;
            this.ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' : (healthPercent > 0.25 ? '#ffd700' : '#ff6b6b');
            this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

            // Health text (HP value)
            if (scale > 1 || isKing) {
                this.ctx.save();
                const centerX = barX + barWidth / 2;
                const centerY = barY + barHeight / 2;
                this.ctx.translate(centerX, centerY);
                this.ctx.scale(scale, scale);
                this.ctx.translate(-centerX, -centerY);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(Math.ceil(tower.health), centerX, centerY);

                this.ctx.restore();
            }

            this.ctx.restore();

            // "ACTIVATED!" text for King Tower
            if (isKing && tower.activatedTime) {
                const timeSinceActivation = Date.now() - tower.activatedTime;
                if (timeSinceActivation < 2000) { // Show for 2 seconds
                    const textAlpha = 1 - (timeSinceActivation / 2000);
                    const textY = y - 30 - (timeSinceActivation / 20); // Float up

                    this.ctx.save();
                    this.ctx.globalAlpha = textAlpha;
                    this.ctx.fillStyle = '#ff4444';
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeText('ACTIVATED!', x + width / 2, textY);
                    this.ctx.fillText('ACTIVATED!', x + width / 2, textY);
                    this.ctx.restore();
                }
            }
        }
    }

    drawPlacementPreview() {
        const cardId = this.hand[this.selectedCardIndex];
        const cardData = getCard(cardId);
        const x = this.placementPreview.x * CONFIG.tileSizeX;
        const y = this.placementPreview.y * CONFIG.tileSizeY;

        // Check if valid placement
        const isValid = cardData.type === CardType.SPELL || this.canPlaceTroopAt(this.placementPreview.x, this.placementPreview.y);

        this.ctx.fillStyle = isValid ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 107, 107, 0.3)';
        this.ctx.strokeStyle = isValid ? '#4ecdc4' : '#ff6b6b';
        this.ctx.lineWidth = 3;

        if (cardData.type === CardType.SPELL) {
            // Draw radius circle for spells
            this.ctx.beginPath();
            this.ctx.arc(x, y, cardData.radius * ((CONFIG.tileSizeX + CONFIG.tileSizeY) / 2), 0, Math.PI * 2);
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

        let result;
        let trophies = 0;
        let gold = 0;

        if (this.playerCrowns > this.enemyCrowns) {
            result = 'VICTORY!';
            trophies = 30;
            gold = 100;
            PlayerData.trophies += trophies;
            PlayerData.gold += gold;
        } else if (this.enemyCrowns > this.playerCrowns) {
            result = 'DEFEAT';
            trophies = -20;
            PlayerData.trophies = Math.max(0, PlayerData.trophies - 20);
        } else {
            result = 'DRAW';
            gold = 20;
            PlayerData.gold += gold;
        }

        // Show end game overlay
        this.showEndGameOverlay(result, trophies, gold);
        this.updatePlayerUI();
    }

    showEndGameOverlay(result, trophies, gold) {
        const overlay = document.getElementById('endGameOverlay');

        // Update crown counts
        document.getElementById('playerCrownCount').textContent = this.playerCrowns;
        document.getElementById('enemyCrownCount').textContent = this.enemyCrowns;

        // Update result text
        document.getElementById('resultText').textContent = result;

        // Update rewards
        document.getElementById('trophyReward').textContent = trophies >= 0 ? `+${trophies}` : `${trophies}`;
        document.getElementById('goldReward').textContent = gold >= 0 ? `+${gold}` : `${gold}`;

        // Show overlay
        overlay.classList.remove('hidden');
    }

    closeEndGameOverlay() {
        const overlay = document.getElementById('endGameOverlay');
        overlay.classList.add('hidden');
        this.exitGame();
    }
}

// ===== START GAME =====
const game = new WrightRoyale();
