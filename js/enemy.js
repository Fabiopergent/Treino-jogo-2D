export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.width = 40;
        this.height = 40;

        this.speed = 1.2;
        this.direction = -1;

        this.alive = true;
    }

    update() {
        if (!this.alive) return;

        this.x += this.speed * this.direction;
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.fillStyle = "purple";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}