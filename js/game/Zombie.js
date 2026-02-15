export default class Zombie {
    constructor(row, col, config, game) {
        this.game = game;
        // 注意：竖版游戏中，col 是固定的（哪一列），row 是变化的（往下走）
        // 这里参数 row 实际上是初始生成的位置（比如 -1），col 是跑道
        this.col = col; 
        this.y = row * game.gridSize; // 像素坐标
        this.config = config;
        this.id = Math.random().toString(36).substr(2, 9);
        
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.speed = config.speed;
        this.damage = config.damage;
        
        this.isEating = false;
        this.targetPlant = null;
        
        this.el = this.createVisual();
    }
    
    createVisual() {
        const el = document.createElement('div');
        el.className = 'entity zombie';
        el.style.left = (this.col * this.game.gridSize) + 'px';
        el.style.top = this.y + 'px';
        
        // 血条
        const bg = document.createElement('div');
        bg.className = 'hp-bar-bg';
        this.hpFill = document.createElement('div');
        this.hpFill.className = 'hp-bar-fill hp-red';
        bg.appendChild(this.hpFill);
        el.appendChild(bg);
        
        // 图片
        const img = document.createElement('img');
        img.src = 'zombie.png';
        img.onerror = () => { img.style.display='none'; el.innerText = '🧟'; };
        el.appendChild(img);
        
        this.game.elLawn.appendChild(el);
        return el;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        this.hpFill.style.width = Math.max(0, (this.hp / this.maxHp) * 100) + '%';
        if (this.hp <= 0) {
            this.el.innerHTML = '<span style="font-size:40px">💥</span>';
            setTimeout(() => this.el.remove(), 200);
            return true; // died
        }
        return false;
    }
    
    update(timestamp) {
        if (this.isEating) {
            if (this.targetPlant && this.targetPlant.hp > 0) {
                const killed = this.targetPlant.takeDamage(this.damage);
                if (killed) {
                    this.isEating = false;
                    this.targetPlant = null;
                }
            } else {
                this.isEating = false;
                this.targetPlant = null;
            }
        } else {
            // 移动
            this.y += this.speed;
            this.el.style.top = this.y + 'px';
            
            // 检测碰撞植物
            // 简单的距离检测：同列，且 y 坐标接触
            const plantsInCol = this.game.plants.filter(p => p.col === this.col);
            for (const p of plantsInCol) {
                const pY = p.row * this.game.gridSize;
                // 僵尸头部(y+60) 碰到 植物顶部(pY)
                if (this.y + 40 > pY && this.y < pY + 20) {
                    this.isEating = true;
                    this.targetPlant = p;
                    break;
                }
            }
            
            // 游戏结束判定
            if (this.y > this.game.height - 50) {
                this.game.triggerGameOver('zombie');
            }
        }
    }
}
