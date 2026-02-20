import { Player } from './player.js';
import { Input } from './input.js';
import { Platform } from './platform.js';
import { Enemy } from './enemy.js';


export class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.width = 800;
        this.canvas.height = 400;

        this.worldWidth = 2000;
        this.cameraX = 0;
        this.cameraSmooth = 0.1; // suavização da câmera

        this.input = new Input();

        this.platforms = [
            new Platform(0, 350, 2000, 50),
            new Platform(200, 280, 120, 20),
            new Platform(400, 220, 120, 20),
            new Platform(600, 300, 120, 20)
        ];

        this.player = new Player(100, 100, this);

        this.lastTime = 0;
        
        this.enemies = [
            new Enemy(500, 310),
            new Enemy(900, 310)
];


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
        this.enemies.forEach(enemy => enemy.update());

        // 🎥 câmera alvo (centro do player)
        const targetCamera = this.player.x - this.canvas.width / 2;

        // suavização (remove trepidação)
        this.cameraX += (targetCamera - this.cameraX) * this.cameraSmooth;

        // trava esquerda
        if (this.cameraX < 0) this.cameraX = 0;

        // trava direita
        const maxCamera = this.worldWidth - this.canvas.width;
        if (this.cameraX > maxCamera) this.cameraX = maxCamera;
    }

    draw() {
        // fundo azul
        this.ctx.fillStyle = "#87CEEB";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // aplica câmera
        this.ctx.translate(-Math.floor(this.cameraX), 0);

        // plataformas
        this.platforms.forEach(platform => platform.draw(this.ctx));
         
        // inimigos
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // player
        this.player.draw(this.ctx);

        this.ctx.restore();
  
    }
}