export class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 22;
        this.height = 22;
        this.type = type;
        this.markedForDeletion = false;

        // Flutua levemente
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.05;
        this.baseY = y;
    }

    update(deltaTime = 16.6) {
        // Animação de flutuar
        this.floatOffset += this.floatSpeed;
        this.y = this.baseY + Math.sin(this.floatOffset) * 4;
    }

    draw(ctx) {
        const icons = {
            heal:        { icon: '❤️',  label: 'VIDA'    },
            ammo_pistol: { icon: '🔋',  label: 'PISTOLA' },
            ammo_rifle:  { icon: '📦',  label: 'FUZIL'   },
            armor:       { icon: '🛡️',  label: 'COLETE'  },
            weapon:      { icon: '🔫',  label: 'ARMA'    },
        };

        const item = icons[this.type] || { icon: '?', label: '' };

        // Brilho de fundo
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this._bgColor();
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Ícone
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon, this.x + this.width / 2, this.y + this.height - 2);

        // Label pequeno
        ctx.font = 'bold 7px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(item.label, this.x + this.width / 2, this.y + this.height + 9);
        ctx.restore();
    }

    _bgColor() {
        const colors = {
            heal:        '#e53e3e',
            ammo_pistol: '#38a169',
            ammo_rifle:  '#2b6cb0',
            armor:       '#4299e1',
            weapon:      '#d69e2e'
        };
        return colors[this.type] || '#888';
    }

    // Aplica o efeito no gameState quando coletado
    apply(gameState) {
        switch (this.type) {
            case 'heal':        gameState.gainHP(30); break;
            case 'ammo_pistol': gameState.gainAmmo('pistol', 10); break;
            case 'ammo_rifle':  gameState.gainAmmo('rifle',  15); break;
            case 'armor':       gameState.gainArmor(50); break;
            case 'weapon':      gameState.gainAmmo('rifle',  20); break;
        }
        this.markedForDeletion = true;
    }
}