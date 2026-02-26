import { Player }   from './player.js';
import { Input }    from './input.js';
import { Platform } from './platform.js';
import { Enemy }    from './enemy.js';
import { Item }     from './item.js';
import { HUD }      from './hud.js';
import { gameState } from './gameState.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx    = this.canvas.getContext("2d");
        this.canvas.width  = 800;
        this.canvas.height = 400;

        this.worldWidth   = 3000;
        this.cameraX      = 0;
        this.cameraSmooth = 0.1;

        this.input = new Input();
        this.hud   = new HUD(this.canvas);

        this.running      = false;
        this.animFrameId  = null;
        this.lastTime     = 0;

        this.enemyTimer   = 0;
        this.bossSpawned  = false;

        this.nextPlatformX   = 800;
        this.platformSpacing = 180;

        this.platforms = [];
        this.enemies   = [];
        this.items     = [];
        this.player    = null;

        this._setupMenu();
    }

    _setupMenu() {
        const menu          = document.getElementById("menu");
        const startBtn      = document.getElementById("startButton");
        const gameOverScreen = document.getElementById("gameOverScreen");
        const restartBtn    = document.getElementById("restartButton");
        const menuBtn       = document.getElementById("menuButton");

        this.menuEl          = menu;
        this.gameOverEl      = gameOverScreen;

        // Carrega scores na tabela
        this._renderScores();

        startBtn.addEventListener("click", () => {
            const nameInput = document.getElementById("playerName");
            const name = nameInput.value.trim() || "Player";
            menu.style.display = "none";
            this.resetGame(name);
            this.start();
        });

        restartBtn?.addEventListener("click", () => {
            const name = gameState.playerName;
            gameOverScreen.style.display = "none";
            this.resetGame(name);
            this.start();
        });

        menuBtn?.addEventListener("click", () => {
            gameOverScreen.style.display = "none";
            menu.style.display = "flex";
            this._renderScores();
        });
    }

    _renderScores() {
        const tbody = document.getElementById("scoresBody");
        if (!tbody) return;
        const scores = gameState.getScores();
        if (scores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-scores">Nenhum record ainda. Seja o primeiro!</td></tr>';
            return;
        }
        tbody.innerHTML = scores.map((s, i) => `
            <tr>
                <td>${['🥇','🥈','🥉','4','5'][i]}</td>
                <td>${s.name}</td>
                <td>${s.score.toLocaleString()}</td>
                <td>${s.level}</td>
            </tr>`).join('');
    }

    resetGame(playerName = 'Player') {
        gameState.reset(playerName);

        this.cameraX       = 0;
        this.enemyTimer    = 0;
        this.bossSpawned   = false;
        this.lastTime      = 0;
        this.nextPlatformX = 800;
        
        // Chão permanente
        this.platforms = [
            new Platform(0, 350, this.worldWidth, 50, true),
            new Platform(200, 280, 120, 18),
            new Platform(400, 220, 120, 18),
            new Platform(600, 300, 120, 18),
        ];

        this.player  = new Player(100, 280, this);
        this.enemies = [new Enemy(600, 314, this, 'basic'), new Enemy(900, 314, this, 'basic')];
        this.items   = [];
    }

    start() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.running = true;
        this.animFrameId = requestAnimationFrame(this.loop.bind(this));
    }

        loop(timestamp) {
            if (!this.running) return;
            if (this.lastTime === 0) this.lastTime = timestamp;
            const deltaTime = Math.min(timestamp - this.lastTime, 50);
            this.lastTime = timestamp;
            this.update(deltaTime);
            this.draw();
            this.animFrameId = requestAnimationFrame(this.loop.bind(this));
        }

    // ===========================
    update(deltaTime) {
        if (gameState.isGameOver) { this._triggerGameOver(); return; }

        // Level progress
        const leveledUp = gameState.updateLevel(deltaTime);
        if (leveledUp) {
            this.bossSpawned = false;
            this._onLevelUp();
        }

        // Spawn boss no final do level (80% do progresso)
        if (!this.bossSpawned && gameState.levelProgress >= 80) {
            this._spawnBoss();
            this.bossSpawned = true;
        }

        this.player.update(this.input, deltaTime);

        // Atualiza inimigos
        this.enemies.forEach(e => {
            if (Math.abs(e.x - this.cameraX) < 1400) e.update(this.player, deltaTime);
        });

        // Atualiza plataformas (timer)
        this.platforms.forEach(p => p.update(deltaTime));
        this.platforms = this.platforms.filter(p => !p.markedForDeletion);

        // Atualiza itens
        this.items.forEach(i => i.update(deltaTime));

        // Câmera
        const targetCam = this.player.x - this.canvas.width / 2;
        this.cameraX += (targetCam - this.cameraX) * this.cameraSmooth;
        this.cameraX = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.cameraX));

        this.generatePlatforms();
        this.cleanupPlatforms();

        // Spawn inimigos
        this.enemyTimer += deltaTime;
        const spawnInterval = this._spawnInterval();
        if (this.enemyTimer >= spawnInterval) {
            this._spawnEnemy();
            this.enemyTimer = 0;
        }

        // Colisão bala vs inimigo
        this.player.bullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (!enemy.alive || bullet.markedForDeletion) return;
                if (bullet.x < enemy.x + enemy.width  &&
                    bullet.x + bullet.width > enemy.x  &&
                    bullet.y < enemy.y + enemy.height  &&
                    bullet.y + bullet.height > enemy.y) {
                    enemy.takeDamage(1);
                    bullet.markedForDeletion = true;
                    if (!enemy.alive) gameState.addKill(enemy.points);
                }
            });
        });

        // Colisão player vs item
        this.items.forEach(item => {
            if (item.markedForDeletion) return;
            if (this.player.x < item.x + item.width  &&
                this.player.x + this.player.width > item.x &&
                this.player.y < item.y + item.height &&
                this.player.y + this.player.height > item.y) {
                item.apply(gameState);
            }
        });

        this.enemies = this.enemies.filter(e => e.alive);
        this.items   = this.items.filter(i => !i.markedForDeletion);
    }

    // ===========================
    draw() {
        // Fundo gradiente
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#c8e6f5');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-Math.floor(this.cameraX), 0);

        this.platforms.forEach(p => p.draw(this.ctx));
        this.items.forEach(i => i.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.player.draw(this.ctx);

        this.ctx.restore();

        // HUD (por cima, sem câmera)
        this.hud.draw();
    }

    // ===========================
    _triggerGameOver() {
        this.running = false;
        gameState.saveScore();

        document.getElementById("finalScore").textContent = gameState.score.toLocaleString();
        document.getElementById("finalLevel").textContent = gameState.currentLevel;
        document.getElementById("finalKills").textContent = gameState.kills;

        this.gameOverEl.style.display = "flex";
    }

    _onLevelUp() {
        // Adiciona velocidade ao spawn e ao world
        console.log(`Level UP: ${gameState.currentLevel}`);
    }

    _spawnBoss() {
        const spawnX = this.cameraX + this.canvas.width + 150;
        const boss = new Enemy(spawnX, 314, this, 'boss');
        boss.width  = 60;
        boss.height = 60;
        this.enemies.push(boss);
    }

    _spawnEnemy() {
        const lvl = gameState.currentLevel;
        const spawnX = this.cameraX + this.canvas.width + 100 + Math.random() * 300;
        const spawnY = 314;

        // Tipos disponíveis por level
        let pool = ['basic'];
        if (lvl >= 3)  pool.push('fast');
        if (lvl >= 5)  pool.push('jumper');
        if (lvl >= 8)  pool.push('tank');

        // Metade do level aumenta a frequência (já tratada no interval)
        const type = pool[Math.floor(Math.random() * pool.length)];
        const enemy = new Enemy(spawnX, spawnY, this, type);

        // Escala a velocidade base com o level
        enemy.speed += (lvl - 1) * 0.08;

        this.enemies.push(enemy);
    }

    _spawnInterval() {
        // Começa em 4s, reduz até 1s no level 20
        const lvl = gameState.currentLevel;
        return Math.max(1000, 4000 - (lvl - 1) * 160);
    }

    cleanupPlatforms() {
        this.platforms = this.platforms.filter((p, i) => {
            if (p.permanent) return true;
            return p.x + p.width > this.cameraX - 500;
        });
    }

    generatePlatforms() {
        while (this.nextPlatformX < this.cameraX + this.canvas.width + 500) {
            const w = 100 + Math.random() * 120;
            const y = 160 + Math.random() * 160;
            this.platforms.push(new Platform(this.nextPlatformX, y, w, 18));
            this.nextPlatformX += 160 + Math.random() * 130;
        }
    }
}