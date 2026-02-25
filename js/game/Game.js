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
        this.config.words = words.Hsk1Words;

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
        this.craters = []; // { row, col, el }

        // 关卡 & 波次
        this.currentLevel = null;
        this.currentLevelId = 1;
        this.currentWave = 0;
        this.waveSpawnQueue = [];
        this.waveSpawnTimer = 0;
        this.waveCooldown = 0;
        this.allWavesSpawned = false;
        this.totalSpawned = 0;
        this.totalKilled = 0;

        // 选中的植物 / 铲子
        this.selectedPlant = null;
        this.shovelMode = false;
        this.shovelUnlocked = false;

        // 冷却 { plantKey: endTimestamp }
        this.cooldowns = {};

        // 当前关卡使用的卡槽植物keys
        this.activeSlots = [];

        // deltaTime
        this.lastTimestamp = 0;

        // 答题
        this.quiz = new QuizManager(this);

        // 关卡解锁状态
        this._loadProgress();

        this._bindEvents();
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // 初始化关卡选择按钮
        this._renderLevelButtons();
    }

    // ============ 存档 ============
    _loadProgress() {
        try {
            const data = JSON.parse(localStorage.getItem('lvz_progress') || '{}');
            this.unlockedLevel = data.unlockedLevel || 1;
            this.shovelUnlocked = data.shovelUnlocked || false;
            this.unlockedPlants = data.unlockedPlants || ['PEASHOOTER'];
        } catch {
            this.unlockedLevel = 1;
            this.shovelUnlocked = false;
            this.unlockedPlants = ['PEASHOOTER'];
        }
    }

    _saveProgress() {
        localStorage.setItem('lvz_progress', JSON.stringify({
            unlockedLevel: this.unlockedLevel,
            shovelUnlocked: this.shovelUnlocked,
            unlockedPlants: this.unlockedPlants
        }));
    }

    // ============ 关卡选择 UI ============
    _renderLevelButtons() {
        const container = document.getElementById('level-buttons');
        if (!container) return;
        container.innerHTML = '';

        for (const lv of this.config.LEVELS) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = lv.name;
            btn.dataset.levelId = lv.id;

            if (lv.id > this.unlockedLevel) {
                btn.classList.add('locked');
                btn.textContent = '🔒 ' + lv.name;
            } else {
                btn.addEventListener('click', () => this._onLevelSelect(lv.id));
            }
            container.appendChild(btn);
        }
    }

    _onLevelSelect(levelId) {
        this.currentLevelId = levelId;
        this.currentLevel = this.config.LEVELS.find(l => l.id === levelId);

        // 高亮选中按钮
        document.querySelectorAll('.level-btn').forEach(b => b.style.outline = '');
        const btn = document.querySelector(`.level-btn[data-level-id="${levelId}"]`);
        if (btn) btn.style.outline = '3px solid #f1c40f';

        // 如果需要选卡，弹出选卡界面；否则直接开始
        if (this.currentLevel.needPick && this.currentLevel.availablePlants.length > this.currentLevel.maxSlots) {
            this._showCardPick();
        } else {
            // 不需要选卡，直接用全部可用植物
            this.activeSlots = [...this.currentLevel.availablePlants];
            this._startGame();
        }
    }

    // ============ 选卡系统 ============
    _showCardPick() {
        const overlay = document.getElementById('card-pick-overlay');
        const grid = document.getElementById('card-pick-grid');
        const confirmBtn = document.getElementById('btn-pick-confirm');
        const remainSpan = document.getElementById('pick-remaining');
        if (!overlay || !grid) return;

        const maxSlots = this.currentLevel.maxSlots;
        const picked = new Set();

        grid.innerHTML = '';
        for (const key of this.currentLevel.availablePlants) {
            const pCfg = this.config.PLANTS[key];
            if (!pCfg) continue;

            const card = document.createElement('div');
            card.className = 'pick-card';
            card.dataset.key = key;
            card.innerHTML = `
                <span class="pick-emoji">${pCfg.emoji}</span>
                <span>${pCfg.name}</span>
                <span class="pick-cost">☀${pCfg.cost}</span>
            `;
            card.addEventListener('click', () => {
                if (picked.has(key)) {
                    picked.delete(key);
                    card.classList.remove('picked');
                } else if (picked.size < maxSlots) {
                    picked.add(key);
                    card.classList.add('picked');
                }
                const remain = maxSlots - picked.size;
                remainSpan.textContent = remain;
                confirmBtn.disabled = picked.size !== maxSlots;
            });
            grid.appendChild(card);
        }

        remainSpan.textContent = maxSlots;
        confirmBtn.disabled = true;

        // 移除旧监听器（用克隆替换）
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        newBtn.addEventListener('click', () => {
            this.activeSlots = [...picked];
            overlay.style.display = 'none';
            this._startGame();
        });

        // 隐藏开始界面，显示选卡
        document.getElementById('overlay-screen').style.display = 'none';
        overlay.style.display = 'flex';
    }

    // ============ 游戏启动 / 重置 ============
    _startGame() {
        // 隐藏所有遮罩
        document.getElementById('overlay-screen').style.display = 'none';
        document.getElementById('card-pick-overlay').style.display = 'none';
        document.getElementById('pause-overlay').style.display = 'none';

        // 在用户手势上下文中解锁移动端语音
        this.quiz.unlockAudio();

        // 读取题型 checkbox 状态
        const listenChecked = document.getElementById('mode-listen')?.checked;
        const readChecked = document.getElementById('mode-read')?.checked;
        const modes = [];
        if (listenChecked) modes.push('LISTEN');
        if (readChecked) modes.push('READ');
        this.quiz.setModes(modes.length > 0 ? modes : ['LISTEN', 'READ']);

        this.reset();
        this.score = this.currentLevel.startSun;
        this.ui.updateScore(this.score);

        // 更新关卡标签
        const label = document.getElementById('level-label');
        if (label) label.textContent = this.currentLevel.name;

        this._renderSidebar();
        this.resize();
        this.isRunning = true;
        this.lastTimestamp = 0;
        this.quiz.start();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    start() {
        // 兼容旧的 main.js 调用：默认选第一关
        if (!this.currentLevel) {
            this.currentLevelId = 1;
            this.currentLevel = this.config.LEVELS[0];
            this.activeSlots = [...this.currentLevel.availablePlants];
        }
        this._startGame();
    }

    restart() {
        this._startGame();
    }

    reset() {
        this.isRunning = false;
        this.isGameOver = false;
        this.isPaused = false;
        this.time = 0;
        this.ui.updateTime(0);

        // 清除实体
        this.plants.forEach(p => p.el && p.el.remove());
        this.zombies.forEach(z => z.el && z.el.remove());
        this.bullets.forEach(b => b.el && b.el.remove());
        this.craters.forEach(c => c.el && c.el.remove());
        this.plants = [];
        this.zombies = [];
        this.bullets = [];
        this.craters = [];

        // 波次重置
        this.currentWave = 0;
        this.waveSpawnQueue = [];
        this.waveSpawnTimer = 0;
        this.waveCooldown = 0;
        this.allWavesSpawned = false;
        this.totalSpawned = 0;
        this.totalKilled = 0;

        // 选中状态
        this.selectedPlant = null;
        this.shovelMode = false;
        this.cooldowns = {};
    }

    // ============ 侧边栏渲染 ============
    _renderSidebar() {
        const container = document.getElementById('sidebar-cards');
        if (!container) return;
        container.innerHTML = '';

        // 铲子按钮（如果已解锁且关卡支持）
        if (this.shovelUnlocked || this.currentLevel.hasShovel) {
            const shovelSlot = document.createElement('div');
            shovelSlot.className = 'card-slot shovel-slot';
            shovelSlot.id = 'btn-shovel';
            shovelSlot.innerHTML = `
                <span class="card-img">🔧</span>
                <span class="card-name">铲子</span>
            `;
            shovelSlot.addEventListener('click', () => this._toggleShovel());
            container.appendChild(shovelSlot);
        }

        // 植物卡槽
        for (const key of this.activeSlots) {
            const pCfg = this.config.PLANTS[key];
            if (!pCfg) continue;

            const slot = document.createElement('div');
            slot.className = 'card-slot';
            slot.dataset.plantKey = key;
            slot.innerHTML = `
                <div class="cd-overlay"></div>
                <span class="card-img">${pCfg.emoji}</span>
                <span class="card-name">${pCfg.name}</span>
                <span class="card-cost">☀${pCfg.cost}</span>
            `;
            slot.addEventListener('click', () => this._onCardClick(key, slot));
            container.appendChild(slot);
        }
    }

    _onCardClick(key, slot) {
        if (!this.isRunning || this.isGameOver || this.isPaused) return;

        const pCfg = this.config.PLANTS[key];
        // 检查冷却
        if (this.cooldowns[key] && performance.now() < this.cooldowns[key]) return;
        // 检查阳光
        if (this.score < pCfg.cost) return;

        // 取消铲子模式
        this.shovelMode = false;
        const shovelBtn = document.getElementById('btn-shovel');
        if (shovelBtn) shovelBtn.classList.remove('selected');

        // 切换选中
        if (this.selectedPlant === key) {
            this.selectedPlant = null;
            slot.classList.remove('selected');
        } else {
            // 取消之前选中
            document.querySelectorAll('.card-slot.selected').forEach(s => s.classList.remove('selected'));
            this.selectedPlant = key;
            slot.classList.add('selected');
        }
    }

    _updateCardStates() {
        const now = performance.now();
        document.querySelectorAll('.card-slot[data-plant-key]').forEach(slot => {
            const key = slot.dataset.plantKey;
            const pCfg = this.config.PLANTS[key];
            if (!pCfg) return;

            const onCd = this.cooldowns[key] && now < this.cooldowns[key];
            const noSun = this.score < pCfg.cost;

            slot.classList.toggle('on-cooldown', !!onCd);
            slot.classList.toggle('disabled', !!(onCd || noSun));
        });
    }

    // ============ 铲子 ============
    _toggleShovel() {
        if (!this.isRunning || this.isGameOver || this.isPaused) return;

        this.shovelMode = !this.shovelMode;

        // 取消植物选中
        if (this.shovelMode) {
            this.selectedPlant = null;
            document.querySelectorAll('.card-slot.selected').forEach(s => s.classList.remove('selected'));
        }

        const shovelBtn = document.getElementById('btn-shovel');
        if (shovelBtn) shovelBtn.classList.toggle('selected', this.shovelMode);

        // 切换光标样式
        this.elLawn.style.cursor = this.shovelMode ? 'not-allowed' : 'crosshair';
    }

    // ============ 草坪点击 ============
    _onLawnClick(e) {
        if (!this.isRunning || this.isGameOver || this.isPaused) return;

        const rect = this.elLawn.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const col = Math.floor(clickX / this.gridSize);
        const row = Math.floor(clickY / this.gridSize);

        // 边界检查
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

        // ---- 铲子模式：铲除该格植物 ----
        if (this.shovelMode) {
            const idx = this.plants.findIndex(p => p.col === col && p.row === row && p.hp > 0);
            if (idx !== -1) {
                const plant = this.plants[idx];
                plant.hp = 0;
                plant.el.remove();
                this.plants.splice(idx, 1);
            }
            // 铲完自动退出铲子模式
            this.shovelMode = false;
            const shovelBtn = document.getElementById('btn-shovel');
            if (shovelBtn) shovelBtn.classList.remove('selected');
            this.elLawn.style.cursor = 'crosshair';
            return;
        }

        // ---- 放置植物 ----
        if (!this.selectedPlant) return;

        const key = this.selectedPlant;
        const pCfg = this.config.PLANTS[key];
        if (!pCfg) return;

        // 检查阳光
        if (this.score < pCfg.cost) return;

        // 检查冷却
        if (this.cooldowns[key] && performance.now() < this.cooldowns[key]) return;

        // 检查该格是否有陨石坑
        if (this.craters.some(c => c.row === row && c.col === col)) return;

        // 检查该格是否已有植物
        if (this.plants.some(p => p.col === col && p.row === row && p.hp > 0)) return;

        // 扣阳光
        this.score -= pCfg.cost;
        this.ui.updateScore(this.score);

        // 放置
        const plant = new Plant(row, col, key, pCfg, this);
        this.plants.push(plant);

        // 启动冷却
        this.cooldowns[key] = performance.now() + pCfg.cooldown;

        // 取消选中
        this.selectedPlant = null;
        document.querySelectorAll('.card-slot.selected').forEach(s => s.classList.remove('selected'));
    }

    // ============ 波次系统 ============
    _startNextWave() {
        const lv = this.currentLevel;
        if (this.currentWave >= lv.FlagNum) {
            this.allWavesSpawned = true;
            return;
        }

        this.currentWave++;
        const waveIdx = this.currentWave; // 1-based

        // 大波提示
        if (lv.FlagToSumNum.a1.includes(waveIdx)) {
            this.ui.showWaveMessage('⚠️ 一大波僵尸正在接近！');
        } else if (waveIdx === 1) {
            this.ui.showWaveMessage(`💀 第 ${waveIdx} 波`);
        } else {
            this.ui.showWaveMessage(`💀 第 ${waveIdx}/${lv.FlagNum} 波`);
        }

        // 陨石坑机制：波次>=3 且关卡开启
        if (lv.hasCraters && waveIdx >= 3) {
            this._spawnCrater();
        }

        // 生成本波僵尸队列
        const count = lv.FlagToSumNum.a2[waveIdx - 1] || 1;
        this.waveSpawnQueue = [];
        for (let i = 0; i < count; i++) {
            const zType = this._pickZombieType(waveIdx);
            this.waveSpawnQueue.push(zType);
        }
        this.waveSpawnTimer = 0;
    }

    _pickZombieType(waveIdx) {
        const lv = this.currentLevel;
        // 筛选当前波次可出场的僵尸类型
        const candidates = lv.AZ.filter(a => waveIdx >= a[2]);
        if (candidates.length === 0) return 'NORMAL';

        // 按权重随机
        const totalWeight = candidates.reduce((sum, a) => sum + a[1], 0);
        let r = Math.random() * totalWeight;
        for (const [type, weight] of candidates) {
            r -= weight;
            if (r <= 0) return type;
        }
        return candidates[candidates.length - 1][0];
    }

    _spawnWaveZombies(dt) {
        if (this.waveSpawnQueue.length === 0) return;

        this.waveSpawnTimer += dt;
        const interval = (this.currentLevel.spawnInterval || 2000) / 1000; // 转为秒

        if (this.waveSpawnTimer >= interval) {
            this.waveSpawnTimer -= interval;

            const zType = this.waveSpawnQueue.shift();
            const zCfg = this.config.ZOMBIES[zType];
            if (!zCfg) return;

            // 随机列
            const col = Math.floor(Math.random() * this.cols);
            // 从顶部上方生成
            const z = new Zombie(-1, col, zCfg, this);
            this.zombies.push(z);
            this.totalSpawned++;
        }
    }

    // ============ 陨石坑机制 ============
    _spawnCrater() {
        // 1. 移除旧坑（全场只保留一个）
        for (const c of this.craters) {
            c.el.remove();
        }
        this.craters = [];

        // 2. 随机选一个新格子
        const row = Math.floor(Math.random() * this.rows);
        const col = Math.floor(Math.random() * this.cols);

        // 3. 摧毁该格植物
        const plantIdx = this.plants.findIndex(p => p.col === col && p.row === row && p.hp > 0);
        if (plantIdx !== -1) {
            const plant = this.plants[plantIdx];
            plant.hp = 0;
            plant.el.remove();
            this.plants.splice(plantIdx, 1);
        }

        // 4. 创建坑洞视觉
        const gs = this.gridSize;
        const el = document.createElement('div');
        el.className = 'entity crater';
        el.style.left = (col * gs) + 'px';
        el.style.top = (row * gs) + 'px';
        el.style.width = gs + 'px';
        el.style.height = gs + 'px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = (gs * 0.5) + 'px';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '1';
        el.textContent = '🕳️';
        this.elLawn.appendChild(el);

        this.craters.push({ row, col, el });

        // 5. 显示提示
        this.ui.showWaveMessage('☄️ 陨石坑出现！');
    }

    // ============ 游戏主循环 ============
    gameLoop(timestamp) {
        if (!this.isRunning || this.isGameOver) return;
        if (this.isPaused) {
            this.lastTimestamp = 0;
            requestAnimationFrame((ts) => this.gameLoop(ts));
            return;
        }

        // deltaTime（秒），首帧或暂停恢复后重置
        if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
        let dt = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        // 防止切标签页后 dt 过大
        if (dt > 0.5) dt = 0.016;

        // 更新游戏时间
        this.time += dt;
        this.ui.updateTime(Math.floor(this.time));

        // ---- 波次调度 ----
        if (!this.allWavesSpawned) {
            if (this.waveSpawnQueue.length > 0) {
                // 当前波还有僵尸待生成
                this._spawnWaveZombies(dt);
            } else {
                // 当前波生成完毕，等待波间冷却
                this.waveCooldown += dt;
                const cooldownSec = this.currentWave === 0 ? 3 : 8; // 首波3秒，之后8秒
                if (this.waveCooldown >= cooldownSec) {
                    this.waveCooldown = 0;
                    this._startNextWave();
                }
            }
        }

        // ---- 更新所有实体 ----
        this._updateEntities(timestamp, dt);

        // ---- 碰撞检测 ----
        this._checkCollisions();

        // ---- 清理死亡实体 ----
        this._cleanup();

        // ---- 更新卡槽状态 ----
        this._updateCardStates();

        // ---- 胜利判定 ----
        if (this.allWavesSpawned && this.waveSpawnQueue.length === 0) {
            const aliveZombies = this.zombies.filter(z => z.hp > 0);
            if (aliveZombies.length === 0) {
                this._onVictory();
                return;
            }
        }

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    _updateEntities(timestamp, dt) {
        for (const p of this.plants) {
            if (p.hp > 0) p.update(timestamp, dt);
        }
        for (const z of this.zombies) {
            if (z.hp > 0) z.update(timestamp, dt);
        }
        for (const b of this.bullets) {
            if (b.active) b.update(timestamp, dt);
        }
    }

    _checkCollisions() {
        const gs = this.gridSize;

        for (const b of this.bullets) {
            if (!b.active) continue;

            for (const z of this.zombies) {
                if (z.hp <= 0) continue;
                if (z.col !== b.col) continue;

                // 子弹与僵尸的Y轴碰撞
                const bCenterY = b.y + 7;
                const zTop = z.y;
                const zBottom = z.y + gs * 0.8;

                if (bCenterY >= zTop && bCenterY <= zBottom) {
                    // 命中
                    const killed = z.takeDamage(b.damage);
                    if (killed) {
                        this.totalKilled++;
                        this.score += 5;
                        this.ui.updateScore(this.score);
                    }

                    // 寒冰子弹：施加减速
                    if (b.isFrozen && z.hp > 0) {
                        const cfg = b.config;
                        z.applySlow(cfg.slowFactor || 0.5, cfg.slowDuration || 10000);
                    }

                    b.hit();
                    break;
                }
            }
        }
    }

    _cleanup() {
        this.plants = this.plants.filter(p => {
            if (p.hp <= 0) {
                if (p.el && p.el.parentNode) p.el.remove();
                return false;
            }
            return true;
        });
        this.zombies = this.zombies.filter(z => {
            if (z.hp <= 0) {
                if (z.el && z.el.parentNode) z.el.remove();
                return false;
            }
            return true;
        });
        this.bullets = this.bullets.filter(b => b.active);
    }

    // ============ 胜利 ============
    _onVictory() {
        this.isRunning = false;
        this.isGameOver = true;

        const lv = this.currentLevel;
        const reward = lv.reward;

        // 解锁下一关
        if (lv.id >= this.unlockedLevel) {
            this.unlockedLevel = lv.id + 1;
        }

        // 处理奖励
        if (reward) {
            if (reward.unlockPlant && !this.unlockedPlants.includes(reward.unlockPlant)) {
                this.unlockedPlants.push(reward.unlockPlant);
            }
            if (reward.unlockShovel) {
                this.shovelUnlocked = true;
            }
        }

        this._saveProgress();

        // 显示胜利界面
        const overlay = document.getElementById('overlay-screen');
        const goPanel = document.getElementById('game-over-panel');
        const startPanel = document.getElementById('start-panel');
        const goTitle = document.getElementById('go-title');
        const goStats = document.getElementById('go-stats');

        if (startPanel) startPanel.style.display = 'none';
        if (goTitle) goTitle.textContent = '🎉 关卡通过！';

        let statsHtml = `<p>关卡：${lv.name}</p>`;
        statsHtml += `<p>用时：${Math.floor(this.time)}秒 | 得分：${this.score}</p>`;
        statsHtml += `<p>击杀：${this.totalKilled} / ${this.totalSpawned}</p>`;

        if (reward) {
            statsHtml += `<div style="margin-top:12px;padding:10px;background:#2c3e50;border-radius:8px;">`;
            statsHtml += `<p style="font-size:18px;">🎁 获得奖励</p>`;
            statsHtml += `<p style="font-size:28px;">${reward.emoji}</p>`;
            statsHtml += `<p>${reward.name}</p>`;
            statsHtml += `</div>`;
        }

        if (goStats) goStats.innerHTML = statsHtml;
        if (goPanel) goPanel.style.display = 'block';
        if (overlay) overlay.style.display = 'flex';
    }

    // ============ 失败 ============
    triggerGameOver(reason) {
        if (this.isGameOver) return;
        this.isRunning = false;
        this.isGameOver = true;

        const overlay = document.getElementById('overlay-screen');
        const goPanel = document.getElementById('game-over-panel');
        const startPanel = document.getElementById('start-panel');
        const goTitle = document.getElementById('go-title');
        const goStats = document.getElementById('go-stats');

        if (startPanel) startPanel.style.display = 'none';
        if (goTitle) goTitle.textContent = '💀 游戏失败';

        let statsHtml = `<p>关卡：${this.currentLevel.name}</p>`;
        statsHtml += `<p>坚持了 ${Math.floor(this.time)} 秒</p>`;
        statsHtml += `<p>到达第 ${this.currentWave}/${this.currentLevel.FlagNum} 波</p>`;
        statsHtml += `<p>击杀：${this.totalKilled} / ${this.totalSpawned}</p>`;

        if (goStats) goStats.innerHTML = statsHtml;
        if (goPanel) goPanel.style.display = 'block';
        if (overlay) overlay.style.display = 'flex';
    }

    // ============ 辅助方法 ============
    spawnBullet(col, x, y, plantConfig) {
        const bullet = new Bullet(col, x, y, plantConfig, this);
        this.bullets.push(bullet);
    }

    addScore(amount) {
        this.score += amount;
        this.ui.updateScore(this.score);
    }

    // ============ 暂停 ============
    _togglePause() {
        if (!this.isRunning || this.isGameOver) return;

        this.isPaused = !this.isPaused;
        const pauseOverlay = document.getElementById('pause-overlay');
        const btnPause = document.getElementById('btn-pause');

        if (this.isPaused) {
            if (pauseOverlay) pauseOverlay.style.display = 'flex';
            if (btnPause) btnPause.textContent = '▶';
        } else {
            if (pauseOverlay) pauseOverlay.style.display = 'none';
            if (btnPause) btnPause.textContent = '⏸';
            this.lastTimestamp = 0; // 恢复时重置时间戳
        }
    }

    // ============ 返回菜单 ============
    _backToMenu() {
        this.reset();
        this._renderLevelButtons();

        const overlay = document.getElementById('overlay-screen');
        const startPanel = document.getElementById('start-panel');
        const goPanel = document.getElementById('game-over-panel');

        if (goPanel) goPanel.style.display = 'none';
        if (startPanel) startPanel.style.display = 'block';
        if (overlay) overlay.style.display = 'flex';
    }

    // ============ resize ============
    resize() {
        const wrapper = document.getElementById('game-wrapper');
        if (!wrapper) return;

        const wrapW = wrapper.clientWidth;
        const wrapH = wrapper.clientHeight;

        // 根据容器大小计算 gridSize
        const gsW = Math.floor(wrapW / this.cols);
        const gsH = Math.floor(wrapH / this.rows);
        this.gridSize = Math.min(gsW, gsH);

        this.width = this.gridSize * this.cols;
        this.height = this.gridSize * this.rows;

        this.elLawn.style.width = this.width + 'px';
        this.elLawn.style.height = this.height + 'px';
        this.elLawn.style.backgroundSize = this.gridSize + 'px ' + this.gridSize + 'px';
    }

    // ============ 事件绑定 ============
    _bindEvents() {
        // 草坪点击
        this.elLawn.addEventListener('click', (e) => this._onLawnClick(e));

        // 暂停
        const btnPause = document.getElementById('btn-pause');
        if (btnPause) btnPause.addEventListener('click', () => this._togglePause());

        // 恢复
        const btnResume = document.getElementById('btn-resume');
        if (btnResume) btnResume.addEventListener('click', () => this._togglePause());

        // 结束游戏
        const btnEnd = document.getElementById('btn-end-game');
        if (btnEnd) btnEnd.addEventListener('click', () => {
            if (this.isRunning && !this.isGameOver) {
                this.triggerGameOver('quit');
            }
        });

        // 重新挑战
        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart) btnRestart.addEventListener('click', () => {
            document.getElementById('game-over-panel').style.display = 'none';
            document.getElementById('overlay-screen').style.display = 'none';
            this.restart();
        });

        // 返回菜单
        const btnBack = document.getElementById('btn-back-menu');
        if (btnBack) btnBack.addEventListener('click', () => this._backToMenu());
    }
} // end class Game