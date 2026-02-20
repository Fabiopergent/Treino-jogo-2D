export class Player {
    constructor(x, y, game) {
        this.game = game;

        this.x = x;
        this.y = y;

        this.width = 40;
        this.height = 40;

        this.velX = 0;
        this.velY = 0;

        this.speed = 4;
        this.gravity = 0.5;
        this.jumpForce = -10;

        this.onGround = false;
    
    }


    update(input) {
        // ===== MOVIMENTO HORIZONTAL =====
        this.velX = 0;


        if (input.keys["ArrowRight"]) {
            this.velX = this.speed;
        }

        if (input.keys["ArrowLeft"]) {
            this.velX = -this.speed;
        }

        // ===== PULO =====
        if (input.keys["Space"] && this.onGround) {
            this.velY = this.jumpForce;
            this.onGround = false;
        }

        // ===== GRAVIDADE =====
        this.velY += this.gravity;

        // ===== APLICA MOVIMENTO =====
        this.x += this.velX;
        this.y += this.velY;

        // ===== COLISÃO COM PLATAFORMAS =====
        this.onGround = false;

        this.game.platforms.forEach(platform => {
            const dentroX =
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width;

            const tocandoTopo =
                this.y + this.height >= platform.y &&
                this.y + this.height <= platform.y + platform.height &&
                this.velY >= 0;

            if (dentroX && tocandoTopo) {
                this.y = platform.y - this.height;
                this.velY = 0;
                this.onGround = true;
            }
        });

        // ===== LIMITES DO MUNDO =====

        // esquerda
        if (this.x < 0) this.x = 0;

        // direita
        const maxX = this.game.worldWidth - this.width;
        if (this.x > maxX) this.x = maxX;

        // chão de segurança (fallback)
        if (this.y > this.game.canvas.height) {
            this.y = 0;
            this.velY = 0;
        }

        // proteção contra NaN
        if (isNaN(this.x) || isNaN(this.y)) {
            console.warn("Player NaN detectado — resetando");
            this.x = 100;
            this.y = 100;
            this.velX = 0;
            this.velY = 0;
        }
    }


    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }


}
