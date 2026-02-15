import Game from './game/Game.js';
import UIManager from './ui/UIManager.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Main: DOM loaded');

    // 初始化 UI 管理器
    const ui = new UIManager();
    
    // 初始化游戏核心（内部会自动创建 QuizManager）
    const game = new Game(ui);

    // 绑定开始按钮
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log('Main: Start button clicked');
            
            // 隐藏遮罩层
            const overlay = document.getElementById('overlay-screen');
            if (overlay) overlay.style.display = 'none';
            const pauseOverlay = document.getElementById('pause-overlay');
            if (pauseOverlay) pauseOverlay.style.display = 'none';

            // 启动游戏
            game.start();
        });
    } else {
        console.error('Start button #btn-start not found!');
    }

    // 绑定重新开始按钮
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            document.getElementById('game-over-panel').style.display = 'none';
            document.getElementById('overlay-screen').style.display = 'none';
            game.restart();
        });
    }
});
