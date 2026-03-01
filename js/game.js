import { Player }     from './player.js';
import { Input }      from './input.js';
import { Platform }   from './platform.js';
import { Enemy }      from './enemy.js';
import { Item }       from './item.js';
import { HUD }        from './hud.js';
import { gameState }  from './gameState.js';
import { AssetLoader } from './assetLoader.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx    = this.canvas.getContext("2d");
        this.canvas.width  = 800;
        this.canvas.height = 400;

        this.worldWidth   = 6000;  // ✅ mundo maior para plataformas não sumircm
        this.cameraX      = 0;
        this.cameraSmooth = 0.1;

        this.input  = new Input();
        this.hud    = new HUD(this.canvas);
        this.assets = new AssetLoader(); // ✅ disponível para player e enemies

        this.running     = false;
        this.animFrameId = null;
        this.lastTime    = 0;

        this.enemyTimer  = 0;
        this.bossActive  = false;  // ✅ boss está vivo agora?
        this.bossSpawned = false;  // ✅ boss já foi spawnado neste level?

        this.platforms = [];
        this.enemies   = [];
        this.items     = [];
        this.player    = null;

        // ✅ Plataformas geradas em ambas as direções
        this.nextPlatformXRight = 800;
        this.nextPlatformXLeft  = 0;

        this._setupMenu();
    }

    _setupMenu() {
        const menu           = document.getElementById("menu");
        const startBtn       = document.getElementById("startButton");
        const gameOverScreen = document.getElementById("gameOverScreen");
        const restartBtn     = document.getElementById("restartButton");
        const menuBtn        = document.getElementById("menuButton");

        this.menuEl     = menu;
        this.gameOverEl = gameOverScreen;

        this._renderScores();

        startBtn.addEventListener("click", () => {
            const name = document.getElementById("playerName").value.trim() || "Player";
            menu.style.display = "none";
            this.resetGame(name);
            this.start();
        });

        restartBtn?.addEventListener("click", () => {
            gameOverScreen.style.display = "none";
            this.resetGame(gameState.playerName);
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

        this.cameraX    = 0;
        this.enemyTimer = 0;
        this.bossActive  = false;
        this.bossSpawned = false;
        this.lastTime   = 0;

        this.nextPlatformXRight = 800;
        this.nextPlatformXLeft  = 0;

        // ✅ Chão permanente cobrindo o mundo inteiro
        this.platforms = [
            new Platform(0, 350, this.worldWidth, 50, true),
            new Platform(200, 280, 120, 18),
            new Platform(400, 220, 120, 18),
            new Platform(600, 300, 120, 18),
        ];

        this.player  = new Player(400, 280, this);
        this.enemies = [];
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

    update(deltaTime) {
        if (gameState.isGameOver) { this._triggerGameOver(); return; }

        // ===== SISTEMA DE LEVEL POR KILLS ===== ✅
        // Boss spawn: quando kills atingiu o alvo e boss ainda não foi spawnado
        if (!this.bossSpawned && gameState.killsThisLevel >= gameState.killsToNextBoss) {
            this._spawnBoss();
            this.bossSpawned = true;
            this.bossActive  = true;
        }

        // Avança level quando boss foi derrotado
        if (this.bossSpawned && this.bossActive && !this.enemies.some(e => e.type === 'boss' && e.alive)) {
            this.bossActive  = false;
            gameState.nextLevel();
            this.bossSpawned = false;
            this._showLevelUp();
        }

        this.player.update(this.input, deltaTime);

        this.enemies.forEach(e => {
            if (Math.abs(e.x - this.cameraX) < 1400) e.update(this.player, deltaTime);
        });

        this.platforms.forEach(p => p.update(deltaTime));
        this.items.forEach(i => i.update(deltaTime));

        // Câmera
        const targetCam = this.player.x - this.canvas.width / 2;
        this.cameraX += (targetCam - this.cameraX) * this.cameraSmooth;
        this.cameraX = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.cameraX));

        // ✅ Gera plataformas em ambos os lados
        this.generatePlatforms();
        this.cleanupPlatforms();

        // ===== SPAWN INIMIGOS dos dois lados ===== ✅
        // Só spawna inimigos normais enquanto boss não está ativo
        if (!this.bossActive) {
            this.enemyTimer += deltaTime;
            if (this.enemyTimer >= this._spawnInterval()) {
                this._spawnEnemy();
                this.enemyTimer = 0;
            }
        }

        // Colisão bala vs inimigo
        this.player.bullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (!enemy.alive || bullet.markedForDeletion) return;
                if (bullet.x < enemy.x + enemy.width  &&
                    bullet.x + bullet.width  > enemy.x &&
                    bullet.y < enemy.y + enemy.height  &&
                    bullet.y + bullet.height > enemy.y) {
                    enemy.takeDamage(1);
                    bullet.markedForDeletion = true;
                    if (!enemy.alive) {
                        gameState.addKill(enemy.points);
                        // Se era boss, marca derrota
                        if (enemy.type === 'boss') gameState.bossKilled();
                    }
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

    draw() {
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

        this.hud.draw();

        // Aviso de boss chegando
        if (this.bossActive) {
            this.ctx.save();
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillStyle = '#f6c90e';
            this.ctx.shadowColor = '#f6c90e';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('⚠️ BOSS DO LEVEL ' + gameState.currentLevel + ' CHEGOU!', this.canvas.width / 2, 80);
            this.ctx.restore();
        }
    }

    // ===== DANO DO INIMIGO ===== ✅ player volta para posição atual, não para o início
    onEnemyHitPlayer() {
        if (!this.player || gameState.isGameOver) return;
        if (this.player.invincible > 0) return;
        gameState.takeDamage(34);
        this.player.invincible = 1500;
        // ✅ NÃO faz reset de posição — player fica onde está
    }

    _triggerGameOver() {
        this.running = false;
        gameState.saveScore();
        document.getElementById("finalScore").textContent = gameState.score.toLocaleString();
        document.getElementById("finalLevel").textContent = gameState.currentLevel;
        document.getElementById("finalKills").textContent = gameState.kills;
        this.gameOverEl.style.display = "flex";
    }

    _showLevelUp() {
        // Mensagem visual de level up (simples por enquanto)
        console.log(`Level UP! Agora no level ${gameState.currentLevel}`);
    }

    _spawnBoss() {
        // Boss spawna do lado direito da tela
        const spawnX = this.cameraX + this.canvas.width + 100;
        const boss = new Enemy(spawnX, 290, this, 'boss');
        boss.width  = 60;
        boss.height = 60;
        this.enemies.push(boss);
    }

    _spawnEnemy() {
        const lvl = gameState.currentLevel;

        let pool = ['basic'];
        if (lvl >= 2) pool.push('fast');
        if (lvl >= 3) pool.push('jumper');
        if (lvl >= 5) pool.push('tank');

        const type = pool[Math.floor(Math.random() * pool.length)];

        // ✅ Spawna dos dois lados alternadamente ou aleatoriamente
        const fromRight = Math.random() > 0.5;
        const spawnX = fromRight
            ? this.cameraX + this.canvas.width + 80 + Math.random() * 200  // direita
            : this.cameraX - 80 - Math.random() * 200;                      // esquerda

        const spawnX2 = Math.max(0, Math.min(this.worldWidth - 40, spawnX));
        const enemy = new Enemy(spawnX2, 314, this, type);
        enemy.speed += (lvl - 1) * 0.08;

        this.enemies.push(enemy);
    }

    _spawnInterval() {
        return Math.max(1200, 4000 - (gameState.currentLevel - 1) * 200);
    }

    // ✅ Plataformas nunca somem ao voltar para esquerda
    cleanupPlatforms() {
        this.platforms = this.platforms.filter(p => {
            if (p.permanent) return true;
            return p.x + p.width > this.cameraX - 1400 &&
                   p.x < this.cameraX + this.canvas.width + 1400;
        });
    }

    generatePlatforms() {
        this._genDir('right');
        this._genDir('left');
    }

    _genDir(dir) {
        const limit = dir === 'right'
            ? this.cameraX + this.canvas.width + 700
            : this.cameraX - 700;

        const shouldContinue = () => dir === 'right'
            ? this.nextPlatformXRight < limit
            : this.nextPlatformXLeft > limit;

        while (shouldContinue()) {
            const w   = 100 + Math.random() * 120;
            const h   = 18;
            const gap = 200 + Math.random() * 150; // ✅ gap maior evita sobreposição

            // ✅ Y em faixas fixas de 45px — evita plataformas em cima umas das outras
            const slot = Math.floor(Math.random() * 5);
            const y    = 155 + slot * 45; // faixas: 155, 200, 245, 290, 335

            let x;
            if (dir === 'right') {
                x = this.nextPlatformXRight;
                this.nextPlatformXRight += gap;
            } else {
                this.nextPlatformXLeft -= gap;
                if (this.nextPlatformXLeft < 0) break;
                x = this.nextPlatformXLeft;
            }

            // ✅ Verifica sobreposição antes de adicionar
            if (this._overlaps(x, y, w, h)) continue;

            // ✅ 10% de chance de ser permanente (fixa, não some)
            const isPermanent = Math.random() < 0.10;
            this.platforms.push(new Platform(x, y, w, h, isPermanent));
        }
    }

    _overlaps(x, y, w, h) {
        const mx = 20, my = 10; // margem horizontal e vertical
        return this.platforms.some(p => {
            if (p.permanent) return false;
            return x < p.x + p.width  + mx &&
                   x + w > p.x        - mx &&
                   y < p.y + p.height + my &&
                   y + h > p.y        - my;
        });
    }
}