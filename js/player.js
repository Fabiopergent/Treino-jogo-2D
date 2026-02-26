import { Bullet } from "./bullet.js";
import { gameState } from "./gameState.js";

export class Player {
    constructor(x, y, game) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 36;
            this.height = 36;
            this.speed = 5;
            this.velocityY = 0;
            this.gravity = 0.5;
            this.jumpForce = -10;
            this.jumpCutMultiplier = 0.4;
            this.onGround = false;
            this.bullets = [];
            this.shootCooldown = 0;
            this.direction = 1;

            // Invencibilidade temporária após tomar dano
            this.invincible = 0;
    }

    update(input, deltaTime) {
        const speedFactor = deltaTime / 16.6;

        // ===== HORIZONTAL =====
        let moveX = 0;
        if (input.keys["ArrowRight"]) { moveX =  this.speed * speedFactor; this.direction =  1; }
        if (input.keys["ArrowLeft"])  { moveX = -this.speed * speedFactor; this.direction = -1; }
        this.x += moveX;

        // ===== LIMITES =====
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.worldWidth) this.x = this.game.worldWidth - this.width;

        // ===== COLISÃO HORIZONTAL =====
        for (let platform of this.game.platforms) {
            if (!platform.active) continue;
            const overlapY = this.y + this.height > platform.y && this.y < platform.y + platform.height;
            if (overlapY) {
                if (moveX > 0 && this.x + this.width > platform.x && this.x + this.width - moveX <= platform.x)
                    this.x = platform.x - this.width;
                if (moveX < 0 && this.x < platform.x + platform.width && this.x - moveX >= platform.x + platform.width)
                    this.x = platform.x + platform.width;
             }
        }

        // ===== PULO =====
        if (input.keys["ArrowUp"] && this.onGround) {
            this.velocityY = this.jumpForce;
            this.onGround = false;
        }

        // ===== PULO VARIÁVEL =====
        if (!input.keys["ArrowUp"] && this.velocityY < 0) this.velocityY *= this.jumpCutMultiplier;

        // ===== GRAVIDADE =====
        this.velocityY += this.gravity * speedFactor;
        this.y += this.velocityY * speedFactor;

       // ===== COLISÃO VERTICAL =====
        this.onGround = false;
            for (let platform of this.game.platforms) {
            if (!platform.active) continue;
            const overlapX = this.x + this.width > platform.x && this.x < platform.x + platform.width;
            if (!overlapX) continue;
            const bottom = this.y + this.height;
            if (this.velocityY >= 0 && bottom >= platform.y &&
                bottom <= platform.y + platform.height + Math.abs(this.velocityY * speedFactor) + 1) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
            } else if (this.velocityY < 0 && this.y <= platform.y + platform.height && this.y >= platform.y) {
                this.y = platform.y + platform.height;
                this.velocityY = 0;
            }
        }

        // ===== COLISÃO COM INIMIGOS =====
        if (this.invincible > 0) {
            this.invincible -= deltaTime;
        } else {
            for (let enemy of this.game.enemies) {
                if (!enemy.alive) continue;
                const hit = this.x < enemy.x + enemy.width && this.x + this.width > enemy.x &&
                            this.y < enemy.y + enemy.height && this.y + this.height > enemy.y;
                if (hit) {
                    gameState.takeDamage(34);
                    this.invincible = 1500; // 1.5s de invencibilidade
                    if (gameState.isGameOver) return;
                    this.reset();
                    break;
                }
            }
        }

        // ===== TIRO =====
        if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;
        if (input.keys[" "] && this.shootCooldown <= 0) {
            if (gameState.shoot()) {
                this.shoot();
                this.shootCooldown = 300; // ms entre tiros
            }
        }

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
        // Pisca se invencível
        if (this.invincible > 0 && Math.floor(this.invincible / 100) % 2 === 0) return;

        // Corpo
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Olhos
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 6,  this.y + 8, 8, 8);
        ctx.fillRect(this.x + 22, this.y + 8, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + (this.direction > 0 ? 11 : 8), this.y + 11, 4, 4);
        ctx.fillRect(this.x + (this.direction > 0 ? 27 : 24), this.y + 11, 4, 4);

        this.bullets.forEach(b => b.draw(ctx));
    }

    shoot() {
        const bulletX = this.direction === 1 ? this.x + this.width : this.x - 10;
        const bulletY = this.y + this.height / 2;
        this.bullets.push(new Bullet(bulletX, bulletY, this.direction));
    }
}