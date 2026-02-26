export class Platform {
    constructor(x, y, width, height, permanent = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.permanent = permanent; // chão não some
        this.active = true;         // falso = desapareceu (colisão ignorada)
        this.markedForDeletion = false;

        if (!permanent) {
            // Timer aleatório entre 5s e 10s
            this.lifetime = (5 + Math.random() * 5) * 1000;
            this.timer = this.lifetime;
            this.warningTime = 2500; // começa a piscar nos últimos 2.5s
        } else {
            this.timer = Infinity;
            this.lifetime = Infinity;
        }

        this.alpha = 1;
        this.blinkRate = 0;
    }

    update(deltaTime = 16.6) {
        if (this.permanent || !this.active) return;

        this.timer -= deltaTime;

        const ratio = this.timer / this.lifetime;

        // Pisca nos últimos 2.5s
        if (this.timer <= this.warningTime) {
            this.blinkRate += deltaTime * 0.008;
            this.alpha = 0.4 + Math.abs(Math.sin(this.blinkRate)) * 0.6;
        }

        if (this.timer <= 0) {
            this.active = false;
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.permanent ? 1 : this.alpha;

        if (this.permanent) {
            // Chão: verde escuro sólido
            ctx.fillStyle = '#276749';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#38a169';
            ctx.fillRect(this.x, this.y, this.width, 4);
        } else {
            // Plataforma temporária
            const ratio = Math.max(0, this.timer / this.lifetime);
            // Cor muda: verde → amarelo → vermelho conforme envelhece
            const r = Math.floor(255 * (1 - ratio));
            const g = Math.floor(200 * ratio);
            ctx.fillStyle = `rgb(${r}, ${g}, 50)`;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Borda superior mais clara
            ctx.fillStyle = `rgba(255,255,255,0.3)`;
            ctx.fillRect(this.x, this.y, this.width, 3);

            // Barra de tempo restante
            if (this.timer <= this.warningTime) {
                const bw = this.width * (this.timer / this.warningTime);
                ctx.fillStyle = 'rgba(252, 129, 129, 0.8)';
                ctx.fillRect(this.x, this.y - 5, bw, 3);
            }
        }

        ctx.restore();
    }
}