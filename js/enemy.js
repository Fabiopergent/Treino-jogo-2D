import { Item } from './item.js';

export class Enemy {
    constructor(x, y, game) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 40;
            this.height = 40;
            this.speed = 1.2;
            this.direction = -1;
            this.alive = true;
            this.hp = 2;
            this.flash = 0;

            // ✅ Gravidade própria do inimigo
            this.velocityY = 0;
            this.gravity = 0.5;
            this.onGround = false;
        }

    takeDamage() {
        this.hp--;
        this.flash = 10;
        if (this.hp <= 0) {
            this.alive = false;
            if (Math.random() < 0.1) {
                this.game.items.push(new Item(this.x, this.y, 'heal'));
            }
        }
    }

    update(player, deltaTime = 16.6) {
        if (!this.alive) return;

        const speedFactor = deltaTime / 16.6;

        // ===== PERSEGUIÇÃO HORIZONTAL =====
        this.direction = (player.x > this.x) ? 1 : -1;
        this.x += this.speed * this.direction * speedFactor;

        // ===== GRAVIDADE =====
        this.velocityY += this.gravity * speedFactor;
        this.y += this.velocityY * speedFactor;

        // ===== COLISÃO VERTICAL COM PLATAFORMAS =====
        this.onGround = false;
        for (let platform of this.game.platforms) {
            const overlapX =
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width;

            if (!overlapX) continue;

            const enemyBottom = this.y + this.height;

            // Pousa em cima da plataforma
            if (this.velocityY >= 0 &&
                enemyBottom >= platform.y &&
                enemyBottom <= platform.y + platform.height + Math.abs(this.velocityY * speedFactor) + 1) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
            }
        }

        // ===== LIMITES DO MUNDO =====
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.worldWidth) {
            this.x = this.game.worldWidth - this.width;
        }

        if (this.flash > 0) this.flash--;
    }

    draw(ctx) {
            if (!this.alive) return;
            ctx.fillStyle = this.flash > 0 ? "white" : "purple";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
}