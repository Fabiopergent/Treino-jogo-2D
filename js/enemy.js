import { Item } from './item.js';

export class Enemy {
    constructor(x, y, game, type = 'basic') {
        this.game = game;
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 36;
        this.height = 36;
        this.alive = true;
        this.flash = 0;
        this.attackFlash = 0;
        this.attackCooldown = 0;
        // Boss ataca mais rápido, tanque mais devagar
        this.attackInterval = type === 'boss' ? 800 : type === 'tank' ? 2000 : 1200;

        // Física
        this.velocityY = 0;
        this.gravity = 0.5;
        this.onGround = false;

        // Propriedades por tipo
        const stats = Enemy.typeStats[type] || Enemy.typeStats.basic;
        this.speed = stats.speed;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.color = stats.color;
        this.canJump = stats.canJump;
        this.jumpForce = stats.jumpForce || -8;
        this.jumpCooldown = 0;
        this.points = stats.points;

        // ✅ ID único para evitar morte em grupo
        this.id = Math.random().toString(36).substr(2, 9);
    }

    static typeStats = {
        basic:  { speed: 1.2, hp: 2, color: '#805ad5', canJump: false, points: 10 },
        fast:   { speed: 2.2, hp: 2, color: '#e53e3e', canJump: false, points: 15 },
        jumper: { speed: 1.5, hp: 3, color: '#2b6cb0', canJump: true,  jumpForce: -9, points: 20 },
        tank:   { speed: 0.8, hp: 6, color: '#276749', canJump: false, points: 30 },
        boss:   { speed: 1.0, hp: 20, color: '#744210', canJump: true,  jumpForce: -10, points: 100 },
    };

    takeDamage(amount = 1) {
        this.hp -= amount;
        this.flash = 10;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        
        const roll = Math.random();
        if (roll < 0.60) {
            // 60% chance: munição de pistola
            this.game.items.push(new Item(this.x, this.y, 'ammo_pistol'));
        } else if (roll < 0.60 + 0.40) {
            // 40% chance: munição de fuzil (sempre dropa alguma munição)
            this.game.items.push(new Item(this.x, this.y, 'ammo_rifle'));
        }

        // Drops extras independentes (mais raros)
        const extraRoll = Math.random();
        if (extraRoll < 0.08) {
            this.game.items.push(new Item(this.x + 20, this.y, 'heal'));
        } else if (extraRoll < 0.12) {
            this.game.items.push(new Item(this.x + 20, this.y, 'armor'));
        }
    }

    update(player, deltaTime = 16.6) {
        if (!this.alive) return;

        const speedFactor = deltaTime / 16.6;

        // ===== DISTÂNCIA ATÉ O PLAYER =====
        const dx = player.x - this.x;
        const distX = Math.abs(dx);
        const direction = dx > 0 ? 1 : -1;

        // Zona de ataque: para quando está perto o suficiente
        const attackRange = this.width + player.width - 8;
        const inAttackRange = distX <= attackRange &&
            Math.abs((this.y + this.height / 2) - (player.y + player.height / 2)) < 50;

        // ===== ATAQUE CORPO A CORPO =====
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;

        if (inAttackRange) {
            // Para de andar, só ataca
            if (this.attackCooldown <= 0) {
                this.attackFlash = 200;
                this.attackCooldown = this.attackInterval;
                // Causa dano ao player via gameState (importado no game.js)
                this.game.onEnemyHitPlayer();
            }
        } else {
            // ===== PERSEGUIÇÃO (só anda se fora da zona de ataque) =====
            this.x += this.speed * direction * speedFactor;
        }

        // ===== SEPARAÇÃO entre inimigos (evita sobreposição) =====
        for (let other of this.game.enemies) {
            if (other === this || !other.alive) continue;
            const odx = this.x - other.x;
            const dist = Math.abs(odx);
            const minDist = this.width - 4;
            if (dist < minDist) {
                const push = (minDist - dist) * 0.3;
                this.x += odx > 0 ? push : -odx > 0 ? -push : push;
            }
        }

        // ===== PULO (inimigos que podem pular) =====
        if (this.canJump && this.onGround) {
            this.jumpCooldown--;
            const playerAbove = player.y < this.y - 40;
            const playerClose = Math.abs(player.x - this.x) < 200;
            if ((playerAbove || this.jumpCooldown <= 0) && playerClose) {
                this.velocityY = this.jumpForce;
                this.onGround = false;
                this.jumpCooldown = 90;
            }
        }

        // ===== GRAVIDADE =====
        this.velocityY += this.gravity * speedFactor;
        this.y += this.velocityY * speedFactor;

        // ===== COLISÃO VERTICAL COM PLATAFORMAS =====
        this.onGround = false;
        for (let platform of this.game.platforms) {
            if (!platform.active) continue;
            const overlapX = this.x + this.width > platform.x && this.x < platform.x + platform.width;
            if (!overlapX) continue;
            const bottom = this.y + this.height;
            if (this.velocityY >= 0 &&
                bottom >= platform.y &&
                bottom <= platform.y + platform.height + Math.abs(this.velocityY * speedFactor) + 1) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
            }
        }

        // ===== LIMITES =====
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.worldWidth) this.x = this.game.worldWidth - this.width;

        if (this.flash > 0) this.flash--;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.fillStyle = this.flash > 0 ? '#ffffff' : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Barra de HP
        if (this.type === 'boss' || this.hp < this.maxHp) {
            const bw = this.width;
            const bh = this.type === 'boss' ? 6 : 4;
            const by = this.y - bh - 2;
            ctx.fillStyle = '#300';
            ctx.fillRect(this.x, by, bw, bh);
            ctx.fillStyle = this.type === 'boss' ? '#f6c90e' : '#e53e3e';
            ctx.fillRect(this.x, by, bw * (this.hp / this.maxHp), bh);
        }

        // Olhos
        ctx.fillStyle = this.flash > 0 ? '#e53e3e' : '#fff';
        ctx.fillRect(this.x + 7,  this.y + 10, 8, 8);
        ctx.fillRect(this.x + 21, this.y + 10, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 10, this.y + 13, 4, 4);
        ctx.fillRect(this.x + 24, this.y + 13, 4, 4);

        // ✅ Flash de ataque (garra/soco à frente)
        if (this.attackFlash > 0) {
            this.attackFlash -= 16;
            const ax = this.x > 0 ? this.x - 20 : this.x + this.width;
            ctx.save();
            ctx.globalAlpha = Math.min(1, this.attackFlash / 150);
            ctx.font = '22px Arial';
            ctx.fillText('👊', ax, this.y + this.height / 2);
            ctx.restore();
        }

        if (this.type === 'boss') {
            ctx.fillStyle = '#f6c90e';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', this.x + this.width / 2, this.y - 10);
            ctx.textAlign = 'left';
        }
    }
}