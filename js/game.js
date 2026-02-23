import { Player } from './player.js';
import { Input } from './input.js';
import { Platform } from './platform.js';
import { Enemy } from './enemy.js';
import { gameState } from './gameState.js';


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

        this.enemyTimer = 0;

        this.nextPlatformX = 800; // onde começa gerar
        this.platformSpacing = 180; // distância média
        this.minPlatformWidth = 100;
        this.maxPlatformWidth = 200;

        this.platforms = [
            new Platform(0, 350, 2000, 50),
            new Platform(200, 280, 120, 20),
            new Platform(400, 220, 120, 20),
            new Platform(600, 300, 120, 20)
        ];

        this.player = new Player(100, 100, this);

        this.lastTime = 0;
        
        this.enemies = [
            new Enemy(500, 310, this),
            new Enemy(900, 310, this)
        ];

        this.items = [];


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


//+++++++ Update=========


    update(deltaTime) {
        this.player.update(this.input);
        this.enemies.forEach(enemy => {
            
            // Apenas atualiza a IA se o inimigo estiver perto da tela (1200px de margem)
            if (Math.abs(enemy.x - this.cameraX) < 1200) {
                enemy.update(this.player);
            }
            });

        // 🎥 câmera alvo (centro do player)
        const targetCamera = this.player.x - this.canvas.width / 2;

        // suavização (remove trepidação)
        this.cameraX += (targetCamera - this.cameraX) * this.cameraSmooth;

        // trava esquerda
        if (this.cameraX < 0) this.cameraX = 0;

        // trava direita
        const maxCamera = this.worldWidth - this.canvas.width;
        if (this.cameraX > maxCamera) this.cameraX = maxCamera;

        // 1. Gerar novas plataformas primeiro
        this.generatePlatforms();

        // 2. Limpar plataformas antigas (aumente um pouco a margem)
        this.cleanupPlatforms();



        this.enemyTimer++;
        if (this.enemyTimer > 300) { // A cada X frames (ajuste conforme a dificuldade)
            const spawnX = this.cameraX + this.canvas.width + 100 + Math.random() * 200; // Espalha em 200px
            const spawnY = 280 + Math.random() * 40; // Varia um pouco a altura para não ficarem na mesma linha
            let newEnemy = new Enemy(spawnX, spawnY, this);
            // Ajuste de dificuldade progressiva
            newEnemy.speed = 1 + (gameState.currentLevel * 0.2); 
            this.enemies.push(newEnemy);
            this.enemyTimer = 0;
            }


        // Colisão bala vs inimigo
        this.player.bullets.forEach(bullet => {
           this.enemies.forEach(enemy => {
            if (enemy.alive && 
               bullet.x < enemy.x + enemy.width &&
               bullet.x + bullet.width > enemy.x &&
               bullet.y < enemy.y + enemy.height &&
               bullet.y + bullet.height > enemy.y) {
            
               enemy.takeDamage(); // <--- Chama o novo método de dano
                  bullet.markedForDeletion = true; // Bala some
                }
            });
        });

        this.items.forEach(item => {
                // Colisão player vs item
                if (this.player.x < item.x + item.width &&
                    this.player.x + this.player.width > item.x &&
                    this.player.y < item.y + item.height &&
                    this.player.y + this.player.height > item.y) {
                    
                    if (item.type === 'heal') gameState.gainLife();
                    item.markedForDeletion = true;
                    }
                });
        this.enemies = this.enemies.filter(enemy => enemy.alive);
        this.items = this.items.filter(i => !i.markedForDeletion);


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

        // desenhar itens
        this.items.forEach(item => item.draw(this.ctx));

        // player
        this.player.draw(this.ctx);

        this.ctx.restore();

        // 🔥 ADICIONE ESTE BLOCO PARA MOSTRAR A VIDA
        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.fillText("Vidas: " + gameState.lives, 20, 30);
    }
  


    cleanupPlatforms() {
    // Filtra mantendo a primeira plataforma (o chão) ou as que estão perto da câmera
    this.platforms = this.platforms.filter((platform, index) => {
        if (index === 0) return true; // Nunca deleta o chão (índice 0)
        return platform.x + platform.width > this.cameraX - 500; // Margem maior (500)
          });
        }
      
      generatePlatforms() {
      // gera enquanto a câmera se aproxima do fim
      while (this.nextPlatformX < this.cameraX + this.canvas.width + 400) {
        
        const width =
            this.minPlatformWidth +
            Math.random() * (this.maxPlatformWidth - this.minPlatformWidth);

        const height = 20;

        // altura aleatória segura
        const minY = 180;
        const maxY = 320;
        const y = minY + Math.random() * (maxY - minY);

        this.platforms.push(
            new Platform(this.nextPlatformX, y, width, height)
        );

        // avança para próxima
        this.nextPlatformX +=
            this.platformSpacing + Math.random() * 120;
    }
}
        
}
