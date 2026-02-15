export default class Bullet {
    constructor(col, x, y, config, game) {
        this.game = game;
        this.col = col; // 所在列
        this.x = x;
        this.y = y;
        this.config = config;
        this.speed = config.projectileSpeed;
        this.damage = config.damage;
        this.active = true;
        
        this.el = this.createVisual();
    }
    
    createVisual() {
        const el = document.createElement('div');
        el.className = 'bullet';
        el.style.left = this.x + 'px';
        el.style.top = this.y + 'px';
        this.game.elLawn.appendChild(el);
        return el;
    }
    
    update(timestamp) {
        this.y -= this.speed;
        this.el.style.top = this.y + 'px';
        
        // 移除出界的
        if (this.y < -20) {
            this.active = false;
            this.el.remove();
        }
    }
    
    hit() {
        this.active = false;
        this.el.remove();
    }
}
