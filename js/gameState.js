export const gameState = {
    // ===== VIDA =====
    lives: 3,
    maxLives: 3,
    hp: 100,
    armor: 0,

    // ===== LEVEL =====
    currentLevel: 1,
    levelProgress: 0,
    killsToNextBoss: 15,   // ✅ kills por level antes do boss
    killsThisLevel: 0,     // ✅ contador de kills no level atual
    bossDefeated: false,   // ✅ boss do level foi derrotado?

    // ===== ARMAS (munição separada por arma) ===== ✅
    currentWeapon: 'pistol',
    weapons: {
        knife:  { name: 'Faca',   icon: '🔪', ammo: Infinity, maxAmmo: Infinity },
        pistol: { name: 'Pistola',icon: '🔫', ammo: 30,       maxAmmo: 30       },
        rifle:  { name: 'Fuzil',  icon: '🪖', ammo: 0,        maxAmmo: 40       },
    },

    // Atalhos para o HUD (refletem a arma atual)
    get weaponIcon()  { return this.weapons[this.currentWeapon].icon; },
    get weaponName()  { return this.weapons[this.currentWeapon].name; },
    get ammo()        { const a = this.weapons[this.currentWeapon].ammo; return a === Infinity ? '∞' : a; },
    get maxAmmo()     { const a = this.weapons[this.currentWeapon].maxAmmo; return a === Infinity ? '∞' : a; },

    // ===== SCORE =====
    score: 0,
    kills: 0,
    playerName: 'Player',

        // ===== FLAGS =====
        isGameOver: false,

        // ===== VIDA =====
        takeDamage(amount = 34) {
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
                this.hp = 100;
            }
        }
    },

    gainLife()            { if (this.lives < this.maxLives) this.lives++; },
    gainHP(amount = 30)   { this.hp = Math.min(100, this.hp + amount); },
    gainArmor(amount = 50){ this.armor = Math.min(100, this.armor + amount); },

    // ===== MUNIÇÃO POR ARMA ===== ✅
    shoot() {
        const w = this.weapons[this.currentWeapon];
        if (w.ammo === Infinity) return true;
        if (w.ammo <= 0) {
            this._autoSwitchWeapon();
            return false;
        }
        w.ammo--;
        // Troca automática ao zerar ✅
        if (w.ammo <= 0) this._autoSwitchWeapon();
        return true;
    },

    _autoSwitchWeapon() {
        // Tenta pistola → fuzil → faca
        const order = ['pistol', 'rifle', 'knife'];
        for (const w of order) {
            if (w === this.currentWeapon) continue;
            const weapon = this.weapons[w];
            if (weapon.ammo === Infinity || weapon.ammo > 0) {
                this.currentWeapon = w;
                // Atualiza botão visual
                if (typeof document !== 'undefined') {
                    document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('active'));
                    const btn = document.querySelector(`[data-weapon="${w}"]`);
                    if (btn) btn.classList.add('active');
                }
                return;
            }
        }
        // Sem munição em nada → faca
        this.currentWeapon = 'knife';
    },

    gainAmmo(weapon, amount = 10) {
        // Se chamado sem especificar arma, distribui para a atual ou pistola
        const target = weapon || (this.currentWeapon !== 'knife' ? this.currentWeapon : 'pistol');
        const w = this.weapons[target];
        if (w && w.ammo !== Infinity) {
            w.ammo = Math.min(w.maxAmmo, w.ammo + amount);
        }
    },

    // ===== KILLS & LEVEL ===== ✅
    addKill(points = 10) {
        this.kills++;
        this.killsThisLevel++;
        this.score += points * this.currentLevel;
        this.levelProgress = Math.min(99, (this.killsThisLevel / this.killsToNextBoss) * 100);
    },

    // Chamado quando boss do level é derrotado
    bossKilled() {
        this.bossDefeated = true;
        this.levelProgress = 100;
    },

    // Avança para o próximo level
    nextLevel() {
        this.currentLevel++;
        this.killsThisLevel = 0;
        this.bossDefeated = false;
        this.levelProgress = 0;
        this.hp = 100;
        this.armor = 0;

        // A cada 5 levels ganha +1 vida máxima (cap 10)
        if (this.currentLevel % 5 === 0 && this.maxLives < 10) {
            this.maxLives++;
            this.lives = Math.min(this.lives + 1, this.maxLives);
        }

        // Aumenta kills necessários levemente
        this.killsToNextBoss = 15 + (this.currentLevel - 1) * 3;
    },

    // ===== RESET =====
    reset(playerName = 'Player') {
        this.lives       = 3;
        this.maxLives    = 3;
        this.hp          = 100;
        this.armor       = 0;
        this.currentLevel     = 1;
        this.levelProgress    = 0;
        this.killsThisLevel   = 0;
        this.killsToNextBoss  = 15;
        this.bossDefeated     = false;
        this.currentWeapon    = 'pistol';
        this.weapons = {
            knife:  { name: 'Faca',   icon: '🔪', ammo: Infinity, maxAmmo: Infinity },
            pistol: { name: 'Pistola',icon: '🔫', ammo: 30,       maxAmmo: 30       },
            rifle:  { name: 'Fuzil',  icon: '🪖', ammo: 0,        maxAmmo: 40       },
        };
        this.score       = 0;
        this.kills       = 0;
        this.isGameOver  = false;
        this.playerName  = playerName;
    },

    // ===== SCORES =====
    saveScore() {
        const scores = this.getScores();
        scores.push({ name: this.playerName, score: this.score, level: this.currentLevel, kills: this.kills, date: new Date().toLocaleDateString('pt-BR') });
        scores.sort((a, b) => b.score - a.score);
        const top5 = scores.slice(0, 5);
        localStorage.setItem('monsterAttackScores', JSON.stringify(top5));
        return top5;
    },

    getScores() {
        try { return JSON.parse(localStorage.getItem('monsterAttackScores')) || []; }
        catch { return []; }
    }
};