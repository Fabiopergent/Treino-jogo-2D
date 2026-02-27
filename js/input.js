import { gameState } from './gameState.js';

export class Input {
    constructor() {
        this.keys = {};

        // Teclado
        window.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
            if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();

            // Troca de arma pelo teclado: 1, 2, 3
            if (e.key === '1') this._selectWeapon('knife');
            if (e.key === '2') this._selectWeapon('pistol');
            if (e.key === '3') this._selectWeapon('rifle');
        });
        window.addEventListener("keyup", (e) => { this.keys[e.key] = false; });

        if (document.readyState === "loading") {
            window.addEventListener("DOMContentLoaded", () => this._setup());
        } else {
            this._setup();
        }
    }

    _setup() {
        this._setupJoystick();
        this._setupActionButtons();
        this._setupWeaponButtons();
    }

    // ===== JOYSTICK VIRTUAL =====
    _setupJoystick() {
        const zone  = document.getElementById('joystickZone');
        const base  = document.getElementById('joystickBase');
        const knob  = document.getElementById('joystickKnob');
        if (!zone || !knob) return;

        const radius = 36; // máximo de deslocamento do knob
        let active = false;
        let originX = 0, originY = 0;
        let touchId = null;

        const onStart = (cx, cy, id) => {
            active = true;
            touchId = id;
            const rect = base.getBoundingClientRect();
            originX = rect.left + rect.width / 2;
            originY = rect.top  + rect.height / 2;
            this._moveKnob(cx, cy, originX, originY, radius, knob);
        };

        const onMove = (cx, cy) => {
            if (!active) return;
            this._moveKnob(cx, cy, originX, originY, radius, knob);

            const dx = cx - originX;
            const dy = cy - originY;
            const threshold = 12;

            this.keys['ArrowLeft']  = dx < -threshold;
            this.keys['ArrowRight'] = dx >  threshold;
            // Pulo por swipe para cima (opcional, mantém botão dedicado)
            // this.keys['ArrowUp'] = dy < -threshold;
        };

        const onEnd = () => {
            active = false;
            touchId = null;
            knob.style.transform = 'translate(-50%, -50%)';
            this.keys['ArrowLeft']  = false;
            this.keys['ArrowRight'] = false;
        };

        // Touch
        zone.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.changedTouches[0];
            onStart(t.clientX, t.clientY, t.identifier);
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            for (let t of e.changedTouches) {
                if (t.identifier === touchId) { onMove(t.clientX, t.clientY); break; }
            }
        }, { passive: false });

        window.addEventListener('touchend', e => {
            for (let t of e.changedTouches) {
                if (t.identifier === touchId) { onEnd(); break; }
            }
        });

        // Mouse (para testar no desktop)
        zone.addEventListener('mousedown', e => { onStart(e.clientX, e.clientY, 'mouse'); });
        window.addEventListener('mousemove', e => { if (active) onMove(e.clientX, e.clientY); });
        window.addEventListener('mouseup',   () => { if (active) onEnd(); });
    }

    _moveKnob(cx, cy, ox, oy, radius, knob) {
        let dx = cx - ox;
        let dy = cy - oy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) {
            dx = (dx / dist) * radius;
            dy = (dy / dist) * radius;
        }
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    // ===== BOTÕES DE AÇÃO =====
    _setupActionButtons() {
        const map = [
            { id: "btnJump",  key: "ArrowUp" },
            { id: "btnShoot", key: " "        },
        ];

        map.forEach(({ id, key }) => {
            const el = document.getElementById(id);
            if (!el) return;

            const press   = () => { this.keys[key] = true;  el.classList.add('pressed'); };
            const release = () => { this.keys[key] = false; el.classList.remove('pressed'); };

            el.addEventListener('touchstart', e => { e.preventDefault(); press(); },   { passive: false });
            el.addEventListener('touchend',   e => { e.preventDefault(); release(); }, { passive: false });
            el.addEventListener('mousedown',  press);
            el.addEventListener('mouseup',    release);
            el.addEventListener('mouseleave', release);
        });
    }

    // ===== SELEÇÃO DE ARMAS =====
    _setupWeaponButtons() {
        const btns = document.querySelectorAll('.weapon-btn');
        btns.forEach(btn => {
            const press = (e) => {
                e.preventDefault();
                this._selectWeapon(btn.dataset.weapon);
            };
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('mousedown',  press);
        });
    }

    _selectWeapon(type) {
        // ✅ Só atualiza currentWeapon — nome/ícone vêm dos getters do gameState
        if (!gameState.weapons[type]) return;
        gameState.currentWeapon = type;

        // Atualiza visual dos botões
        document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('active'));
        const target = document.querySelector(`[data-weapon="${type}"]`);
        if (target) target.classList.add('active');
        }

}