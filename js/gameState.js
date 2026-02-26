export const gameState = {
    // ===== VIDA =====
    lives: 3,
    maxLives: 3,          // cresce a cada 5 levels (cap 10)
    hp: 100,              // barra de HP (0-100)
    armor: 0,             // colete absorve dano antes do HP (0-100)

    // ===== LEVEL =====
    currentLevel: 1,
    levelProgress: 0,     // 0-100, progresso dentro do level
    levelDuration: 30000, // ms por level (30s), diminui com dificuldade
    levelTimer: 0,        // ms acumulados no level atual

    // ===== ARMA =====
    weaponIcon: '🔫',
    ammo: 30,
    maxAmmo: 30,
    weaponName: 'Pistola',

    // ===== SCORE =====
    score: 0,
    kills: 0,
    playerName: 'Player',

    // ===== FLAGS =====
    isGameOver: false,
    running: false,

    // ===== MÉTODOS DE VIDA =====
    takeDamage(amount = 34) {
        // Colete absorve primeiro
        if (this.armor > 0) {
            const absorbed = Math.min(this.armor, amount);
            this.armor -= absorbed;
            amount -= absorbed;
        }
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.lives--;
            if (this.lives <= 0) {
                this.lives = 0;
                this.isGameOver = true;
            } else {
                this.hp = 100; // respawn com HP cheio
            }
        }
    },

    gainLife() {
        if (this.lives < this.maxLives) this.lives++;
    },

    gainHP(amount = 30) {
        this.hp = Math.min(100, this.hp + amount);
    },

    gainArmor(amount = 50) {
        this.armor = Math.min(100, this.armor + amount);
    },

    // ===== MUNIÇÃO =====
    shoot() {
        if (this.ammo <= 0) return false;
        this.ammo--;
        return true;
    },

    gainAmmo(amount = 10) {
        this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    },

    // ===== KILLS & SCORE =====
    addKill(points = 10) {
        this.kills++;
        this.score += points * this.currentLevel;
    },

    // ===== LEVEL PROGRESS =====
    updateLevel(deltaTime) {
        this.levelTimer += deltaTime;
        this.levelProgress = Math.min(100, (this.levelTimer / this.levelDuration) * 100);

        if (this.levelTimer >= this.levelDuration) {
            this.levelTimer = 0;
            this.levelProgress = 0;
            this.currentLevel++;

            // A cada 5 levels ganha +1 vida máxima (cap 10)
            if (this.currentLevel % 5 === 0 && this.maxLives < 10) {
                this.maxLives++;
                this.lives = Math.min(this.lives + 1, this.maxLives);
            }

            // Restaura HP no novo level
            this.hp = 100;

            // Reduz duração do level conforme avança (mínimo 15s)
            this.levelDuration = Math.max(15000, 30000 - (this.currentLevel - 1) * 1000);

            return true; // sinaliza que passou de level
        }
        return false;
    },

    // ===== RESET =====
    reset(playerName = 'Player') {
        this.lives = 3;
        this.maxLives = 3;
        this.hp = 100;
        this.armor = 0;
        this.currentLevel = 1;
        this.levelProgress = 0;
        this.levelTimer = 0;
        this.levelDuration = 30000;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.weaponIcon = '🔫';
        this.weaponName = 'Pistola';
        this.score = 0;
        this.kills = 0;
        this.isGameOver = false;
        this.playerName = playerName;
    },

    // ===== LOCAL STORAGE SCORES =====
    saveScore() {
        const scores = this.getScores();
        scores.push({
            name: this.playerName,
            score: this.score,
            level: this.currentLevel,
            kills: this.kills,
            date: new Date().toLocaleDateString('pt-BR')
        });
        scores.sort((a, b) => b.score - a.score);
        const top5 = scores.slice(0, 5);
        localStorage.setItem('monsterAttackScores', JSON.stringify(top5));
        return top5;
    },

    getScores() {
        try {
            return JSON.parse(localStorage.getItem('monsterAttackScores')) || [];
        } catch { return []; }
    }
};