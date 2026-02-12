export class Player {
    constructor(x, y) {
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

        // Pulo
        if (input.keys["ArrowUp"] && this.grounded) {
            this.velocityY = this.jumpForce;
            this.grounded = false;
        }

        // Gravidade
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Chão simples
        if (this.y + this.height >= 350) {
            this.y = 350 - this.height;
            this.velocityY = 0;
            this.grounded = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
