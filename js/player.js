import { Bullet } from "./bullet.js";

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
        this.jumpCutMultiplier = 0.5;

        this.onGround = false;

        this.bullets = [];
        this.shootCooldown = 0;
        this.direction = 1; // começa olhando direita
    }


//=======UPDATE+++++++


    update(input) {
    // ===== MOVIMENTO HORIZONTAL =====

       let moveX = 0; // 🔥 FALTAVA ISSO

    if (input.keys["ArrowRight"]) {
        moveX = this.speed;
        this.direction = 1;
    }

    if (input.keys["ArrowLeft"]) {
        moveX = -this.speed;
        this.direction = -1;
    }
    
    this.x += moveX;

    // ===== PULO =====
    if (input.keys["ArrowUp"] && this.onGround) {
        this.velocityY = this.jumpForce;
        this.onGround = false;
    }

    // ===== GRAVIDADE =====
    this.velocityY += this.gravity;

    // ===============================
    // 🔥 COLISÃO HORIZONTAL PRIMEIRO
    // ===============================
    

    for (let platform of this.game.platforms) {
        const overlapY =
            this.y + this.height > platform.y &&
            this.y < platform.y + platform.height;

        if (overlapY) {
            // batendo pela direita
            if (
                moveX > 0 &&
                this.x + this.width > platform.x &&
                this.x < platform.x
            ) {
                this.x = platform.x - this.width;
            }

            // batendo pela esquerda
            if (
                moveX < 0 &&
                this.x < platform.x + platform.width &&
                this.x + this.width > platform.x + platform.width
            ) {
                this.x = platform.x + platform.width;
            }
        }
    }

    // ===============================
    // 🔥 COLISÃO VERTICAL
    // ===============================
    this.y += this.velocityY;
    this.onGround = false;

    for (let platform of this.game.platforms) {
        const overlapX =
            this.x + this.width > platform.x &&
            this.x < platform.x + platform.width;

        if (overlapX) {
            // caindo no topo
            if (
                this.velocityY >= 0 &&
                this.y + this.height >= platform.y &&
                this.y + this.height <= platform.y + this.velocityY + 5
             ) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.onGround = true;
            }

            // batendo por baixo
            if (
                this.velocityY < 0 &&
                this.y <= platform.y + platform.height &&
                this.y >= platform.y
            ) {
                this.y = platform.y + platform.height;
                this.velocityY = 0;
            }
        }
    }

    // 🔥 PULO VARIÁVEL (corte do pulo)
    if (!input.keys["ArrowUp"] && this.velocityY < 0) {
       this.velocityY *= this.jumpCutMultiplier;
     }

       // ===== LIMITES DO MUNDO =====
      if (this.x < 0) this.x = 0;

      if (this.x + this.width > this.game.worldWidth) {
        this.x = this.game.worldWidth - this.width;
    }

    // ===============================
    // 👾 COLISÃO COM INIMIGOS
    // ===============================
    for (let enemy of this.game.enemies) {
       if (!enemy.alive) continue;

        const hit =
        this.x < enemy.x + enemy.width &&
        this.x + this.width > enemy.x &&
        this.y < enemy.y + enemy.height &&
        this.y + this.height > enemy.y;

        if (hit) {
        // 🔥 matou o inimigo pulando em cima
        if (this.velocityY > 0 && this.y + this.height - enemy.y < 20) {
            enemy.alive = false;
            this.velocityY = this.jumpForce * 0.6; // quique
           } else {
            // 💀 player morreu (reset simples)
            this.x = 100;
            this.y = 100;
            this.velocityY = 0;
               }
             }
        }

        // cooldown tiro
        if (this.shootCooldown > 0) {
           this.shootCooldown--;
        }

       // atirar
       if (input.keys[" "] && this.shootCooldown <= 0) {
          this.shoot();
          this.shootCooldown = 20;
          }

        // atualizar balas
       this.bullets.forEach(b => b.update());
       this.bullets = this.bullets.filter(b => !b.markedForDeletion);

    }

    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.bullets.forEach(b => b.draw(ctx));
    }

    shoot() {
    const bulletX = this.direction === 1
        ? this.x + this.width
        : this.x - 10;

         const bulletY = this.y + this.height / 2;

           this.bullets.push(
             new Bullet(bulletX, bulletY, this.direction)
            );
        }
       

}