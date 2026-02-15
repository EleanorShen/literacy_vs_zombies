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
        
        this.el = this.createVisual();
    }
    
    createVisual() {
        const el = document.createElement('div');
        el.className = 'entity plant';
        el.style.left = (this.col * this.game.gridSize) + 'px';
        el.style.top = (this.row * this.game.gridSize) + 'px';
        el.style.width = this.game.gridSize + 'px';
        el.style.height = this.game.gridSize + 'px';
        
        // 血条
        const bg = document.createElement('div');
        bg.className = 'hp-bar-bg';
        this.hpFill = document.createElement('div');
        this.hpFill.className = 'hp-bar-fill';
        bg.appendChild(this.hpFill);
        el.appendChild(bg);
        
        // 图片
        const img = document.createElement('img');
        img.src = 'peashooter.png';
        img.onerror = () => { img.style.display='none'; el.innerText = '🌱'; };
        el.appendChild(img);
        
        this.game.elLawn.appendChild(el);
        return el;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        this.hpFill.style.width = Math.max(0, (this.hp / this.maxHp) * 100) + '%';
        if(this.hp <= 0) {
            this.el.remove();
            return true; // died
        }
        return false;
    }
    
    update(timestamp) {
        // 攻击逻辑：检测本列上方是否有僵尸
        // 竖版：col相同，且 zombie.y < this.row * size
        const target = this.game.zombies.find(z => 
            z.col === this.col && 
            z.y < (this.row * this.game.gridSize) &&
            z.y > -50 // 屏幕内的
        );
        
        if (target && (timestamp - this.lastShot > this.config.attackSpeed)) {
            this.shoot();
            this.lastShot = timestamp;
        }
    }
    
    shoot() {
        // 子弹生成位置：植物中心
        const startX = this.col * this.game.gridSize + (this.game.gridSize/2) - 10;
        const startY = this.row * this.game.gridSize;
        
        this.game.spawnBullet(this.col, startX, startY, this.config);
    }
}
