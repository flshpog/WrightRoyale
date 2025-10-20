// ===== GAME ENTITIES (Troops, Projectiles, Spells) =====

// ===== TROOP CLASS =====
class Troop {
    constructor(x, y, cardData, isPlayerTroop, game) {
        this.x = x;
        this.y = y;
        this.cardData = cardData;
        this.isPlayerTroop = isPlayerTroop;
        this.game = game;

        // Stats
        this.health = cardData.health;
        this.maxHealth = cardData.health;
        this.damage = cardData.damage;
        this.speed = (cardData.speed * 0.003) / 1000; // Convert to tiles per millisecond - drastically reduced for slower movement
        this.range = cardData.range;
        this.hitSpeed = cardData.hitSpeed * 1000; // Convert to milliseconds
        this.firstHitSpeed = cardData.firstHitSpeed * 1000;
        this.projectileSpeed = cardData.projectileSpeed || null;
        this.transport = cardData.transport;
        this.targetType = cardData.target;

        // State
        this.target = null;
        this.lastAttackTime = 0;
        this.isFirstAttack = true;
        this.deployed = false;
        this.deployTime = Date.now();
        this.active = true;

        // Visual
        this.color = cardData.color;
        this.size = cardData.size || 0.5;
    }

    update(deltaTime) {
        // Wait for deploy time
        if (!this.deployed) {
            if (Date.now() - this.deployTime >= this.cardData.deployTime * 1000) {
                this.deployed = true;
            }
            return;
        }

        // Find target
        this.findTarget();

        // If has target in range, attack
        if (this.target && this.isInRange(this.target)) {
            this.tryAttack();
        } else {
            // Move towards goal
            this.move(deltaTime);
        }
    }

    findTarget() {
        // Get all possible targets
        const possibleTargets = this.getPossibleTargets();

        // If no current target or current target is dead/destroyed, find new one
        if (!this.target || this.target.health <= 0 || !this.target.active) {
            this.target = this.findClosestTarget(possibleTargets);
        }
    }

    getPossibleTargets() {
        const targets = [];

        // Get enemy troops
        const enemyTroops = this.game.troops.filter(troop =>
            troop.isPlayerTroop !== this.isPlayerTroop && troop.health > 0
        );

        // Get enemy towers
        const enemyTowers = this.isPlayerTroop ?
            Object.values(this.game.enemyTowers) :
            Object.values(this.game.playerTowers);

        const activeTowers = enemyTowers.filter(tower => tower.active);

        // Filter based on target type
        if (this.targetType === TargetType.BUILDINGS) {
            // Only target buildings/towers
            return activeTowers;
        } else if (this.targetType === TargetType.GROUND) {
            // Target ground troops and buildings
            const groundTroops = enemyTroops.filter(troop =>
                troop.transport === TransportType.GROUND
            );
            return [...groundTroops, ...activeTowers];
        } else if (this.targetType === TargetType.AIR) {
            // Target air troops only
            return enemyTroops.filter(troop =>
                troop.transport === TransportType.AIR
            );
        } else { // AIR_AND_GROUND
            // Target everything
            return [...enemyTroops, ...activeTowers];
        }
    }

    findClosestTarget(targets) {
        if (targets.length === 0) return null;

        let closest = null;
        let closestDist = Infinity;

        targets.forEach(target => {
            const dist = this.distanceTo(target);
            if (dist < closestDist) {
                closestDist = dist;
                closest = target;
            }
        });

        return closest;
    }

    move(deltaTime) {
        let targetX, targetY;

        if (!this.target) {
            // Move towards enemy king tower if no target
            const enemyKing = this.isPlayerTroop ?
                this.game.enemyTowers.king :
                this.game.playerTowers.king;
            targetX = enemyKing.x;
            targetY = enemyKing.y;
        } else {
            // Move towards target
            targetX = this.target.x || this.target.gridX || this.target.x;
            targetY = this.target.y || this.target.gridY || this.target.y;
        }

        // Check if ground troop needs to use bridge
        if (this.transport === TransportType.GROUND) {
            const bridgeY = CONFIG.gridHeight / 2;
            const onOppositeSide = this.isPlayerTroop ?
                (this.y > bridgeY && targetY < bridgeY) :
                (this.y < bridgeY && targetY > bridgeY);

            if (onOppositeSide) {
                // Choose closest bridge (left or right)
                const leftBridgeCenter = 1 + 1; // x=1, width=2, so center is 2
                const rightBridgeCenter = CONFIG.gridWidth - 3 + 1; // x=13, width=2, so center is 14

                const distToLeft = Math.abs(this.x - leftBridgeCenter);
                const distToRight = Math.abs(this.x - rightBridgeCenter);
                const targetBridgeX = distToLeft < distToRight ? leftBridgeCenter : rightBridgeCenter;

                const atBridgeY = Math.abs(this.y - bridgeY) < 0.5;
                const atBridgeX = Math.abs(this.x - targetBridgeX) < 1;

                if (!atBridgeY) {
                    // Move toward bridge Y level first
                    this.moveTowards(this.x, bridgeY, deltaTime);
                } else if (!atBridgeX) {
                    // At bridge level, move horizontally to bridge
                    this.moveTowards(targetBridgeX, bridgeY, deltaTime);
                } else {
                    // On bridge, now cross and move to target
                    this.moveTowards(targetX, targetY, deltaTime);
                }
                return;
            }
        }

        // Air troops or ground troops on same side - move directly
        this.moveTowards(targetX, targetY, deltaTime);
    }

    moveTowards(targetX, targetY, deltaTime) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.1) {
            const moveAmount = this.speed * deltaTime;
            this.x += (dx / dist) * moveAmount;
            this.y += (dy / dist) * moveAmount;
        }
    }

    isInRange(target) {
        return this.distanceTo(target) <= this.range;
    }

    distanceTo(target) {
        const tx = target.x !== undefined ? target.x : target.gridX;
        const ty = target.y !== undefined ? target.y : target.gridY;
        const dx = tx - this.x;
        const dy = ty - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    tryAttack() {
        const now = Date.now();
        const requiredWaitTime = this.isFirstAttack ? this.firstHitSpeed : this.hitSpeed;

        if (now - this.lastAttackTime >= requiredWaitTime) {
            this.attack();
            this.lastAttackTime = now;
            this.isFirstAttack = false;
        }
    }

    attack() {
        if (!this.target || this.target.health <= 0 || !this.target.active) return;

        if (this.projectileSpeed) {
            // Ranged attack - create projectile
            const projectile = new Projectile(
                this.x, this.y, this.target, this.damage,
                this.projectileSpeed / 1000, this.color, this.game
            );
            this.game.projectiles.push(projectile);
        } else {
            // Melee attack - deal damage directly
            this.target.health -= this.damage;
            if (this.target.health <= 0) {
                this.target.active = false;
                // Only update tower UI if it's a tower
                if (this.target.hasOwnProperty('maxHealth') && !this.target.hasOwnProperty('transport')) {
                    this.game.updateTowerHealthUI();
                }
            }
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    draw(ctx) {
        const pixelX = this.x * CONFIG.tileSize;
        const pixelY = this.y * CONFIG.tileSize;
        const radius = this.size * CONFIG.tileSize / 2;

        // Draw troop circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = this.isPlayerTroop ? '#4ecdc4' : '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw health bar if not at full health
        if (this.health < this.maxHealth) {
            const barWidth = radius * 2;
            const barHeight = 4;
            const barX = pixelX - barWidth / 2;
            const barY = pixelY - radius - 8;

            // Background
            ctx.fillStyle = '#1a1f1a';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Health
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' :
                           (healthPercent > 0.25 ? '#ffd700' : '#ff6b6b');
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }

        // Draw troop name above the troop
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const nameY = this.health < this.maxHealth ? pixelY - radius - 14 : pixelY - radius - 6;
        ctx.fillText(this.cardData.name, pixelX, nameY);
        ctx.textBaseline = 'alphabetic'; // Reset to default

        // Draw deploy timer
        if (!this.deployed) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            const timeLeft = Math.ceil((this.cardData.deployTime * 1000 - (Date.now() - this.deployTime)) / 1000);
            ctx.fillText(timeLeft, pixelX, pixelY + 5);
        }
    }
}

// ===== PROJECTILE CLASS =====
class Projectile {
    constructor(x, y, target, damage, speed, color, game) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed; // tiles per millisecond
        this.color = color;
        this.game = game;
        this.active = true;
        this.size = 0.15;
    }

    update(deltaTime) {
        if (!this.target || this.target.health <= 0 || !this.target.active) {
            this.active = false;
            return;
        }

        // Move towards target
        const tx = this.target.x !== undefined ? this.target.x : this.target.gridX;
        const ty = this.target.y !== undefined ? this.target.y : this.target.gridY;

        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const moveAmount = this.speed * deltaTime;

        if (dist <= moveAmount) {
            // Hit target
            this.hit();
            this.active = false;
        } else {
            // Move towards target
            this.x += (dx / dist) * moveAmount;
            this.y += (dy / dist) * moveAmount;
        }
    }

    hit() {
        if (!this.target) return;

        this.target.health -= this.damage;

        if (this.target.health <= 0) {
            this.target.active = false;
            // Only update tower UI if it's a tower
            if (this.target.hasOwnProperty('maxHealth') && !this.target.hasOwnProperty('transport')) {
                this.game.updateTowerHealthUI();
            }
        }
    }

    draw(ctx) {
        const pixelX = this.x * CONFIG.tileSize;
        const pixelY = this.y * CONFIG.tileSize;
        const radius = this.size * CONFIG.tileSize;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

// ===== SPELL EFFECT CLASS =====
class SpellEffect {
    constructor(x, y, cardData, isPlayerSpell, game) {
        this.x = x;
        this.y = y;
        this.cardData = cardData;
        this.isPlayerSpell = isPlayerSpell;
        this.game = game;
        this.startTime = Date.now();
        this.duration = cardData.effectDuration * 1000;
        this.active = true;
        this.damageDealt = false;
    }

    update() {
        const elapsed = Date.now() - this.startTime;

        // Deal damage partway through effect
        if (!this.damageDealt && elapsed >= this.duration / 2) {
            this.dealDamage();
            this.damageDealt = true;
        }

        // Deactivate after duration
        if (elapsed >= this.duration) {
            this.active = false;
        }
    }

    dealDamage() {
        const targets = this.getTargetsInRadius();

        targets.forEach(target => {
            const isTower = target.hasOwnProperty('active') && !target.hasOwnProperty('transport');
            const damageAmount = isTower ?
                (this.cardData.crownTowerDamage || this.cardData.areaDamage) :
                this.cardData.areaDamage;

            // For arrows, deal damage in 3 hits
            if (this.cardData.damageHits > 1) {
                const damagePerHit = damageAmount / this.cardData.damageHits;
                for (let i = 0; i < this.cardData.damageHits; i++) {
                    setTimeout(() => {
                        if (target.health > 0) {
                            target.health -= damagePerHit;
                            if (target.health <= 0 && target.active !== undefined) {
                                target.active = false;
                            }
                        }
                    }, i * 100);
                }
            } else {
                target.health -= damageAmount;
                if (target.health <= 0 && target.active !== undefined) {
                    target.active = false;
                }
            }
        });

        this.game.updateTowerHealthUI();
    }

    getTargetsInRadius() {
        const targets = [];

        // Get all troops
        this.game.troops.forEach(troop => {
            if (troop.isPlayerTroop !== this.isPlayerSpell) {
                const dist = Math.sqrt((troop.x - this.x) ** 2 + (troop.y - this.y) ** 2);
                if (dist <= this.cardData.radius) {
                    targets.push(troop);
                }
            }
        });

        // Get enemy towers
        const enemyTowers = this.isPlayerSpell ?
            Object.values(this.game.enemyTowers) :
            Object.values(this.game.playerTowers);

        enemyTowers.forEach(tower => {
            if (tower.active) {
                const dist = Math.sqrt((tower.x - this.x) ** 2 + (tower.y - this.y) ** 2);
                if (dist <= this.cardData.radius) {
                    targets.push(tower);
                }
            }
        });

        return targets;
    }

    draw(ctx) {
        const pixelX = this.x * CONFIG.tileSize;
        const pixelY = this.y * CONFIG.tileSize;
        const radius = this.cardData.radius * CONFIG.tileSize;

        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;

        // Draw expanding circle
        ctx.strokeStyle = this.cardData.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, radius * progress, 0, Math.PI * 2);
        ctx.stroke();

        // Draw inner fill
        ctx.fillStyle = this.cardData.color;
        ctx.globalAlpha = (1 - progress) * 0.3;
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}
