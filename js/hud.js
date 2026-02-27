import { gameState } from './gameState.js';

export class HUD {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    draw() {
        const ctx = this.ctx;
        const W = this.canvas.width;

        // ===== FUNDO SEMITRANSPARENTE DO HUD =====
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, 56);
        ctx.restore();

        // ===========================
        // LADO ESQUERDO — VIDA
        // ===========================
        const barW = 180;
        const barH = 14;
        const barY = 10;
        const leftX = 12;

        // --- Vidas (corações) ---
        ctx.save();
        ctx.font = '14px Arial';
        let heartsText = '';
        for (let i = 0; i < gameState.maxLives; i++) {
            heartsText += i < gameState.lives ? '❤️' : '🖤';
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(`VIDAS`, leftX, barY + 10);
        ctx.font = '13px Arial';
        ctx.fillText(heartsText, leftX + 44, barY + 11);
        ctx.restore();

        // --- Barra de HP ---
        const hpY = barY + 18;
        this._drawBar(leftX, hpY, barW, barH, gameState.hp / 100, '#e53e3e', '#1a0000', 'HP');

        // --- Barra de Colete (se houver) ---
        if (gameState.armor > 0) {
            this._drawBar(leftX, hpY + barH + 4, barW, 6, gameState.armor / 100, '#4299e1', '#001a33', '');
        }

        // --- Ícone da arma + munição ---
        const weaponY = hpY + barH + (gameState.armor > 0 ? 16 : 6);
        const w = gameState.weapons[gameState.currentWeapon];
        const ammoDisplay = w.ammo === Infinity ? '∞' : w.ammo;
        const maxDisplay  = w.maxAmmo === Infinity ? '∞' : w.maxAmmo;
        const ammoLow     = w.ammo !== Infinity && w.ammo <= 5;

        ctx.save();
        ctx.font = '18px Arial';
        ctx.fillText(w.icon, leftX, weaponY + 14);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = ammoLow ? '#fc8181' : '#e2e8f0';
        ctx.fillText(`${ammoDisplay}/${maxDisplay}`, leftX + 24, weaponY + 14);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#718096';
        ctx.fillText(w.name, leftX + 24, weaponY + 25);
        ctx.restore();

        // ===========================
        // LADO DIREITO — LEVEL
        // ===========================
        const rightX = W - barW - 12;

        // --- Número do Level ---
        ctx.save();
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.fillText(`LEVEL`, W - 12, barY + 10);
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#f6c90e';
        ctx.fillText(`${gameState.currentLevel}`, W - 12, barY + 26);
        ctx.textAlign = 'left';
        ctx.restore();

        // --- Barra de progresso do Level ---
        this._drawBar(rightX - 30, hpY, barW, barH, gameState.levelProgress / 100, '#6c63ff', '#0a001a', 'XP');

        // --- Contador de kills ---
        const killY = hpY + barH + (gameState.armor > 0 ? 16 : 6);
        ctx.save();
        ctx.font = '18px Arial';
        ctx.fillText('💀', rightX - 30, killY + 14);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(`${gameState.kills} monstros`, rightX - 30 + 24, killY + 14);
        ctx.restore();

        // ===========================
        // CENTRO — SCORE
        // ===========================
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#f6c90e';
        ctx.fillText(`SCORE: ${gameState.score}`, W / 2, 20);
        ctx.restore();
    }

    _drawBar(x, y, w, h, pct, colorFill, colorBg, label) {
        const ctx = this.ctx;
        const radius = 4;

        // Fundo
        ctx.save();
        ctx.fillStyle = colorBg;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();

        // Preenchimento
        const fillW = Math.max(0, Math.min(w, w * pct));
        if (fillW > 0) {
            ctx.fillStyle = colorFill;
            ctx.beginPath();
            ctx.roundRect(x, y, fillW, h, radius);
            ctx.fill();
        }

        // Borda
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.stroke();

        // Label
        if (label) {
            ctx.font = 'bold 9px Arial';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + h - 2);
            ctx.textAlign = 'left';
        }

        ctx.restore();
    }
}