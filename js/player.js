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
        // Movimento lateral
        if (input.keys["ArrowRight"]) {
            this.x += this.speed;
        }

        if (input.keys["ArrowLeft"]) {
            this.x -= this.speed;
        }

        // Gravidade
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Reset chão
        this.onGround = false;

        // Colisão com plataformas
        for (let platform of this.game.platforms) {
            const playerBottom = this.y + this.height;
            const playerRight = this.x + this.width;
            const playerLeft = this.x;

            const platformTop = platform.y;
            const platformLeft = platform.x;
            const platformRight = platform.x + platform.width;

            if (
                playerRight > platformLeft &&
                playerLeft < platformRight &&
                playerBottom >= platformTop &&
                playerBottom <= platformTop + this.velocityY &&
                this.velocityY >= 0
            ) {
                this.y = platformTop - this.height;
                this.velocityY = 0;
                this.onGround = true;
            }
        }

        // Pulo
        if (input.keys["ArrowUp"] && this.onGround) {
            this.velocityY = this.jumpForce;
            this.onGround = false;
        }

        // 🔥 limites do mundo
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