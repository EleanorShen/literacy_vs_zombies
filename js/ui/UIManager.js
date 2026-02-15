export default class UIManager {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.timeEl = document.getElementById('game-time');
        this.lawnEl = document.getElementById('lawn');
        this.waveMsgEl = document.getElementById('wave-message');
        this.gameOverPanel = document.getElementById('game-over-panel');
        this.overlay = document.getElementById('overlay-screen');
    }

    updateScore(score) {
        if (this.scoreEl) this.scoreEl.textContent = score;
    }

    updateTime(seconds) {
        if (this.timeEl) {
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            this.timeEl.textContent = `${m}:${s}`;
        }
    }

    showWaveMessage(msg) {
        if (this.waveMsgEl) {
            this.waveMsgEl.textContent = msg;
            this.waveMsgEl.style.display = 'block';
            this.waveMsgEl.style.opacity = '1';
            
            setTimeout(() => {
                this.waveMsgEl.style.opacity = '0';
                setTimeout(() => {
                    this.waveMsgEl.style.display = 'none';
                }, 500);
            }, 2000);
        }
    }

    showGameOver(score) {
        if (this.overlay) this.overlay.style.display = 'flex';
        if (this.gameOverPanel) {
            this.gameOverPanel.style.display = 'block';
            const startPanel = document.getElementById('start-panel');
            if (startPanel) startPanel.style.display = 'none';
            const goStats = document.getElementById('go-stats');
            if (goStats) goStats.textContent = `最终得分: ${score}`;
        }
    }

    clearLawn() {
        if (this.lawnEl) {
            this.lawnEl.innerHTML = '';
        }
    }
}
