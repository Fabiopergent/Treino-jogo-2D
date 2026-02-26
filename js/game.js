import { Player } from './player.js';
import { Input } from './input.js';
import { Platform } from './platform.js';
import { Enemy } from './enemy.js';
import { gameState } from './gameState.js';


export class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.width = 800;
        this.canvas.height = 400;

        this.worldWidth = 2000;
        this.cameraX = 0;
        this.cameraSmooth = 0.1;

        this.input = new Input();

        this.enemyTimer = 0;

        this.nextPlatformX = 800;
        this.platformSpacing = 180;
        this.minPlatformWidth = 100;
        this.maxPlatformWidth = 200;

        this.platforms = [
            new Platform(0, 350, 2000, 50),
            new Platform(200, 280, 120, 20),
            new Platform(400, 220, 120, 20),
            new Platform(600, 300, 120, 20)
        ];

        this.player = new Player(100, 100, this);

        this.lastTime = 0;

        this.enemies = [
            new Enemy(500, 310, this),
            new Enemy(900, 310, this)
        ];

        this.items = [];

        // ✅ Flag para controlar se o loop está ativo
        this.running = false;
        this.animFrameId = null;

        this.menu = document.getElementById("menu");
        this.startButton = document.getElementById("startButton");

        this.startButton.addEventListener("click", () => {
            this.menu.style.display = "none";
            this.resetGame(); // ✅ Sempre reseta antes de iniciar
            this.start();
        });
    }

    // ✅ Reseta todo o estado do jogo antes de cada partida
    resetGame() {
        this.cameraX = 0;
        this.enemyTimer = 0;
        this.nextPlatformX = 800;
        this.lastTime = 0;

        this.platforms = [
            new Platform(0, 350, 2000, 50),
            new Platform(200, 280, 120, 20),
            new Platform(400, 220, 120, 20),
            new Platform(600, 300, 120, 20)
        ];

        this.player = new Player(100, 100, this);

        this.enemies = [
            new Enemy(500, 310, this),
            new Enemy(900, 310, this)
        ];

        this.items = [];

        gameState.lives = 3;
        gameState.currentLevel = 1;
    }

    start() {
        // ✅ Cancela qualquer loop anterior antes de iniciar um novo
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
        }
        this.running = true;
        this.animFrameId = requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        // ✅ Se o loop foi parado, não continua
        if (!this.running) return;

        // Evita deltaTime gigante no primeiro frame após pausa
        if (this.lastTime === 0) this.lastTime = timestamp;
        const deltaTime = Math.min(timestamp - this.lastTime, 50); // ✅ Limita deltaTime a 50ms (evita saltos físicos)
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        this.animFrameId = requestAnimationFrame(this.loop.bind(this));
    }

    // ++++++++ Update =========
    update(deltaTime) {
        // Checagem de Game Over
        if (gameState.lives <= 0) {
            this.gameOver();
            return;
        }

        this.player.update(this.input, deltaTime);

        this.enemies.forEach(enemy => {
            if (Math.abs(enemy.x - this.cameraX) < 1200) {
                enemy.update(this.player, deltaTime);
            }
        });

        // Câmera suavizada
        const targetCamera = this.player.x - this.canvas.width / 2;
        this.cameraX += (targetCamera - this.cameraX) * this.cameraSmooth;
        if (this.cameraX < 0) this.cameraX = 0;
        const maxCamera = this.worldWidth - this.canvas.width;
        if (this.cameraX > maxCamera) this.cameraX = maxCamera;

        this.generatePlatforms();
        this.cleanupPlatforms();

        // Spawn de inimigos
        this.enemyTimer++;
        if (this.enemyTimer > 300) {
            const spawnX = this.cameraX + this.canvas.width + 100 + Math.random() * 200;
            const spawnY = 310 + Math.random() * 10;
            let newEnemy = new Enemy(spawnX, spawnY, this);
            newEnemy.speed = 1 + (gameState.currentLevel * 0.2);
            this.enemies.push(newEnemy);
            this.enemyTimer = 0;
        }

            // Colisão bala vs inimigo
        this.player.bullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (enemy.alive &&
                    bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {

                    enemy.takeDamage();
                    bullet.markedForDeletion = true;
                }
            });
        });

        // Colisão player vs item
        this.items.forEach(item => {
            if (this.player.x < item.x + item.width &&
                this.player.x + this.player.width > item.x &&
                this.player.y < item.y + item.height &&
                this.player.y + this.player.height > item.y) {

                if (item.type === 'heal') gameState.gainLife();
                item.markedForDeletion = true;
            }
        });

        this.enemies = this.enemies.filter(enemy => enemy.alive);
        this.items = this.items.filter(i => !i.markedForDeletion);
    }

    gameOver() {
        // ✅ Para o loop ANTES de mostrar o menu
        this.running = false;

        this.menu.style.display = "flex";
        this.menu.querySelector("h1").innerText = "GAME OVER";
    }

    draw() {
        this.ctx.fillStyle = "#87CEEB";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-Math.floor(this.cameraX), 0);

        this.platforms.forEach(platform => platform.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.items.forEach(item => item.draw(this.ctx));
        this.player.draw(this.ctx);

        this.ctx.restore();

        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.fillText("Vidas: " + gameState.lives, 20, 30);
    }

    cleanupPlatforms() {
        this.platforms = this.platforms.filter((platform, index) => {
            if (index === 0) return true;
            return platform.x + platform.width > this.cameraX - 500;
        });
    }

    generatePlatforms() {
        while (this.nextPlatformX < this.cameraX + this.canvas.width + 400) {
            const width =
                this.minPlatformWidth +
                Math.random() * (this.maxPlatformWidth - this.minPlatformWidth);

            const height = 20;
            const minY = 180;
            const maxY = 320;
            const y = minY + Math.random() * (maxY - minY);

            this.platforms.push(new Platform(this.nextPlatformX, y, width, height));

            this.nextPlatformX += this.platformSpacing + Math.random() * 120;
        }
    }
}