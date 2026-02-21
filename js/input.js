export class Input {
    constructor() {
        this.keys = {};

        // ===== CONTROLES TOUCH =====
        this.setupTouchControls();

        

        window.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.key] = false;
        });
    }
    
      setupTouchControls() {
    const map = [
        { id: "btnLeft", key: "ArrowLeft" },
        { id: "btnRight", key: "ArrowRight" },
        { id: "btnJump", key: "ArrowUp" },
        { id: "btnShoot", key: "Space" }
    ];

    map.forEach(btn => {
        const el = document.getElementById(btn.id);
        if (!el) return;

        el.addEventListener("touchstart", e => {
            e.preventDefault();
            this.keys[btn.key] = true;
        });

        el.addEventListener("touchend", e => {
            e.preventDefault();
            this.keys[btn.key] = false;
        });
    });
}

}

