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

        this.grounded = false;
    }

    update(input) {

        // Movimento lateral
        if (input.keys["ArrowRight"]) {
            this.x += this.speed;
        }

        if (input.keys["ArrowLeft"]) {
            this.x -= this.speed;
        }

        // Aplicar gravidade
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Reset grounded
        this.grounded = false;

        // Colisão com plataformas
        for (let platform of this.game.platforms) {

            if (
                this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height > platform.y &&
                this.y + this.height < platform.y + platform.height &&
                this.velocityY >= 0
            ) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.grounded = true;
            }
        }

        // Pulo
        if (input.keys["ArrowUp"] && this.grounded) {
            this.velocityY = this.jumpForce;
            this.grounded = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
