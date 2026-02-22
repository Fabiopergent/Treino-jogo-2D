export class Input {
    constructor() {
        this.keys = {};

        // teclado
        window.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.key] = false;
        });

        // espera DOM completo (IMPORTANTE mobile)
       // window.addEventListener("load", () => {
            this.setupTouchControls();
       // });
    }

    setupTouchControls() {
        const map = [
            { id: "btnLeft", key: "ArrowLeft" },
            { id: "btnRight", key: "ArrowRight" },
            { id: "btnJump", key: "ArrowUp" },
            { id: "btnShoot", key: " " } // 🔥 espaço correto
        ];

        map.forEach(btn => {
            const el = document.getElementById(btn.id);
            if (!el) return;

            // TOUCH
            el.addEventListener("touchstart", e => {
                e.preventDefault();
                this.keys[btn.key] = true;
            });

            el.addEventListener("touchend", e => {
                e.preventDefault();
                this.keys[btn.key] = false;
            });

            // mouse
            el.addEventListener("mousedown", () => {
                this.keys[btn.key] = true;
            });

            el.addEventListener("mouseup", () => {
                this.keys[btn.key] = false;
            });

            el.addEventListener("mouseleave", () => {
                this.keys[btn.key] = false;
            });
        });
    }
}