import { Player } from './player.js';
import { Input } from './input.js';
import { Platform } from './platform.js';


export class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.cameraX = 0;
        this.canvas.width = 800;
        this.canvas.height = 400;
        this.worldWidth = 2000; // largura do mundo

        this.input = new Input();

        this.platforms = [
            new Platform(0, 350, 2000, 50),
            new Platform(200, 280, 120, 20),
            new Platform(400, 220, 120, 20),
            new Platform(600, 300, 120, 20)
        ];

        this.player = new Player(100, 100, this);

        this.lastTime = 0;
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(deltaTime) {
    this.player.update(this.input);

    // =========================
// LIMITES DO MUNDO
// =========================

// esquerda
if (this.x < 0) {
    this.x = 0;
}

// direita
if (this.x + this.width > this.game.worldWidth) {
    this.x = this.game.worldWidth - this.width;
}

    // câmera segue o jogador
    const targetCameraX = this.player.x - this.canvas.width / 2;

    // suavização (lerp)
    this.cameraX += (targetCameraX - this.cameraX) * 0.1;

    // trava na esquerda
    if (this.cameraX < 0) {
        this.cameraX = 0;
    }

    // 🔥 trava na direita (IMPORTANTE)
    const maxCamera = this.worldWidth - this.canvas.width;
    if (this.cameraX > maxCamera) {
        this.cameraX = maxCamera;
    }
}
    

    draw() {
       this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

       this.ctx.save();

    // aplica câmera
       this.ctx.translate(-this.cameraX, 0);

    // desenha plataformas
       this.platforms.forEach(platform => platform.draw(this.ctx));

    // desenha player
       this.player.draw(this.ctx);

       this.ctx.restore();
}

    
}
