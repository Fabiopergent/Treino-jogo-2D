/**
 * AssetLoader — carrega e cacheia todas as imagens do jogo.
 * Suporta remoção de fundo preto (para sprites sem canal alpha).
 */
export class AssetLoader {
    constructor() {
        this.cache   = {};   // imagens prontas
        this.pending = 0;    // quantas ainda carregando
        this.total   = 0;
    }

    /**
     * Carrega uma imagem simples (fundo transparente já no PNG).
     */
    load(key, path) {
        if (this.cache[key]) return this.cache[key];
        const img = new Image();
        img.src = path;
        this.total++;
        this.pending++;
        img.onload  = () => { this.pending--; };
        img.onerror = () => { this.pending--; console.warn(`Asset não encontrado: ${path}`); };
        this.cache[key] = img;
        return img;
    }

    /**
     * Carrega sprite com fundo preto e converte para transparente via canvas.
     * Use para imagens RGB sem canal alpha (como as geradas por IA).
     * threshold: quão "preto" considera fundo (0-255, padrão 30)
     */
    loadRemoveBg(key, path, threshold = 30) {
        if (this.cache[key]) return this.cache[key];

        this.total++;
        this.pending++;

        // Cria canvas offscreen para processar
        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';
        tempImg.src = path;

        // Retorna um canvas que age como imagem
        const canvas = document.createElement('canvas');
        this.cache[key] = canvas; // já coloca no cache (pode ser usado antes de pronto)

        tempImg.onload = () => {
            canvas.width  = tempImg.width;
            canvas.height = tempImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(tempImg, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data    = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                // Remove pixels escuros (fundo preto e variações)
                if (r < threshold && g < threshold && b < threshold) {
                    data[i+3] = 0; // alpha = 0 (transparente)
                }
            }

            ctx.putImageData(imgData, 0, 0);
            this.pending--;
        };

        tempImg.onerror = () => {
            console.warn(`Sprite não encontrado: ${path}`);
            this.pending--;
        };

        return canvas;
    }

    get(key) {
        return this.cache[key] || null;
    }

    isReady() {
        return this.pending === 0;
    }

    progress() {
        if (this.total === 0) return 1;
        return (this.total - this.pending) / this.total;
    }
}