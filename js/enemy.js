export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.width = 40;
        this.height = 40;

        this.speed = 1.2;
        this.direction = -1;
        
        this.alive = true;
        this.hp = 2; // <--- Agora o zumbi precisa de 2 tiros para morrer
        this.flash = 0; // Para o efeito visual de dano
    }

    takeDamage() {
        this.hp--;
        this.flash = 10; // Pisca por 10 frames
        if (this.hp <= 0) this.alive = false;
    }

    update(player) { // Agora recebe o player para perseguir
        if (!this.alive) return;

        // Lógica de perseguição
        this.direction = (player.x > this.x) ? 1 : -1;
        this.x += this.speed * this.direction;
        
        if (this.flash > 0) this.flash--;
    }

    draw(ctx) {
        if (!this.alive) return;
        // Pisca branco se estiver levando dano
        ctx.fillStyle = this.flash > 0 ? "white" : "purple";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}