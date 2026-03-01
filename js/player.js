import { Bullet } from "./bullet.js";
import { gameState } from "./gameState.js";
import { AnimatedSprite } from "./animatedSprite.js";

export class Player {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width  = 54;  // um pouco menor que o frame (72) para hitbox mais justa
        this.height = 64;  // altura exata do frame
        this.speed = 5;
        this.velocityY = 0;
        this.gravity = 0.5;
        this.jumpForce = -10;
        this.jumpCutMultiplier = 0.4;
        this.onGround = false;
        this.bullets = [];
        this.shootCooldown = 0;
        this.direction = 1;
        this.knifeFlash = 0;
        this.invincible = 0;
        this.lastWeapon = null;

        // ===== SPRITE =====
        // Inicializado em _loadSprites via _applySheet
        this.sprite = null;
        this.sheets = {};
        this._loadSprites();
    }

    _loadSprites() {
        const loader = this.game.assets;

        // ============================================================
        // SPRITE SHEETS — grade e mapeamento de animações
        // Fuzil: 1264x848px, grade 8x5, frame 158x169px
        //   Linha 0: idle   (8 frames)
        //   Linha 1: walk   (8 frames)
        //   Linha 2: attack (8 frames) — com muzzle flash
        //   Linha 3: hit    (8 frames)
        //   Linha 4: death  (8 frames)
        // ============================================================

        const fuzilImg = loader.load('rifle_sheet', 'assets/sprites/player/fuzil_sheet.png');
        this.sheets = {
            rifle: {
                image:   fuzilImg,
                fw: 158, fh: 169,
                cols: 8,
                anims: {
                    idle:   { row: 0, frames: 8, speed: 160, loop: true  },
                    walk:   { row: 1, frames: 8, speed: 90,  loop: true  },
                    attack: { row: 2, frames: 8, speed: 60,  loop: false },
                    hit:    { row: 3, frames: 4, speed: 80,  loop: false },
                    death:  { row: 4, frames: 8, speed: 120, loop: false },
                }
            },
            // ── Descomente quando tiver os outros ──
            // knife: { image: loader.load('knife_sheet','assets/sprites/player/faca_sheet.png'), fw:72, fh:64, cols:4, anims:{...} },
            // pistol:{ image: loader.load('pistol_sheet','assets/sprites/player/pistola_sheet.png'), fw:158, fh:169, cols:8, anims:{...} },
        };

        this.lastWeapon = null;
        this._applySheet('rifle'); // começa com fuzil
    }

    // Troca a sheet inteira quando muda de arma
    _applySheet(weaponKey) {
        const sheet = this.sheets[weaponKey] || this.sheets['rifle'];
        this.sprite = new AnimatedSprite(sheet.fw, sheet.fh);

        for (const [name, cfg] of Object.entries(sheet.anims)) {
            this.sprite.addAnim(name, sheet.image, sheet.cols, 1, cfg.speed, cfg.loop, cfg.frames, cfg.row);
        }
        this.sprite.play('idle');
    }

    update(input, deltaTime) {
        const speedFactor = deltaTime / 16.6;

        // ===== HORIZONTAL =====
        let moveX = 0;
        if (input.keys["ArrowRight"]) { moveX =  this.speed * speedFactor; this.direction =  1; }
        if (input.keys["ArrowLeft"])  { moveX = -this.speed * speedFactor; this.direction = -1; }
        // ✅ ArrowUp e ArrowDown NUNCA mudam direction — só servem para pulo
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
                // ✅ Notifica a plataforma que foi pisada — inicia o timer
                platform.onPlayerLand();
            } else if (this.velocityY < 0 && this.y <= platform.y + platform.height && this.y >= platform.y) {
                this.y = platform.y + platform.height;
                this.velocityY = 0;
            }
        }

        // ===== COLISÃO COM INIMIGOS =====
        // O dano agora é tratado pelo enemy.js via game.onEnemyHitPlayer()
        // Aqui só garante invencibilidade após respawn
        if (this.invincible > 0) this.invincible -= deltaTime;

        // ===== DIREÇÃO DE MIRA =====
        // Horizontal: segue direction (esq/dir)
        // Vertical: ArrowDown = baixo, ArrowUp no AR = cima, senão = horizontal
        let aimY = 0; // 0=horizontal, -1=cima, 1=baixo
        if (input.keys["ArrowDown"]) aimY = 1;
        else if (input.keys["ArrowUp"] && !this.onGround) aimY = -1;

        // ===== TIRO / ATAQUE =====
        if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;
        if (input.keys[" "] && this.shootCooldown <= 0) {
            if (gameState.currentWeapon === 'knife') {
                this._knifeAttack(aimY);
                this.shootCooldown = 500;
            } else if (gameState.shoot()) {
                this.shoot(aimY);
                this.shootCooldown = gameState.currentWeapon === 'rifle' ? 150 : 300;
            }
        }

        this.bullets.forEach(b => b.update(deltaTime));
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);

        // ===== TROCA DE SHEET AO MUDAR ARMA =====
        if (this.lastWeapon !== gameState.currentWeapon) {
            this.lastWeapon = gameState.currentWeapon;
            const key = this.sheets[gameState.currentWeapon] ? gameState.currentWeapon : 'rifle';
            this._applySheet(key);
        }

        // ===== ATUALIZA ANIMAÇÃO =====
            const moving = input.keys["ArrowLeft"] || input.keys["ArrowRight"];
            if (this.knifeFlash > 0 && this.sprite.anims['attack']) {
                this.sprite.play('attack');
            } else if (moving && this.sprite.anims['walk']) {
                this.sprite.play('walk');
            } else {
                this.sprite.play('idle');
            }

            this.sprite.flipped = this.direction === -1;
            this.sprite.update(deltaTime);
        }

    reset() {
        // ✅ Só reseta física, NÃO muda posição — jogador fica onde está
        this.velocityY = 0;
        this.onGround  = false;
        // Munição mínima garantida ao morrer
        if (gameState.weapons.pistol.ammo < 10) gameState.weapons.pistol.ammo = 10;
    }

        draw(ctx) {
            if (this.invincible > 0 && Math.floor(this.invincible / 100) % 2 === 0) return;

            if (this.sprite) {
                this.sprite.draw(ctx, this.x, this.y, this.width, this.height);
            } else {
                // Fallback enquanto carrega
                ctx.fillStyle = '#e53e3e';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }

            if (this.knifeFlash > 0) {
                this.knifeFlash -= 16;
                const kx = this.direction === 1 ? this.x + this.width : this.x - 30;
                ctx.save();
                ctx.globalAlpha = this.knifeFlash / 200;
                ctx.font = '28px Arial';
                ctx.fillText('⚡', kx, this.y + 20);
                ctx.restore();
            }

        this.bullets.forEach(b => b.draw(ctx));
    }

    shoot(aimY = 0) {
        let bulletX, bulletY, dirX, dirY;
        const speed = gameState.currentWeapon === 'rifle' ? 16 : 10;

        if (aimY !== 0) {
            // Tiro vertical: sai do centro do personagem
            bulletX = this.x + this.width / 2 - 2;
            bulletY = aimY === -1 ? this.y - 10 : this.y + this.height;
            dirX    = 0;
            dirY    = aimY;
        } else {
            // Tiro horizontal normal
            bulletX = this.direction === 1 ? this.x + this.width : this.x - 10;
            bulletY = this.y + this.height / 2 - 2;
            dirX    = this.direction;
            dirY    = 0;
        }
        this.bullets.push(new Bullet(bulletX, bulletY, dirX, speed, dirY));
    }

    _knifeAttack(aimY = 0) {
        const range = 50;
        let knifeX, knifeY, knifeW, knifeH;

        if (aimY !== 0) {
            // Facada vertical
            knifeX = this.x;
            knifeY = aimY === -1 ? this.y - range : this.y + this.height;
            knifeW = this.width;
            knifeH = range;
        } else {
            knifeX = this.direction === 1 ? this.x + this.width : this.x - range;
            knifeY = this.y;
            knifeW = range;
            knifeH = this.height;
        }

        for (let enemy of this.game.enemies) {
            if (!enemy.alive) continue;
            const hit = knifeX < enemy.x + enemy.width &&
                        knifeX + knifeW > enemy.x &&
                        knifeY < enemy.y + enemy.height &&
                        knifeY + knifeH > enemy.y;
            if (hit) {
                enemy.takeDamage(1);
                if (!enemy.alive) gameState.addKill(enemy.points);
            }
        }
        this.knifeFlash = 200;
    }
}