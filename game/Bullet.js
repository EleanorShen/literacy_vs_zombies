export default class Bullet {
    constructor(col, x, y, config, game) {
        this.game = game;
        this.col = col;
        this.x = x;
        this.y = y;
        this.config = config;
        this.speed = config.bulletSpeed || 300;
        this.damage = config.damage;
        this.active = true;
        this.isFrozen = config.isFrozen || false;

        this.el = this._createVisual();
    }

    _createVisual() {
        const el = document.createElement('div');
        el.className = 'bullet' + (this.isFrozen ? ' bullet-frozen' : '');
        el.style.left = this.x + 'px';
        el.style.top = this.y + 'px';
        this.game.elLawn.appendChild(el);
        return el;
    }

    update(timestamp, dt) {
        this.y -= this.speed * dt;
        this.el.style.top = this.y + 'px';

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
