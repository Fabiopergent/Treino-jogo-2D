export const gameState = {
    lives: 3,
    maxLives: 10,
    currentLevel: 1,
    score: 0,
    isGameOver: false,
    
    resetLevel() {
        // Lógica para reiniciar o nível mantendo as vidas
        this.isGameOver = false;
    },
    
    takeDamage() {
        this.lives--;
        if (this.lives <= 0) {
            this.isGameOver = true;
        }
    },
    
    gainLife() {
        if (this.lives < this.maxLives) {
            this.lives++;
        }
    }
};