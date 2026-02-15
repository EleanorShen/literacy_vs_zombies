import config from '../config.js';
import words from '../data/words.js';
import Zombie from './Zombie.js';
import Plant from './Plant.js';
import Bullet from './Bullet.js';
import QuizManager from '../quiz/QuizManager.js';

export default class Game {
    constructor(uiManager) {
        this.ui = uiManager;
        this.elLawn = document.getElementById('lawn');
        this.config = config;

        // 游戏状态
        this.score = 0;
        this.time = 0;
        this.isRunning = false;
        this.isGameOver = false;
        this.isPaused = false;

        // 网格
        this.gridSize = 0;
        this.rows = config.GRID_ROWS;
        this.cols = config.GRID_COLS;
        this.width = 0;
        this.height = 0;

        // 实体
        this.plants = [];
        this.zombies = [];
        this.bullets = [];

        // 波次
        this.currentWaveIndex = 0;
        this.spawnTimerId = null;

        // 选中的植物卡片
        this.selectedPlant = null;

        // 冷却状态 { PEASHOOTER: { ready: true, timer: null }, ... }
        this.cooldowns = {};
        for (const key of Object.keys(config.PLANTS)) {
            this.cooldowns[key] = { ready: true, timer: null };
        }

        // 词库
        this.config.words = words.Hsk1Words;

        // 答题管理器
        this.quiz = new QuizManager(this);

        this._bindEvents();

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    _bindEvents() {
        // 点击草坪放置植物
        this.elLawn.addEventListener('click', (e) => {
            if (!this.isRunning || this.isGameOver || this.isPaused) return;
            if (!this.selectedPlant) return;

            const rect = this.elLawn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.floor(x / this.gridSize);
            const row = Math.floor(y / this.gridSize);

            if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

            // 检查是否已有植物（樱桃炸弹可以放在有植物的格子上）
            const occupied = this.plants.some(p => p.row === row && p.col === col);
            if (occupied && this.selectedPlant !== 'CHERRYBOMB') return;

            const plantConfig = config.PLANTS[this.selectedPlant];
            if (!plantConfig) return;

            // 检查积分
            if (this.score < plantConfig.cost) return;

            // 检查冷却
            if (!this.cooldowns[this.selectedPlant].ready) return;

            // 扣分并放置
            this.addScore(-plantConfig.cost);
            const plant = new Plant(row, col, this.selectedPlant, plantConfig, this);
            this.plants.push(plant);

            // 触发冷却
            this._startCooldown(this.selectedPlant);

            // 放置后取消选中
            this._deselectAll();
        });

        // 卡片选择（为所有卡片绑定）
        for (const key of Object.keys(config.PLANTS)) {
            const cardId = 'card-' + config.PLANTS[key].id;
            const card = document.getElementById(cardId);
            if (!card) continue;
            card.addEventListener('click', () => {
                if (!this.isRunning || this.isPaused) return;
                // 检查冷却和积分
                if (!this.cooldowns[key].ready) return;
                if (this.score < config.PLANTS[key].cost) return;

                if (this.selectedPlant === key) {
                    this._deselectAll();
                } else {
                    this._deselectAll();
                    this.selectedPlant = key;
                    card.classList.add('selected');
                }
            });
        }

        // 结束按钮
        const endBtn = document.getElementById('btn-end-game');
        if (endBtn) {
            endBtn.addEventListener('click', () => {
                if (this.isRunning) this.triggerGameOver('manual');
            });
        }

        // 暂停按钮
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.isRunning && !this.isGameOver) this.pause();
            });
        }

        // 恢复按钮
        const resumeBtn = document.getElementById('btn-resume');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                if (this.isPaused) this.resume();
            });
        }
    }

    _deselectAll() {
        this.selectedPlant = null;
        document.querySelectorAll('.card-slot.selected').forEach(c => c.classList.remove('selected'));
    }

    // ---- 冷却系统 ----
    _startCooldown(plantKey) {
        const cd = this.cooldowns[plantKey];
        const plantCfg = config.PLANTS[plantKey];
        const card = document.getElementById('card-' + plantCfg.id);

        cd.ready = false;
        if (card) {
            card.classList.add('on-cooldown');
            // 冷却进度条
            const fill = card.querySelector('.cd-fill');
            if (fill) {
                fill.style.transition = 'none';
                fill.style.height = '100%';
                // 强制重排后启动动画
                void fill.offsetHeight;
                fill.style.transition = `height ${plantCfg.cooldown}ms linear`;
                fill.style.height = '0%';
            }
        }

        cd.timer = setTimeout(() => {
            cd.ready = true;
            if (card) card.classList.remove('on-cooldown');
        }, plantCfg.cooldown);
    }

    _resetAllCooldowns() {
        for (const key of Object.keys(this.cooldowns)) {
            clearTimeout(this.cooldowns[key].timer);
            this.cooldowns[key].ready = true;
            const card = document.getElementById('card-' + config.PLANTS[key].id);
            if (card) {
                card.classList.remove('on-cooldown');
                const fill = card.querySelector('.cd-fill');
                if (fill) { fill.style.transition = 'none'; fill.style.height = '0%'; }
            }
        }
    }

    // ---- 生命周期 ----
    start() {
        console.log('Game: Started!');
        this.isRunning = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.time = 0;
        this.plants = [];
        this.zombies = [];
        this.bullets = [];
        this.currentWaveIndex = 0;
        this.selectedPlant = null;

        this._resetAllCooldowns();
        this._deselectAll();

        this.ui.updateScore(this.score);
        this.ui.updateTime(this.time);
        this.ui.clearLawn();

        const waveMsg = document.createElement('div');
        waveMsg.id = 'wave-message';
        this.elLawn.appendChild(waveMsg);
        this.ui.waveMsgEl = waveMsg;

        this.quiz.unlockAudio();
        this.quiz.start();

        this.addScore(150);

        this.lastTimestamp = 0;
        this.gameLoopId = requestAnimationFrame((t) => this.loop(t));

        this.timerId = setInterval(() => {
            this.time++;
            this.ui.updateTime(this.time);
            this._checkWave();
        }, 1000);

        this.ui.showWaveMessage('🛡️ 准备防御！');
    }

    restart() {
        this.stop();
        this.start();
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        cancelAnimationFrame(this.gameLoopId);
        clearInterval(this.timerId);
        clearInterval(this.spawnTimerId);
        this._resetAllCooldowns();
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;
        this.isPaused = true;
        cancelAnimationFrame(this.gameLoopId);
        clearInterval(this.timerId);
        clearInterval(this.spawnTimerId);

        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) pauseOverlay.style.display = 'flex';
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;

        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) pauseOverlay.style.display = 'none';

        this.lastTimestamp = 0;
        this.gameLoopId = requestAnimationFrame((t) => this.loop(t));

        this.timerId = setInterval(() => {
            this.time++;
            this.ui.updateTime(this.time);
            this._checkWave();
        }, 1000);
    }

    // ---- 波次管理 ----
    _checkWave() {
        const waves = this.config.WAVES;
        for (let i = this.currentWaveIndex; i < waves.length; i++) {
            const wave = waves[i];
            if (this.time >= wave.time && wave.count > 0 && i > this.currentWaveIndex - 1) {
                this.currentWaveIndex = i + 1;
                this._startWaveSpawn(wave);
                this.ui.showWaveMessage(`💀 第${i}波僵尸来袭！`);
                break;
            }
        }
    }

    _startWaveSpawn(wave) {
        clearInterval(this.spawnTimerId);
        this.spawnTimerId = setInterval(() => {
            if (!this.isRunning || this.isGameOver || this.isPaused) {
                clearInterval(this.spawnTimerId);
                return;
            }
            for (let i = 0; i < wave.count; i++) {
                const col = Math.floor(Math.random() * this.cols);
                this._spawnZombie(col);
            }
        }, wave.interval);
    }

    _spawnZombie(col) {
        const types = Object.keys(config.ZOMBIES);
        let maxTypeIndex = 0;
        if (this.time > 60) maxTypeIndex = 1;
        if (this.time > 120) maxTypeIndex = 2;
        const typeKey = types[Math.floor(Math.random() * (maxTypeIndex + 1))];
        const zombieConfig = config.ZOMBIES[typeKey];

        const zombie = new Zombie(-1, col, zombieConfig, this);
        this.zombies.push(zombie);
    }

    // ---- 每帧循环 ----
    loop(timestamp) {
        if (!this.isRunning || this.isPaused) return;

        this.update(timestamp);
        this.gameLoopId = requestAnimationFrame((t) => this.loop(t));
    }

    update(timestamp) {
        for (const z of this.zombies) z.update(timestamp);
        this.zombies = this.zombies.filter(z => z.hp > 0);

        for (const p of this.plants) p.update(timestamp);
        this.plants = this.plants.filter(p => p.hp > 0);

        for (const b of this.bullets) b.update(timestamp);
        this.bullets = this.bullets.filter(b => b.active);

        this._checkBulletCollisions();
    }

    _checkBulletCollisions() {
        for (const b of this.bullets) {
            if (!b.active) continue;
            for (const z of this.zombies) {
                if (z.hp <= 0) continue;
                if (b.col !== z.col) continue;

                const bulletTop = b.y;
                const zombieBottom = z.y + this.gridSize * 0.8;
                const zombieTop = z.y;

                if (bulletTop <= zombieBottom && bulletTop >= zombieTop) {
                    z.takeDamage(b.damage);
                    b.hit();
                    // 击杀僵尸不给分
                    break;
                }
            }
        }
    }

    // ---- 公共方法 ----
    spawnBullet(col, x, y, plantConfig) {
        const bullet = new Bullet(col, x, y, plantConfig, this);
        this.bullets.push(bullet);
    }

    addScore(amount) {
        this.score = Math.max(0, this.score + amount);
        this.ui.updateScore(this.score);
        this._updateAllCards();
    }

    _updateAllCards() {
        for (const key of Object.keys(config.PLANTS)) {
            const plantCfg = config.PLANTS[key];
            const card = document.getElementById('card-' + plantCfg.id);
            if (!card) continue;
            if (this.score < plantCfg.cost || !this.cooldowns[key].ready) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        }
    }

    triggerGameOver(reason) {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.stop();

        console.log('Game Over:', reason);
        this.ui.showGameOver(this.score);
    }

    // ---- 响应式 ----
    resize() {
        const gameWrapper = document.getElementById('game-wrapper');
        if (!gameWrapper) return;

        const w = gameWrapper.clientWidth;
        const h = gameWrapper.clientHeight;

        const cellW = Math.floor(w / this.cols);
        const cellH = Math.floor(h / this.rows);
        this.gridSize = Math.min(cellW, cellH);

        this.width = this.gridSize * this.cols;
        this.height = this.gridSize * this.rows;

        if (this.elLawn) {
            this.elLawn.style.width = this.width + 'px';
            this.elLawn.style.height = this.height + 'px';
            this.elLawn.style.backgroundSize = `${this.gridSize}px ${this.gridSize}px`;
        }
    }
}
