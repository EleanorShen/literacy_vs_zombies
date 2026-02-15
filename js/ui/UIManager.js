export default class UIManager {
    constructor(game) {
        this.game = game;
        this.elScore = document.getElementById('score');
        this.elTime = document.getElementById('game-time');
        
        // 绑定按钮事件
        document.getElementById('btn-start').addEventListener('click', () => {
            document.getElementById('overlay-screen').style.display = 'none';
            this.game.start();
        });
        
        document.getElementById('card-peashooter').addEventListener('click', () => {
            if (this.game.score >= 100) {
                if (this.game.selectedPlant === 'peashooter') {
                    this.game.deselectPlant();
                    document.getElementById('card-peashooter').classList.remove('selected');
                } else {
                    this.game.selectPlant('peashooter');
                    document.getElementById('card-peashooter').classList.add('selected');
                }
            }
        });
        
        document.getElementById('btn-restart').addEventListener('click', () => location.reload());
        document.getElementById('btn-end-game').addEventListener('click', () => this.game.gameOver('manual'));
    }
    
    update(timestamp) {
        if (!this.game.isRunning) return;
        
        // 更新分数
        this.elScore.innerText = this.game.score;
        
        // 更新时间
        const elapsed = Math.floor((Date.now() - this.game.startTime) / 1000);
        const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        this.elTime.innerText = `${m}:${s}`;
        
        // 更新卡片状态
        const card = document.getElementById('card-peashooter');
        if (this.game.score >= 100) {
            card.classList.remove('disabled');
        } else {
            card.classList.add('disabled');
            if (this.game.selectedPlant === 'peashooter') {
                this.game.deselectPlant();
                card.classList.remove('selected');
            }
        }
    }
    
    showGameOver(reason) {
        document.getElementById('overlay-screen').style.display = 'flex';
        document.getElementById('start-panel').style.display = 'none';
        document.getElementById('game-over-panel').style.display = 'block';
        
        const title = document.getElementById('go-title');
        title.innerText = reason === 'win' ? '🎉 胜利！' : '🧠 脑子被吃了！';
        title.style.color = reason === 'win' ? '#2ecc71' : '#e74c3c';
        
        document.getElementById('go-stats').innerText = `最终得分: ${this.game.score}`;
    }
}
