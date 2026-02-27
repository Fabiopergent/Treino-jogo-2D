export class Bullet {
    constructor(x, y, direction, speed = 10) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 4;
        this.speed = speed;
        this.direction = direction;
        this.markedForDeletion = false;
    }

    update(deltaTime = 16.6) {
        const speedFactor = deltaTime / 16.6;
        this.x += this.speed * this.direction * speedFactor;
        if (this.x < -100 || this.x > 4000) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.fillStyle = "#f6e05e";
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}