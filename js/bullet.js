export class Bullet {
    constructor(x, y, direction) {
            this.x = x;
            this.y = y;
            this.width = 10;
            this.height = 4;
            this.speed = 8;
            this.direction = direction; // 1 direita, -1 esquerda
            this.markedForDeletion = false;
        }

    // ✅ Recebe deltaTime para velocidade consistente em qualquer frame rate
    update(deltaTime = 16.6) {
        const speedFactor = deltaTime / 16.6;
        this.x += this.speed * this.direction * speedFactor;

        if (this.x < -50 || this.x > 3000) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}