export default class Plant {
    constructor(row, col, type, config, game) {
        this.game = game;
        this.row = row;
        this.col = col;
        this.type = type;
        this.config = config;
        this.id = Math.random().toString(36).substr(2, 9);

        this.hp = config.hp;
        this.maxHp = config.hp;
        this.lastShot = 0;

        // 食人花状态
        this.isChewing = false;
        this.chewEndTime = 0;

        // 樱桃炸弹状态
        this.fuseStartTime = 0;
        this.hasExploded = false;

        this.el = this._createVisual();
    }

    _createVisual() {
        const gs = this.game.gridSize;
        const el = document.createElement('div');
        el.className = 'entity plant plant-' + this.config.id;
        el.style.left = (this.col * gs) + 'px';
        el.style.top = (this.row * gs) + 'px';
        el.style.width = gs + 'px';
        el.style.height = gs + 'px';

        // 血条（樱桃炸弹不需要）
        if (this.type !== 'CHERRYBOMB') {
            const bg = document.createElement('div');
            bg.className = 'hp-bar-bg';
            this.hpFill = document.createElement('div');
            this.hpFill.className = 'hp-bar-fill';
            bg.appendChild(this.hpFill);
            el.appendChild(bg);
        }

        const span = document.createElement('span');
        span.className = 'plant-emoji';
        span.textContent = this.config.emoji || '🌱';
        el.appendChild(span);

        this.game.elLawn.appendChild(el);
        return el;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hpFill) {
            this.hpFill.style.width = Math.max(0, (this.hp / this.maxHp) * 100) + '%';
        }

        // 坚果墙分阶段外观
        if (this.type === 'WALLNUT') {
            const ratio = this.hp / this.maxHp;
            if (ratio <= 0.33) {
                this.el.style.opacity = '0.5';
                this.el.style.transform = 'scale(0.7)';
            } else if (ratio <= 0.66) {
                this.el.style.opacity = '0.75';
                this.el.style.transform = 'scale(0.85)';
            }
        }

        if (this.hp <= 0) {
            this.el.remove();
            return true;
        }
        return false;
    }

    update(timestamp, dt) {
        switch (this.type) {
            case 'PEASHOOTER':
            case 'REPEATER':
            case 'GATLINGPEA':
                this._updateShooter(timestamp);
                break;
            case 'CHOMPER':
                this._updateChomper(timestamp);
                break;
            case 'CHERRYBOMB':
                this._updateCherryBomb(timestamp);
                break;
            case 'WALLNUT':
                break;
        }
    }

    // ---- 射手类 ----
    _updateShooter(timestamp) {
        const target = this.game.zombies.find(z =>
            z.col === this.col &&
            z.hp > 0 &&
            z.y < (this.row * this.game.gridSize) &&
            z.y > -this.game.gridSize
        );

        if (target && (timestamp - this.lastShot > this.config.attackSpeed)) {
            this._shootBullets();
            this.lastShot = timestamp;
        }
    }

    _shootBullets() {
        const gs = this.game.gridSize;
        const baseX = this.col * gs + (gs / 2) - 7;
        const baseY = this.row * gs;
        const count = this.config.bulletCount || 1;

        for (let i = 0; i < count; i++) {
            const offsetX = (i - (count - 1) / 2) * 8;
            setTimeout(() => {
                if (this.hp > 0) {
                    this.game.spawnBullet(this.col, baseX + offsetX, baseY, this.config);
                }
            }, i * 80);
        }
    }

    // ---- 食人花 ----
    _updateChomper(timestamp) {
        if (this.isChewing) {
            if (timestamp >= this.chewEndTime) {
                this.isChewing = false;
                this.el.classList.remove('chomper-chewing');
                const emoji = this.el.querySelector('.plant-emoji');
                if (emoji) emoji.textContent = '👅';
            }
            return;
        }

        const gs = this.game.gridSize;
        const myY = this.row * gs;
        const target = this.game.zombies.find(z =>
            z.col === this.col &&
            z.hp > 0 &&
            z.y < myY &&
            z.y >= myY - gs * 1.2
        );

        if (target) {
            target.hp = 0;
            target.el.innerHTML = '<span style="font-size:40px">💥</span>';
            setTimeout(() => target.el.remove(), 200);

            this.isChewing = true;
            this.chewEndTime = timestamp + this.config.chewTime;
            this.el.classList.add('chomper-chewing');
            const emoji = this.el.querySelector('.plant-emoji');
            if (emoji) emoji.textContent = '🤢';
        }
    }

    // ---- 樱桃炸弹 ----
    _updateCherryBomb(timestamp) {
        if (this.hasExploded) return;

        if (this.fuseStartTime === 0) {
            this.fuseStartTime = timestamp;
            this.el.classList.add('cherrybomb-fuse');
        }

        if (timestamp - this.fuseStartTime < this.config.fuseTime) return;

        this.hasExploded = true;
        const gs = this.game.gridSize;
        const minCol = this.col - 1;
        const maxCol = this.col + 1;
        const minRow = this.row - 1;
        const maxRow = this.row + 1;

        for (const z of this.game.zombies) {
            if (z.hp <= 0) continue;
            const zRow = Math.floor(z.y / gs);
            if (z.col >= minCol && z.col <= maxCol && zRow >= minRow && zRow <= maxRow) {
                z.hp = 0;
                z.el.innerHTML = '<span style="font-size:40px">💥</span>';
                setTimeout(() => z.el.remove(), 200);
            }
        }

        this.el.classList.remove('cherrybomb-fuse');
        this.el.classList.add('cherrybomb-explode');
        const emoji = this.el.querySelector('.plant-emoji');
        if (emoji) emoji.textContent = '💥';

        setTimeout(() => {
            this.hp = 0;
            this.el.remove();
        }, 500);
    }
}
