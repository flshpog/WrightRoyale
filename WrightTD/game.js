// ===== GAME CONFIGURATION =====
const CONFIG = {
    gridSize: 40,
    canvasWidth: 800,
    canvasHeight: 600,
    startingMoney: 500,
    startingLives: 100,
    pathColor: '#2a3f2a',
    gridColor: '#4a6b4a'
};

// ===== PATH DEFINITION =====
const PATH = [
    { x: 0, y: 6 }, { x: 5, y: 6 }, { x: 5, y: 3 }, { x: 10, y: 3 },
    { x: 10, y: 9 }, { x: 15, y: 9 }, { x: 15, y: 2 }, { x: 19, y: 2 },
    { x: 19, y: 12 }, { x: 20, y: 12 }
];

// ===== UTILITY FUNCTIONS =====
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function drawPixelCircle(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawPixelRect(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
}

// ===== ENEMY CLASS =====
class Enemy {
    constructor(type, wave) {
        this.type = type;
        this.wave = wave;
        this.pathIndex = 0;
        this.progress = 0;
        this.x = PATH[0].x * CONFIG.gridSize + CONFIG.gridSize / 2;
        this.y = PATH[0].y * CONFIG.gridSize + CONFIG.gridSize / 2;

        // Enemy stats scale with wave
        const waveMultiplier = 1 + (wave - 1) * 0.3;
        this.maxHealth = type.health * waveMultiplier;
        this.health = this.maxHealth;
        this.speed = type.speed;
        this.reward = Math.floor(type.reward * (1 + (wave - 1) * 0.1));
        this.color = type.color;
        this.size = type.size;
        this.slowEffect = 1;
        this.slowDuration = 0;
    }

    update(deltaTime) {
        // Apply slow effect
        if (this.slowDuration > 0) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) {
                this.slowEffect = 1;
            }
        }

        const currentSpeed = this.speed * this.slowEffect * (deltaTime / 16);
        this.progress += currentSpeed;

        while (this.progress >= 1 && this.pathIndex < PATH.length - 1) {
            this.progress -= 1;
            this.pathIndex++;
        }

        if (this.pathIndex < PATH.length - 1) {
            const start = PATH[this.pathIndex];
            const end = PATH[this.pathIndex + 1];
            this.x = (start.x + (end.x - start.x) * this.progress) * CONFIG.gridSize + CONFIG.gridSize / 2;
            this.y = (start.y + (end.y - start.y) * this.progress) * CONFIG.gridSize + CONFIG.gridSize / 2;
        }

        return this.pathIndex >= PATH.length - 1 && this.progress >= 1;
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    applySlow(factor, duration) {
        this.slowEffect = Math.min(this.slowEffect, factor);
        this.slowDuration = Math.max(this.slowDuration, duration);
    }

    draw(ctx) {
        // Draw enemy body
        drawPixelCircle(ctx, this.x, this.y, this.size, this.color);

        // Draw border
        ctx.strokeStyle = '#1a1f1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();

        // Draw health bar
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 8;

        ctx.fillStyle = '#1a1f1a';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' : (healthPercent > 0.25 ? '#ffd700' : '#ff6b6b');
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}

// Enemy types
const ENEMY_TYPES = {
    basic: { health: 10, speed: 1, reward: 5, color: '#e63946', size: 8 },
    fast: { health: 5, speed: 2, reward: 7, color: '#f77f00', size: 6 },
    tank: { health: 30, speed: 0.5, reward: 15, color: '#6a4c93', size: 12 },
    speedy: { health: 8, speed: 2.5, reward: 10, color: '#06ffa5', size: 7 }
};

// ===== PROJECTILE CLASS =====
class Projectile {
    constructor(x, y, target, damage, speed, color, aoe = 0, slowFactor = 1, slowDuration = 0) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.aoe = aoe;
        this.slowFactor = slowFactor;
        this.slowDuration = slowDuration;
        this.size = 4;
    }

    update(deltaTime, enemies) {
        if (!this.target || this.target.health <= 0) {
            return true;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.speed) {
            this.hit(enemies);
            return true;
        }

        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        return false;
    }

    hit(enemies) {
        if (this.aoe > 0) {
            enemies.forEach(enemy => {
                if (distance(this.x, this.y, enemy.x, enemy.y) <= this.aoe) {
                    enemy.takeDamage(this.damage);
                    if (this.slowFactor < 1) {
                        enemy.applySlow(this.slowFactor, this.slowDuration);
                    }
                }
            });
        } else {
            this.target.takeDamage(this.damage);
            if (this.slowFactor < 1) {
                this.target.applySlow(this.slowFactor, this.slowDuration);
            }
        }
    }

    draw(ctx) {
        drawPixelCircle(ctx, this.x, this.y, this.size, this.color);

        // Draw glow for projectile
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

// ===== TOWER CLASS =====
class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = 0;
        this.upgrades = { path1: 0, path2: 0, path3: 0 };
        this.range = type.baseRange;
        this.damage = type.baseDamage;
        this.fireRate = type.baseFireRate;
        this.cost = type.cost;
        this.lastFired = 0;
        this.target = null;
        this.color = type.color;
        this.projectileColor = type.projectileColor;
        this.aoe = type.aoe || 0;
        this.slowFactor = type.slowFactor || 1;
        this.slowDuration = type.slowDuration || 0;
    }

    findTarget(enemies) {
        let closest = null;
        let maxProgress = -1;

        enemies.forEach(enemy => {
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            const totalProgress = enemy.pathIndex + enemy.progress;

            if (dist <= this.range && totalProgress > maxProgress) {
                closest = enemy;
                maxProgress = totalProgress;
            }
        });

        this.target = closest;
    }

    canUpgrade(pathName) {
        const pathNum = parseInt(pathName.replace('path', ''));
        const currentLevel = this.upgrades[pathName];

        if (currentLevel >= 5) return false;

        const otherPaths = Object.keys(this.upgrades).filter(p => p !== pathName);
        const maxOtherPath = Math.max(...otherPaths.map(p => this.upgrades[p]));

        if (maxOtherPath >= 5 && currentLevel === 0) return false;
        if (maxOtherPath >= 3 && currentLevel < 2) {
            const totalLevels = Object.values(this.upgrades).reduce((a, b) => a + b, 0);
            if (totalLevels >= 10) return false;
        }

        return true;
    }

    upgrade(pathName) {
        if (!this.canUpgrade(pathName)) return null;

        const pathNum = parseInt(pathName.replace('path', ''));
        const currentLevel = this.upgrades[pathName];
        const upgradePath = this.type.upgrades[pathNum - 1];
        const upgrade = upgradePath.tiers[currentLevel];

        this.upgrades[pathName]++;
        this.level++;

        upgrade.effects.forEach(effect => {
            if (effect.stat === 'range') this.range += effect.value;
            if (effect.stat === 'damage') this.damage += effect.value;
            if (effect.stat === 'fireRate') this.fireRate += effect.value;
            if (effect.stat === 'aoe') this.aoe += effect.value;
            if (effect.stat === 'slow') this.slowFactor *= effect.value;
            if (effect.stat === 'slowDuration') this.slowDuration += effect.value;
        });

        return upgrade.cost;
    }

    update(currentTime, enemies, projectiles) {
        this.findTarget(enemies);

        if (this.target && this.target.health > 0) {
            if (currentTime - this.lastFired >= 1000 / this.fireRate) {
                projectiles.push(new Projectile(
                    this.x, this.y, this.target,
                    this.damage, 8, this.projectileColor,
                    this.aoe, this.slowFactor, this.slowDuration
                ));
                this.lastFired = currentTime;
            }
        }
    }

    draw(ctx) {
        // Draw range indicator if selected
        if (game.selectedTower === this) {
            ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw tower base
        const size = 16;
        drawPixelRect(ctx, this.x - size / 2, this.y - size / 2, size, size, this.color);

        // Draw border
        ctx.strokeStyle = '#1a1f1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - size / 2, this.y - size / 2, size, size);

        // Draw turret based on upgrades
        const turretSize = 8 + this.level * 2;
        drawPixelCircle(ctx, this.x, this.y, turretSize / 2, this.projectileColor);

        // Draw level indicator
        if (this.level > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.level, this.x, this.y - size / 2 - 5);
        }
    }

    getSellValue() {
        return Math.floor(this.cost * 0.7);
    }
}

// Tower types with upgrade paths
const TOWER_TYPES = {
    bitblaster: {
        name: 'Bit Blaster',
        cost: 150,
        baseRange: 120,
        baseDamage: 2,
        baseFireRate: 2,
        color: '#ff6b6b',
        projectileColor: '#ff8787',
        description: 'Fast single-target shooter',
        upgrades: [
            {
                name: 'Rapid Fire',
                tiers: [
                    { name: 'Quick Shots', cost: 100, effects: [{ stat: 'fireRate', value: 1 }] },
                    { name: 'Faster Shots', cost: 200, effects: [{ stat: 'fireRate', value: 1.5 }] },
                    { name: 'Blazing Speed', cost: 400, effects: [{ stat: 'fireRate', value: 2 }] },
                    { name: 'Lightning Fast', cost: 800, effects: [{ stat: 'fireRate', value: 3 }] },
                    { name: 'Ultra Rapid', cost: 1500, effects: [{ stat: 'fireRate', value: 5 }] }
                ]
            },
            {
                name: 'Power Shot',
                tiers: [
                    { name: 'Stronger Hits', cost: 120, effects: [{ stat: 'damage', value: 1 }] },
                    { name: 'Heavy Damage', cost: 250, effects: [{ stat: 'damage', value: 2 }] },
                    { name: 'Critical Shot', cost: 500, effects: [{ stat: 'damage', value: 4 }] },
                    { name: 'Devastating Blow', cost: 1000, effects: [{ stat: 'damage', value: 6 }] },
                    { name: 'Annihilator', cost: 2000, effects: [{ stat: 'damage', value: 10 }] }
                ]
            },
            {
                name: 'Long Range',
                tiers: [
                    { name: 'Extended Barrel', cost: 80, effects: [{ stat: 'range', value: 20 }] },
                    { name: 'Sniper Scope', cost: 180, effects: [{ stat: 'range', value: 30 }] },
                    { name: 'Eagle Eye', cost: 350, effects: [{ stat: 'range', value: 50 }] },
                    { name: 'Satellite Link', cost: 700, effects: [{ stat: 'range', value: 70 }] },
                    { name: 'Global Range', cost: 1400, effects: [{ stat: 'range', value: 100 }] }
                ]
            }
        ]
    },
    dataturret: {
        name: 'Data Turret',
        cost: 250,
        baseRange: 100,
        baseDamage: 3,
        baseFireRate: 0.8,
        aoe: 40,
        color: '#4ecdc4',
        projectileColor: '#6ee7de',
        description: 'Area damage cannon',
        upgrades: [
            {
                name: 'Bigger Boom',
                tiers: [
                    { name: 'Large Blast', cost: 150, effects: [{ stat: 'aoe', value: 10 }] },
                    { name: 'Huge Blast', cost: 300, effects: [{ stat: 'aoe', value: 15 }] },
                    { name: 'Massive Blast', cost: 600, effects: [{ stat: 'aoe', value: 25 }] },
                    { name: 'Mega Blast', cost: 1200, effects: [{ stat: 'aoe', value: 35 }] },
                    { name: 'Nuclear Blast', cost: 2500, effects: [{ stat: 'aoe', value: 50 }] }
                ]
            },
            {
                name: 'Heavy Payload',
                tiers: [
                    { name: 'More Power', cost: 180, effects: [{ stat: 'damage', value: 2 }] },
                    { name: 'Even More Power', cost: 350, effects: [{ stat: 'damage', value: 3 }] },
                    { name: 'Explosive Power', cost: 700, effects: [{ stat: 'damage', value: 5 }] },
                    { name: 'Devastating Power', cost: 1400, effects: [{ stat: 'damage', value: 8 }] },
                    { name: 'Apocalyptic Power', cost: 3000, effects: [{ stat: 'damage', value: 15 }] }
                ]
            },
            {
                name: 'Faster Reload',
                tiers: [
                    { name: 'Quick Reload', cost: 130, effects: [{ stat: 'fireRate', value: 0.3 }] },
                    { name: 'Rapid Reload', cost: 280, effects: [{ stat: 'fireRate', value: 0.4 }] },
                    { name: 'Auto Loader', cost: 550, effects: [{ stat: 'fireRate', value: 0.6 }] },
                    { name: 'Speed Loader', cost: 1100, effects: [{ stat: 'fireRate', value: 0.8 }] },
                    { name: 'Instant Reload', cost: 2200, effects: [{ stat: 'fireRate', value: 1.2 }] }
                ]
            }
        ]
    },
    pixelsprout: {
        name: 'Pixel Sprout',
        cost: 200,
        baseRange: 90,
        baseDamage: 1,
        baseFireRate: 1.5,
        slowFactor: 0.7,
        slowDuration: 1000,
        color: '#95e1d3',
        projectileColor: '#b0f0e3',
        description: 'Slows enemies down',
        upgrades: [
            {
                name: 'Sticky Sap',
                tiers: [
                    { name: 'Slow Down', cost: 120, effects: [{ stat: 'slow', value: 0.9 }] },
                    { name: 'Heavy Slow', cost: 250, effects: [{ stat: 'slow', value: 0.85 }] },
                    { name: 'Deep Freeze', cost: 500, effects: [{ stat: 'slow', value: 0.75 }] },
                    { name: 'Time Warp', cost: 1000, effects: [{ stat: 'slow', value: 0.6 }] },
                    { name: 'Total Stop', cost: 2000, effects: [{ stat: 'slow', value: 0.4 }] }
                ]
            },
            {
                name: 'Lasting Effect',
                tiers: [
                    { name: 'Longer Slow', cost: 100, effects: [{ stat: 'slowDuration', value: 500 }] },
                    { name: 'Extended Slow', cost: 220, effects: [{ stat: 'slowDuration', value: 800 }] },
                    { name: 'Persistent Slow', cost: 450, effects: [{ stat: 'slowDuration', value: 1200 }] },
                    { name: 'Permanent Slow', cost: 900, effects: [{ stat: 'slowDuration', value: 2000 }] },
                    { name: 'Eternal Slow', cost: 1800, effects: [{ stat: 'slowDuration', value: 3000 }] }
                ]
            },
            {
                name: 'Multi-Target',
                tiers: [
                    { name: 'Small AoE', cost: 140, effects: [{ stat: 'aoe', value: 20 }] },
                    { name: 'Medium AoE', cost: 300, effects: [{ stat: 'aoe', value: 30 }] },
                    { name: 'Large AoE', cost: 600, effects: [{ stat: 'aoe', value: 50 }] },
                    { name: 'Huge AoE', cost: 1200, effects: [{ stat: 'aoe', value: 70 }] },
                    { name: 'Map-Wide Slow', cost: 2500, effects: [{ stat: 'aoe', value: 120 }] }
                ]
            }
        ]
    }
};

// ===== GAME CLASS =====
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.money = CONFIG.startingMoney;
        this.lives = CONFIG.startingLives;
        this.wave = 0;
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.placementMode = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.waveInProgress = false;
        this.lastTime = 0;
        this.spawnQueue = [];
        this.lastSpawn = 0;

        this.initEventListeners();
        this.updateUI();
        this.gameLoop(0);
    }

    initEventListeners() {
        // Tower selection
        document.querySelectorAll('.tower-card').forEach(card => {
            card.addEventListener('click', () => {
                const towerType = card.dataset.tower;
                this.selectTowerType(towerType);
            });
        });

        // Canvas click for placement and tower selection
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // Control buttons
        document.getElementById('startWave').addEventListener('click', () => this.startWave());
        document.getElementById('pauseGame').addEventListener('click', () => this.togglePause());
        document.getElementById('sellTower').addEventListener('click', () => this.sellSelectedTower());
        document.getElementById('restartGame').addEventListener('click', () => this.restart());
    }

    selectTowerType(type) {
        this.selectedTowerType = TOWER_TYPES[type];
        this.placementMode = true;
        this.selectedTower = null;

        document.querySelectorAll('.tower-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.tower === type);
        });

        document.getElementById('towerDetails').classList.add('hidden');
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.placementMode && this.selectedTowerType) {
            this.placeTower(x, y);
        } else {
            this.selectTowerAt(x, y);
        }
    }

    handleMouseMove(e) {
        if (!this.placementMode) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    placeTower(x, y) {
        if (!this.selectedTowerType) return;

        const gridX = Math.floor(x / CONFIG.gridSize);
        const gridY = Math.floor(y / CONFIG.gridSize);

        // Check if on path
        if (PATH.some(p => p.x === gridX && p.y === gridY)) {
            return;
        }

        // Check if tower already exists
        const towerX = gridX * CONFIG.gridSize + CONFIG.gridSize / 2;
        const towerY = gridY * CONFIG.gridSize + CONFIG.gridSize / 2;

        if (this.towers.some(t => t.x === towerX && t.y === towerY)) {
            return;
        }

        // Check money
        if (this.money < this.selectedTowerType.cost) {
            return;
        }

        // Place tower
        const tower = new Tower(towerX, towerY, this.selectedTowerType);
        this.towers.push(tower);
        this.money -= this.selectedTowerType.cost;
        this.updateUI();

        // Exit placement mode
        this.placementMode = false;
        this.selectedTowerType = null;
        document.querySelectorAll('.tower-card').forEach(card => card.classList.remove('selected'));
    }

    selectTowerAt(x, y) {
        this.selectedTower = null;

        for (let tower of this.towers) {
            if (distance(x, y, tower.x, tower.y) < 20) {
                this.selectedTower = tower;
                break;
            }
        }

        if (this.selectedTower) {
            this.showTowerDetails(this.selectedTower);
        } else {
            document.getElementById('towerDetails').classList.add('hidden');
        }
    }

    showTowerDetails(tower) {
        document.getElementById('selectedTowerName').textContent = tower.type.name;

        const stats = `
            Range: ${Math.floor(tower.range)}<br>
            Damage: ${tower.damage.toFixed(1)}<br>
            Fire Rate: ${tower.fireRate.toFixed(1)}/s
            ${tower.aoe > 0 ? `<br>AoE: ${Math.floor(tower.aoe)}` : ''}
            ${tower.slowFactor < 1 ? `<br>Slow: ${Math.floor((1 - tower.slowFactor) * 100)}%` : ''}
        `;
        document.getElementById('towerStats').innerHTML = stats;

        const upgradeOptions = document.getElementById('upgradeOptions');
        upgradeOptions.innerHTML = '';

        tower.type.upgrades.forEach((path, index) => {
            const pathName = `path${index + 1}`;
            const currentLevel = tower.upgrades[pathName];

            const pathDiv = document.createElement('div');
            pathDiv.className = 'upgrade-path';

            let pathHTML = `<div class="upgrade-path-header">${path.name}</div>`;
            pathHTML += '<div class="upgrade-tier">';

            for (let i = 0; i < 5; i++) {
                const dotClass = i < currentLevel ? 'unlocked' : 'locked';
                pathHTML += `<div class="tier-dot ${dotClass}"></div>`;
            }
            pathHTML += '</div>';

            if (currentLevel < 5) {
                const nextUpgrade = path.tiers[currentLevel];
                const canAfford = this.money >= nextUpgrade.cost;
                const canUpgrade = tower.canUpgrade(pathName);

                pathHTML += `
                    <button class="upgrade-btn"
                            ${!canAfford || !canUpgrade ? 'disabled' : ''}
                            data-path="${pathName}">
                        ${nextUpgrade.name} - $${nextUpgrade.cost}
                    </button>
                `;
            }

            pathDiv.innerHTML = pathHTML;
            upgradeOptions.appendChild(pathDiv);
        });

        // Add upgrade event listeners
        upgradeOptions.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const path = btn.dataset.path;
                const cost = tower.upgrade(path);
                if (cost !== null) {
                    this.money -= cost;
                    tower.cost += cost;
                    this.updateUI();
                    this.showTowerDetails(tower);
                }
            });
        });

        document.getElementById('towerDetails').classList.remove('hidden');
    }

    sellSelectedTower() {
        if (!this.selectedTower) return;

        this.money += this.selectedTower.getSellValue();
        this.towers = this.towers.filter(t => t !== this.selectedTower);
        this.selectedTower = null;
        document.getElementById('towerDetails').classList.add('hidden');
        this.updateUI();
    }

    startWave() {
        if (this.waveInProgress || this.isGameOver) return;

        this.wave++;
        this.waveInProgress = true;
        this.spawnQueue = this.generateWave(this.wave);
        this.lastSpawn = 0;
        this.updateUI();
    }

    generateWave(waveNum) {
        const queue = [];
        const baseEnemies = 5 + waveNum * 3;

        for (let i = 0; i < baseEnemies; i++) {
            let type;
            if (waveNum < 3) {
                type = ENEMY_TYPES.basic;
            } else if (waveNum < 6) {
                type = Math.random() > 0.5 ? ENEMY_TYPES.basic : ENEMY_TYPES.fast;
            } else if (waveNum < 10) {
                const rand = Math.random();
                if (rand > 0.6) type = ENEMY_TYPES.fast;
                else if (rand > 0.3) type = ENEMY_TYPES.basic;
                else type = ENEMY_TYPES.tank;
            } else {
                const rand = Math.random();
                if (rand > 0.7) type = ENEMY_TYPES.speedy;
                else if (rand > 0.4) type = ENEMY_TYPES.fast;
                else if (rand > 0.2) type = ENEMY_TYPES.tank;
                else type = ENEMY_TYPES.basic;
            }

            queue.push({ type, delay: i * 600 });
        }

        return queue;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseGame').textContent = this.isPaused ? 'RESUME' : 'PAUSE';
    }

    update(deltaTime) {
        if (this.isPaused || this.isGameOver) return;

        const currentTime = Date.now();

        // Spawn enemies
        if (this.spawnQueue.length > 0) {
            const next = this.spawnQueue[0];
            if (currentTime - this.lastSpawn >= next.delay) {
                this.enemies.push(new Enemy(next.type, this.wave));
                this.spawnQueue.shift();
                this.lastSpawn = currentTime;
            }
        } else if (this.enemies.length === 0 && this.waveInProgress) {
            this.waveInProgress = false;
            this.money += 50 + this.wave * 10;
            this.updateUI();
        }

        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            const reachedEnd = enemy.update(deltaTime);
            if (reachedEnd) {
                this.lives--;
                this.updateUI();
                if (this.lives <= 0) {
                    this.gameOver();
                }
                return false;
            }
            return enemy.health > 0;
        });

        // Update towers
        this.towers.forEach(tower => {
            tower.update(currentTime, this.enemies, this.projectiles);
        });

        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            return !projectile.update(deltaTime, this.enemies);
        });

        // Award money for killed enemies
        this.enemies.forEach(enemy => {
            if (enemy.health <= 0) {
                this.money += enemy.reward;
            }
        });

        this.enemies = this.enemies.filter(e => e.health > 0);
        this.updateUI();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = CONFIG.gridColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += CONFIG.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += CONFIG.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw path
        this.ctx.strokeStyle = CONFIG.pathColor;
        this.ctx.lineWidth = CONFIG.gridSize;
        this.ctx.lineCap = 'square';
        this.ctx.beginPath();
        PATH.forEach((point, index) => {
            const x = point.x * CONFIG.gridSize + CONFIG.gridSize / 2;
            const y = point.y * CONFIG.gridSize + CONFIG.gridSize / 2;
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();

        // Draw path outline
        this.ctx.strokeStyle = '#1a2f1a';
        this.ctx.lineWidth = CONFIG.gridSize + 4;
        this.ctx.beginPath();
        PATH.forEach((point, index) => {
            const x = point.x * CONFIG.gridSize + CONFIG.gridSize / 2;
            const y = point.y * CONFIG.gridSize + CONFIG.gridSize / 2;
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();

        // Redraw path
        this.ctx.strokeStyle = CONFIG.pathColor;
        this.ctx.lineWidth = CONFIG.gridSize;
        this.ctx.beginPath();
        PATH.forEach((point, index) => {
            const x = point.x * CONFIG.gridSize + CONFIG.gridSize / 2;
            const y = point.y * CONFIG.gridSize + CONFIG.gridSize / 2;
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();

        // Draw towers
        this.towers.forEach(tower => tower.draw(this.ctx));

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Draw projectiles
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));

        // Draw placement preview
        if (this.placementMode && this.mouseX && this.mouseY && this.selectedTowerType) {
            const gridX = Math.floor(this.mouseX / CONFIG.gridSize);
            const gridY = Math.floor(this.mouseY / CONFIG.gridSize);
            const centerX = gridX * CONFIG.gridSize + CONFIG.gridSize / 2;
            const centerY = gridY * CONFIG.gridSize + CONFIG.gridSize / 2;

            const isValidPlacement = !PATH.some(p => p.x === gridX && p.y === gridY) &&
                                    !this.towers.some(t => t.x === centerX && t.y === centerY);

            // Draw range
            this.ctx.strokeStyle = isValidPlacement ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 107, 107, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.selectedTowerType.baseRange, 0, Math.PI * 2);
            this.ctx.stroke();

            // Draw tower preview
            this.ctx.globalAlpha = 0.6;
            const size = 16;
            drawPixelRect(this.ctx, centerX - size / 2, centerY - size / 2, size, size, this.selectedTowerType.color);
            this.ctx.globalAlpha = 1;
        }
    }

    updateUI() {
        document.getElementById('money').textContent = this.money;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('wave').textContent = this.wave;
    }

    gameOver() {
        this.isGameOver = true;
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('gameOver').classList.remove('hidden');
    }

    restart() {
        this.money = CONFIG.startingMoney;
        this.lives = CONFIG.startingLives;
        this.wave = 0;
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.placementMode = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.waveInProgress = false;
        this.spawnQueue = [];

        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('towerDetails').classList.add('hidden');
        this.updateUI();
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Start the game
const game = new Game();
