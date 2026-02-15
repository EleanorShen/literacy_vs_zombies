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

        // 词库挂到 config 上供 QuizManager 使用
        this.config.words = words.Hsk1Words;

        // 答题管理器
        this.quiz = new QuizManager(this);

        // 绑定事件
        this._bindEvents();

        // 响应式
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    _bindEvents() {
        // 点击草坪放置植物
        this.elLawn.addEventListener('click', (e) => {
            if (!this.isRunning || this.isGameOver) return;
            if (!this.selectedPlant) return;

            const rect = this.elLawn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.floor(x / this.gridSize);
            const row = Math.floor(y / this.gridSize);

            if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

            // 检查是否已有植物
            const occupied = this.plants.some(p => p.row === row && p.col === col);
            if (occupied) return;

            // 检查积分是否足够
            const plantConfig = config.PLANTS[this.selectedPlant];
            if (this.score < plantConfig.cost) return;

            // 扣分并放置
            this.addScore(-plantConfig.cost);
            const plant = new Plant(row, col, this.selectedPlant, plantConfig, this);
            this.plants.push(plant);
        });

        // 卡片选择
        const card = document.getElementById('card-peashooter');
        if (card) {
            card.addEventListener('click', () => {
                if (!this.isRunning) return;
                // 切换选中状态
                if (this.selectedPlant === 'PEASHOOTER') {
                    this.selectedPlant = null;
                    card.classList.remove('selected');
                } else {
                    this.selectedPlant = 'PEASHOOTER';
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
    }

    start() {
        console.log('Game: Started!');
        this.isRunning = true;
        this.isGameOver = false;
        this.score = 0;
        this.time = 0;
        this.plants = [];
        this.zombies = [];
        this.bullets = [];
        this.currentWaveIndex = 0;
        this.selectedPlant = null;

        // 重置 UI
        this.ui.updateScore(this.score);
        this.ui.updateTime(this.time);
        this.ui.clearLawn();

        // 重新添加 wave-message 元素（clearLawn 会清掉）
        const waveMsg = document.createElement('div');
        waveMsg.id = 'wave-message';
        this.elLawn.appendChild(waveMsg);
        this.ui.waveMsgEl = waveMsg;

        // 解锁音频（移动端需要用户交互后才能播放）
        this.quiz.unlockAudio();

        // 启动答题
        this.quiz.start();

        // 给玩家初始阳光
        this.addScore(150);

        // 启动游戏循环
        this.lastTimestamp = 0;
        this.gameLoopId = requestAnimationFrame((t) => this.loop(t));

        // 计时器
        this.timerId = setInterval(() => {
            this.time++;
            this.ui.updateTime(this.time);
            this._checkWave();
        }, 1000);

        // 第一波提示
        this.ui.showWaveMessage('🛡️ 准备防御！');
    }

    restart() {
        this.stop();
        this.start();
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.gameLoopId);
        clearInterval(this.timerId);
        clearInterval(this.spawnTimerId);
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
            if (!this.isRunning || this.isGameOver) {
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
        // 随机选择僵尸类型（根据时间增加难度）
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
        if (!this.isRunning) return;

        this.update(timestamp);
        this.gameLoopId = requestAnimationFrame((t) => this.loop(t));
    }

    update(timestamp) {
        // 更新僵尸
        for (const z of this.zombies) {
            z.update(timestamp);
        }
        // 清理死亡僵尸
        this.zombies = this.zombies.filter(z => z.hp > 0);

        // 更新植物（射击逻辑）
        for (const p of this.plants) {
            p.update(timestamp);
        }
        // 清理死亡植物
        this.plants = this.plants.filter(p => p.hp > 0);

        // 更新子弹
        for (const b of this.bullets) {
            b.update(timestamp);
        }
        // 清理失效子弹
        this.bullets = this.bullets.filter(b => b.active);

        // 碰撞检测：子弹 vs 僵尸
        this._checkBulletCollisions();
    }

    _checkBulletCollisions() {
        for (const b of this.bullets) {
            if (!b.active) continue;
            for (const z of this.zombies) {
                if (z.hp <= 0) continue;
                if (b.col !== z.col) continue;

                // 简单的 Y 轴碰撞
                const bulletTop = b.y;
                const zombieBottom = z.y + this.gridSize * 0.8;
                const zombieTop = z.y;

                if (bulletTop <= zombieBottom && bulletTop >= zombieTop) {
                    const killed = z.takeDamage(b.damage);
                    b.hit();
                    if (killed) {
                        this.addScore(z.config.scoreReward || 50);
                    }
                    break;
                }
            }
        }
    }

    // ---- 公共方法（供其他模块调用）----
    spawnBullet(col, x, y, plantConfig) {
        const bullet = new Bullet(col, x, y, plantConfig, this);
        this.bullets.push(bullet);
    }

    addScore(amount) {
        this.score = Math.max(0, this.score + amount);
        this.ui.updateScore(this.score);

        // 更新卡片可用状态
        const card = document.getElementById('card-peashooter');
        if (card) {
            if (this.score < config.PLANTS.PEASHOOTER.cost) {
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
