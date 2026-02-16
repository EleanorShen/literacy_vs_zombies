export default class Zombie {
    constructor(row, col, config, game) {
        this.game = game;
        this.col = col;
        this.y = row * game.gridSize;
        this.config = config;
        this.id = Math.random().toString(36).substr(2, 9);

        this.hp = config.hp;
        this.maxHp = config.hp;
        this.baseGridSpeed = config.gridSpeed;
        this.gridSpeed = config.gridSpeed;
        this.damagePerSec = config.damagePerSec;

        this.isEating = false;
        this.targetPlant = null;

        // 撑杆僵尸专用
        this.hasJumped = false;
        this.isJumping = false;
        this.jumpProgress = 0;
        this.jumpStartY = 0;
        this.jumpTargetY = 0;

        // 减速状态
        this.isSlowed = false;
        this.slowEndTime = 0;
        this.slowFactor = 1;

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

        const bg = document.createElement('div');
        bg.className = 'hp-bar-bg';
        this.hpFill = document.createElement('div');
        this.hpFill.className = 'hp-bar-fill hp-red';
        bg.appendChild(this.hpFill);
        el.appendChild(bg);

        const span = document.createElement('span');
        span.className = 'zombie-emoji';
        span.style.fontSize = (gs * 0.55) + 'px';
        span.textContent = this.config.emoji || '🧟';
        el.appendChild(span);

        this.game.elLawn.appendChild(el);
        return el;
    }

    applySlow(factor, duration) {
        this.isSlowed = true;
        this.slowFactor = factor;
        this.slowEndTime = performance.now() + duration;
        this.el.classList.add('zombie-slowed');
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
        const gs = this.game.gridSize;

        // 检查减速是否过期
        if (this.isSlowed && timestamp >= this.slowEndTime) {
            this.isSlowed = false;
            this.slowFactor = 1;
            this.el.classList.remove('zombie-slowed');
        }

        // 当前实际速度倍率
        const speedMult = this.isSlowed ? this.slowFactor : 1;

        // ---- 跳跃动画中 ----
        if (this.isJumping) {
            this.jumpProgress += dt / 0.4;
            if (this.jumpProgress >= 1) {
                this.jumpProgress = 1;
                this.isJumping = false;
                this.y = this.jumpTargetY;
                if (this.config.gridSpeedAfterJump) {
                    this.baseGridSpeed = this.config.gridSpeedAfterJump;
                    this.gridSpeed = this.config.gridSpeedAfterJump;
                }
                this.el.classList.remove('zombie-jumping');
            } else {
                const t = this.jumpProgress;
                const linearY = this.jumpStartY + (this.jumpTargetY - this.jumpStartY) * t;
                const arc = -gs * 0.8 * Math.sin(t * Math.PI);
                this.y = linearY + arc;
            }
            this.el.style.top = this.y + 'px';
            return;
        }

        // ---- 啃食中 ----
        if (this.isEating) {
            if (this.targetPlant && this.targetPlant.hp > 0) {
                const dmg = this.damagePerSec * dt * speedMult;
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
        const pxPerSec = (gs / this.gridSpeed) * speedMult;
        this.y += pxPerSec * dt;
        this.el.style.top = this.y + 'px';

        // ---- 碰撞植物 ----
        const plantsInCol = this.game.plants.filter(p => p.col === this.col && p.hp > 0);
        for (const p of plantsInCol) {
            const pY = p.row * gs;
            if (this.y + gs * 0.6 > pY && this.y < pY + gs * 0.3) {
                // 土豆地雷：已武装则引爆
                if (p.type === 'POTATOMINE' && p.isArmed) {
                    p.explode(this);
                    return;
                }
                // 撑杆僵尸：第一次碰到植物时跳过
                if (this.config.id === 'polevault' && !this.hasJumped) {
                    this.hasJumped = true;
                    this.isJumping = true;
                    this.jumpProgress = 0;
                    this.jumpStartY = this.y;
                    this.jumpTargetY = pY + gs * 1.1;
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
