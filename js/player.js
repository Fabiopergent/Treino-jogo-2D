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

        this.onGround = false;
    }

    update(input) {
    // ===== MOVIMENTO HORIZONTAL =====
    let moveX = 0;

    if (input.keys["ArrowRight"]) moveX = this.speed;
    if (input.keys["ArrowLeft"]) moveX = -this.speed;

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
    this.x += moveX;

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

    // ===== LIMITES DO MUNDO =====
    if (this.x < 0) this.x = 0;

    if (this.x + this.width > this.game.worldWidth) {
        this.x = this.game.worldWidth - this.width;
    }
}

    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}