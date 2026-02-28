export class Bullet {
    constructor(x, y, dirX, speed = 10, dirY = 0) {
            this.x    = x;
            this.y    = y;
            this.dirX = dirX; // -1, 0, 1
            this.dirY = dirY; // -1=cima, 0=horizontal, 1=baixo
            this.speed = speed;
            this.markedForDeletion = false;

    
        // Tamanho varia por direção
        this.width  = dirY !== 0 ? 4  : 10;
        this.height = dirY !== 0 ? 10 : 4;
    }

    update(deltaTime = 16.6) {
        const sf = deltaTime / 16.6;
        this.x += this.speed * this.dirX * sf;
        this.y += this.speed * this.dirY * sf;

        if (this.x < -100 || this.x > 7000 ||
            this.y < -100 || this.y > 600) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#f6e05e';
        ctx.shadowColor = '#f6c90e';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        if (this.dirY !== 0) {
            // Bala vertical: elipse em pé
            ctx.ellipse(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2, this.height / 2,
                0, 0, Math.PI * 2
            );
        } else {
            // Bala horizontal: elipse deitada
            ctx.ellipse(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2, this.height / 2,
                0, 0, Math.PI * 2
            );
        }
        ctx.fill();
        ctx.restore();
    }
}