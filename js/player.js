export class Player {
    constructor(x, y, game) {
        this.game = game;

        this.x = x;
        this.y = y;

        this.width = 40;
        this.height = 40;

        this.speed = 5;
        this.velocityY = 0;
        this.gravity = 0.5;
        this.jumpForce = -10;

        this.grounded = false;
    }

    

    update(input) {

        // Movimento lateral
        if (input.keys["ArrowRight"]) {
            this.x += this.speed;
        }

        if (input.keys["ArrowLeft"]) {
            this.x -= this.speed;
        }

        // Aplicar gravidade
        this.velocityY += this.gravity;

        // Movimento vertical
        this.y += this.velocityY;
        

        // Reset grounded
this.grounded = false;

// ===== COLISÕES =====
for (let platform of this.game.platforms) {

    let playerBottom = this.y + this.height;
    let playerTop = this.y;
    let playerRight = this.x + this.width;
    let playerLeft = this.x;

    let platformTop = platform.y;
    let platformBottom = platform.y + platform.height;
    let platformLeft = platform.x;
    let platformRight = platform.x + platform.width;

    // =========================
    // COLISÃO POR CIMA (piso)
    // =========================
    if (
        playerRight > platformLeft &&
        playerLeft < platformRight &&
        playerBottom >= platformTop &&
        playerTop < platformTop &&
        this.velocityY >= 0
    ) {
        this.y = platformTop - this.height;
        this.velocityY = 0;
        this.grounded = true;
    }

    // =========================
    // COLISÃO PELA ESQUERDA
    // =========================
    if (
        playerRight > platformLeft &&
        playerLeft < platformLeft &&
        playerBottom > platformTop &&
        playerTop < platformBottom
    ) {
        this.x = platformLeft - this.width;
    }

    // =========================
    // COLISÃO PELA DIREITA
    // =========================
    if (
        playerLeft < platformRight &&
        playerRight > platformRight &&
        playerBottom > platformTop &&
        playerTop < platformBottom
    ) {
        this.x = platformRight;
    }
}

        // Pulo
        if (input.keys["ArrowUp"] && this.grounded) {
            this.velocityY = this.jumpForce;
            this.grounded = false;
        }
    }


    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    
}
