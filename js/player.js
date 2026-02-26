import { Bullet } from "./bullet.js";
import { gameState } from "./gameState.js";

export class Player {
    constructor(x, y, game) {
        this.game = game;

        this.x = x;
        this.y = y;

        this.width = 40;
        this.height = 40;

        this.speed = 5;
        this.velocityY = 0;
        this.gravity = 0.5;
        this.jumpForce = -10;
        this.jumpCutMultiplier = 0.4;

        this.onGround = false;

        this.bullets = [];
        this.shootCooldown = 0;
        this.direction = 1;
    }

    update(input, deltaTime) {
        const speedFactor = deltaTime / 16.6;

        // ===== MOVIMENTO HORIZONTAL =====
        let moveX = 0;
        if (input.keys["ArrowRight"]) {
            moveX = this.speed * speedFactor;
            this.direction = 1;
        }
        if (input.keys["ArrowLeft"]) {
            moveX = -this.speed * speedFactor;
            this.direction = -1;
        }

        this.x += moveX;

        // ===== LIMITES DO MUNDO (horizontal) =====
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.worldWidth) {
            this.x = this.game.worldWidth - this.width;
        }

        // ===== COLISÃO HORIZONTAL =====
        for (let platform of this.game.platforms) {
            const overlapY =
                this.y + this.height > platform.y &&
                this.y < platform.y + platform.height;

            if (overlapY) {
                if (moveX > 0 && this.x + this.width > platform.x && this.x + this.width - moveX <= platform.x) {
                    this.x = platform.x - this.width;
                }
                if (moveX < 0 && this.x < platform.x + platform.width && this.x - moveX >= platform.x + platform.width) {
                    this.x = platform.x + platform.width;
                }
            }
        }

        // ===== PULO =====
        if (input.keys["ArrowUp"] && this.onGround) {
            this.velocityY = this.jumpForce;
            this.onGround = false;
        }

        // ===== PULO VARIÁVEL (corte antecipado) =====
        if (!input.keys["ArrowUp"] && this.velocityY < 0) {
            this.velocityY *= this.jumpCutMultiplier;
        }

        // ===== GRAVIDADE + MOVIMENTO VERTICAL =====
        this.velocityY += this.gravity * speedFactor;
        this.y += this.velocityY * speedFactor;

        // ===== COLISÃO VERTICAL (única passagem, após mover) =====
        this.onGround = false;

        for (let platform of this.game.platforms) {
            const overlapX =
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width;

            if (!overlapX) continue;

            const playerBottom = this.y + this.height;
            const playerTop = this.y;

            // Caindo — pousa em cima da plataforma
            if (this.velocityY >= 0 &&
                playerBottom >= platform.y &&
                playerBottom <= platform.y + platform.height + Math.abs(this.velocityY * speedFactor) + 1) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
            }
            // Subindo — bate na parte de baixo da plataforma
            else if (this.velocityY < 0 &&
                playerTop <= platform.y + platform.height &&
                playerTop >= platform.y) {
                this.y = platform.y + platform.height;
                this.velocityY = 0;
            }
        }

        // ===== COLISÃO COM INIMIGOS =====
        for (let enemy of this.game.enemies) {
            if (!enemy.alive) continue;

            const hit =
                this.x < enemy.x + enemy.width &&
                this.x + this.width > enemy.x &&
                this.y < enemy.y + enemy.height &&
                this.y + this.height > enemy.y;

            if (hit) {
                gameState.takeDamage();
                this.reset();
            }
        }

        // ===== TIRO =====
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (input.keys[" "] && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 20;
        }

        // ✅ Passa deltaTime para as balas também
        this.bullets.forEach(b => b.update(deltaTime));
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);
    }

    reset() {
        this.x = 100;
        this.y = 100;
        this.velocityY = 0;
        this.onGround = false;
        }

    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.bullets.forEach(b => b.draw(ctx));
    }

    shoot() {
            const bulletX = this.direction === 1 ? this.x + this.width : this.x - 10;
            const bulletY = this.y + this.height / 2;
            this.bullets.push(new Bullet(bulletX, bulletY, this.direction));
        }
}