/**
 * AnimatedSprite — lê sprite sheets no formato grade (colunas x linhas).
 *
 * Formato dos seus arquivos:
 *   faca_idle_1.png   → 288x256, grade 4x2, frame 72x128
 *   faca_walk_1.png   → (quando pronto)
 *   faca_attack_1.png → (quando pronto)
 *   faca_death_1.png  → (quando pronto)
 *
 * Cada animação pode ser um arquivo separado OU uma linha numa sheet única.
 * O sistema suporta os dois modos.
 */
export class AnimatedSprite {
    constructor(frameW, frameH) {
        this.frameW = frameW; // 72
        this.frameH = frameH; // 128

        // Animações registradas: { nome: { image, cols, rows, speed, loop } }
        this.anims = {};

        this.current     = null;  // nome da animação atual
        this.frame       = 0;     // frame atual (índice linear)
        this.timer       = 0;     // ms acumulados
        this.done        = false; // animação não-loop terminou?
        this.flipped     = false; // espelhar horizontalmente?
    }

    /**
     * Registra uma animação a partir de uma imagem (canvas ou Image).
     * @param name     nome da animação ('idle', 'walk', etc)
     * @param image    canvas ou Image carregada pelo AssetLoader
     * @param cols     quantas colunas na grade (ex: 4)
     * @param rows     quantas linhas na grade (ex: 2) — usa todas
     * @param speed    ms por frame (ex: 120)
     * @param loop     true = repete, false = para no último frame
     */
    addAnim(name, image, cols, rows, speed = 120, loop = true) {
        this.anims[name] = {
            image,
            cols,
            rows,
            totalFrames: cols * rows,
            speed,
            loop,
        };
        // Define idle como padrão automaticamente
        if (!this.current) this.current = name;
    }

    play(name) {
        if (!this.anims[name]) return;
        if (this.current === name && !this.done) return; // já tocando
        this.current = name;
        this.frame   = 0;
        this.timer   = 0;
        this.done    = false;
    }

    update(deltaTime) {
        const anim = this.anims[this.current];
        if (!anim || this.done) return;

        this.timer += deltaTime;
        if (this.timer >= anim.speed) {
            this.timer = 0;
            this.frame++;
            if (this.frame >= anim.totalFrames) {
                if (anim.loop) {
                    this.frame = 0;
                } else {
                    this.frame = anim.totalFrames - 1; // trava no último
                    this.done  = true;
                }
            }
        }
    }

    draw(ctx, x, y, drawW, drawH) {
        const anim = this.anims[this.current];
        if (!anim || !anim.image) return false;

        // ✅ Verifica se o canvas/imagem já tem conteúdo carregado
        const img = anim.image;
        const isCanvas = img instanceof HTMLCanvasElement;
        const isImage  = img instanceof HTMLImageElement;

        if (isImage && !img.complete) return false;
        if (isCanvas && img.width === 0) return false;

        // Posição do frame na grade
        const col  = this.frame % anim.cols;
        const row  = Math.floor(this.frame / anim.cols);
        const srcX = col * this.frameW;
        const srcY = row * this.frameH;

        ctx.save();

            if (this.flipped) {
                ctx.translate(x + drawW, y);
                ctx.scale(-1, 1);
                ctx.drawImage(img, srcX, srcY, this.frameW, this.frameH, 0, 0, drawW, drawH);
            } else {
                ctx.drawImage(img, srcX, srcY, this.frameW, this.frameH, x, y, drawW, drawH);
            }

        ctx.restore();
        return true;
    }

    /**
     * Retorna true se a animação atual (não-loop) terminou.
     * Útil para saber quando a animação de morte acabou.
     */
    isFinished() {
        return this.done;
    }
}