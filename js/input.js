export class Input {
    constructor() {
        this.keys = {};

        // Teclado
        window.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
            // ✅ Previne scroll da página com as setas e espaço
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.key] = false;
        });

        // ✅ Espera o DOM estar pronto antes de buscar os botões mobile
        if (document.readyState === "loading") {
            window.addEventListener("DOMContentLoaded", () => this.setupTouchControls());
        } else {
            // DOM já está pronto (caso Input seja instanciado após window.onload)
            this.setupTouchControls();
        }
    }

    setupTouchControls() {
        const map = [
            { id: "btnLeft",  key: "ArrowLeft"  },
            { id: "btnRight", key: "ArrowRight" },
            { id: "btnJump",  key: "ArrowUp"    },
            { id: "btnShoot", key: " "           }
        ];

        map.forEach(btn => {
            const el = document.getElementById(btn.id);
            if (!el) return;

            // Touch
            el.addEventListener("touchstart", e => { e.preventDefault(); this.keys[btn.key] = true;  }, { passive: false });
            el.addEventListener("touchend",   e => { e.preventDefault(); this.keys[btn.key] = false; }, { passive: false });

            // Mouse (para testar no desktop)
            el.addEventListener("mousedown",  () => { this.keys[btn.key] = true;  });
            el.addEventListener("mouseup",    () => { this.keys[btn.key] = false; });
            el.addEventListener("mouseleave", () => { this.keys[btn.key] = false; });
        });
    }
}