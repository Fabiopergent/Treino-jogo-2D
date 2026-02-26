export class Platform {
    constructor(x, y, width, height, permanent = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.permanent = permanent;
        this.active = true;
        this.markedForDeletion = false;

        if (!permanent) {
            this.lifetime = (5 + Math.random() * 5) * 1000; // 5s–10s
            this.timer = this.lifetime;
            this.warningTime = 2500;
            this.touched = false; // ✅ timer só começa ao ser pisada
        } else {
            this.timer = Infinity;
            this.lifetime = Infinity;
            this.touched = true;
        }

        this.alpha = 1;
        this.blinkRate = 0;

        // ✅ Respawn: posição aleatória nova após sumir
        this.respawnDelay = 3000; // 3s para reaparecer
        this.respawnTimer = 0;
        this.waiting = false; // está aguardando para reaparecer
    }

    // Chamado pelo game quando o player pousa nela
    onPlayerLand() {
        if (!this.permanent && !this.touched) {
            this.touched = true; // ✅ inicia o timer
        }
    }

    update(deltaTime = 16.6) {
        if (this.permanent) return;

        // ===== AGUARDANDO REAPARECER =====
        if (this.waiting) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                this._respawn();
            }
            return;
        }

        if (!this.active) return;
        if (!this.touched) return; // timer parado até ser pisada

        this.timer -= deltaTime;

        // Pisca nos últimos 2.5s
        if (this.timer <= this.warningTime) {
            this.blinkRate += deltaTime * 0.008;
            this.alpha = 0.4 + Math.abs(Math.sin(this.blinkRate)) * 0.6;
        }

        if (this.timer <= 0) {
            this.active = false;   // some da tela
            this.waiting = true;   // ✅ entra em modo de respawn
            this.respawnTimer = this.respawnDelay;
        }
    }

    _respawn() {
        // ✅ Reposiciona em lugar novo e aleatório
        const newX = this.x + (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 200);
        const newY = 150 + Math.random() * 170;

        this.x = Math.max(50, newX);
        this.y = newY;

        // Reseta estado
        this.lifetime = (5 + Math.random() * 5) * 1000;
        this.timer = this.lifetime;
        this.touched = false;
        this.active = true;
        this.waiting = false;
        this.alpha = 1;
        this.blinkRate = 0;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.permanent ? 1 : this.alpha;

            if (this.permanent) {
            ctx.fillStyle = '#276749';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#38a169';
            ctx.fillRect(this.x, this.y, this.width, 4);
        } else {
            // Cor base: azul se não tocada, verde→vermelho se contando
            let color;
            if (!this.touched) {
                color = '#2b6cb0'; // azul = segura, timer não iniciado
            } else {
                const ratio = Math.max(0, this.timer / this.lifetime);
                const r = Math.floor(255 * (1 - ratio));
                const g = Math.floor(200 * ratio);
                color = `rgb(${r}, ${g}, 50)`;
            }

            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Borda superior
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(this.x, this.y, this.width, 3);

            // Barra de tempo restante (só quando tocada e nos últimos 2.5s)
            if (this.touched && this.timer <= this.warningTime) {
                const bw = this.width * (this.timer / this.warningTime);
                ctx.fillStyle = 'rgba(252, 129, 129, 0.9)';
                ctx.fillRect(this.x, this.y - 5, bw, 3);
            }

            // Ícone de "segura" quando não tocada
            if (!this.touched) {
                ctx.globalAlpha = 0.6;
                ctx.font = '10px Arial';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText('▲', this.x + this.width / 2, this.y - 3);
                ctx.textAlign = 'left';
            }
        }

        ctx.restore();
    }
}
