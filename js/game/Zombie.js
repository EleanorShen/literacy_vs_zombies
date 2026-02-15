export default class Zombie {
    constructor(row, col, config, game) {
        this.game = game;
        this.col = col;
        this.y = row * game.gridSize;   // 像素坐标（从 -gridSize 开始）
        this.config = config;
        this.id = Math.random().toString(36).substr(2, 9);

        this.hp = config.hp;
        this.maxHp = config.hp;
        this.gridSpeed = config.gridSpeed;       // 秒/格
        this.damagePerSec = config.damagePerSec;

        this.isEating = false;
        this.targetPlant = null;

        // 撑杆僵尸专用
        this.hasJumped = false;
        this.isJumping = false;
        this.jumpProgress = 0;
        this.jumpStartY = 0;
        this.jumpTargetY = 0;

        this.el = this._createVisual();
    }

    _createVisual() {
        const gs = this.game.gridSize;
        const el = document.createElement('div');
        el.className = 'entity zombie zombie-' + this.config.id;
        el.style.left = (this.col * gs) + 'px';
        el.style.top = this.y + 'px';
        el.style.width = gs + 'px';
        el.style.height = gs + 'px';

        // 血条
        const bg = document.createElement('div');
        bg.className = 'hp-bar-bg';
        this.hpFill = document.createElement('div');
        this.hpFill.className = 'hp-bar-fill hp-red';
        bg.appendChild(this.hpFill);
        el.appendChild(bg);

        // emoji（按类型区分）
        const span = document.createElement('span');
        span.className = 'zombie-emoji';
        span.style.fontSize = (gs * 0.55) + 'px';
        span.textContent = this.config.emoji || '🧟';
        el.appendChild(span);

        this.game.elLawn.appendChild(el);
        return el;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hpFill.style.width = Math.max(0, (this.hp / this.maxHp) * 100) + '%';
        if (this.hp <= 0) {
            this.el.innerHTML = '<span style="font-size:40px">💥</span>';
            setTimeout(() => this.el.remove(), 200);
            return true;
        }
        return false;
    }

    update(timestamp, dt) {
        // dt = deltaTime in seconds
        const gs = this.game.gridSize;

        // ---- 跳跃动画中 ----
        if (this.isJumping) {
            this.jumpProgress += dt / 0.4; // 0.4秒完成跳跃
            if (this.jumpProgress >= 1) {
                this.jumpProgress = 1;
                this.isJumping = false;
                this.y = this.jumpTargetY;
                // 跳跃后变慢
                if (this.config.gridSpeedAfterJump) {
                    this.gridSpeed = this.config.gridSpeedAfterJump;
                }
                this.el.classList.remove('zombie-jumping');
            } else {
                // 抛物线插值
                const t = this.jumpProgress;
                const linearY = this.jumpStartY + (this.jumpTargetY - this.jumpStartY) * t;
                const arc = -gs * 0.8 * Math.sin(t * Math.PI); // 向上弧线
                this.y = linearY + arc;
            }
            this.el.style.top = this.y + 'px';
            return;
        }

        // ---- 啃食中 ----
        if (this.isEating) {
            if (this.targetPlant && this.targetPlant.hp > 0) {
                const dmg = this.damagePerSec * dt;
                const killed = this.targetPlant.takeDamage(dmg);
                if (killed) {
                    this.isEating = false;
                    this.targetPlant = null;
                }
            } else {
                this.isEating = false;
                this.targetPlant = null;
            }
            return;
        }

        // ---- 移动 ----
        const pxPerSec = gs / this.gridSpeed;
        this.y += pxPerSec * dt;
        this.el.style.top = this.y + 'px';

        // ---- 碰撞植物 ----
        const plantsInCol = this.game.plants.filter(p => p.col === this.col && p.hp > 0);
        for (const p of plantsInCol) {
            const pY = p.row * gs;
            // 僵尸下沿接触植物上沿
            if (this.y + gs * 0.6 > pY && this.y < pY + gs * 0.3) {
                // 撑杆僵尸：第一次碰到植物时跳过
                if (this.config.id === 'polevault' && !this.hasJumped) {
                    this.hasJumped = true;
                    this.isJumping = true;
                    this.jumpProgress = 0;
                    this.jumpStartY = this.y;
                    this.jumpTargetY = pY + gs * 1.1; // 落在植物下方
                    this.el.classList.add('zombie-jumping');
                    return;
                }
                this.isEating = true;
                this.targetPlant = p;
                return;
            }
        }

        // ---- 到达底部 → 游戏失败 ----
        if (this.y > this.game.height - gs * 0.5) {
            this.game.triggerGameOver('zombie');
        }
    }
}
