export class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type; // 'heal' ou 'speed'
        this.markedForDeletion = false;
    }

    update() {}

    draw(ctx) {
        ctx.fillStyle = this.type === 'heal' ? "green" : "yellow";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}