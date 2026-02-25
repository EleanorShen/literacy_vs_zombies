export default class QuizManager {
    constructor(game) {
        this.game = game;
        this.config = game.config;
        this.currentQuestion = null;
        this.processing = false;
        
        // DOM Elements
        this.elMainDisplay = document.getElementById('main-display');
        this.elOptions = document.getElementById('options-container');
        this.elSpeaker = document.getElementById('main-speaker');
        this.elFeedback = document.getElementById('feedback-text');
        this.elFeedbackOverlay = document.getElementById('feedback-overlay');
        
        this.modes = ['LISTEN', 'READ']; // 默认两种都有
        this.audioUnlocked = false;
        this._currentAudio = null;  // 当前正在播放的 Audio 对象
        
        // Bind events
        if (this.elSpeaker) {
            this.elSpeaker.addEventListener('click', () => this.speakCurrent());
        }
    }
    
    setModes(modes) {
        this.modes = modes;
    }

    start() {
        this.generateQuestion();
    }
    
    /**
     * 在用户手势（click/touch）中调用，解锁移动端 Audio 播放权限
     */
    unlockAudio() {
        if (this.audioUnlocked) return;
        
        // 用静音 data URI 解锁 Audio 播放权限（必须在用户手势中）
        const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=');
        silentAudio.play().catch(() => {});
        
        this.audioUnlocked = true;
    }

    generateQuestion() {
        if (this.game.isGameOver) return;
        this.processing = false;
        if (this.elFeedback) this.elFeedback.innerText = '';
        if (this.elOptions) this.elOptions.innerHTML = '';
        
        const mode = this.modes[Math.floor(Math.random() * this.modes.length)];
        const words = this.config.words; // 假设传入了词库
        const target = words[Math.floor(Math.random() * words.length)];
        
        // 干扰项
        const distractors = [];
        while(distractors.length < 3) {
            const r = words[Math.floor(Math.random() * words.length)];
            if(r !== target && !distractors.includes(r)) distractors.push(r);
        }
        
        const options = [...distractors, target].sort(() => Math.random() - 0.5);
        this.currentQuestion = { mode, target, options };
        
        this.render();
        
        if (mode === 'LISTEN') {
            // 尝试自动发音，如果被移动端阻止会自动闪烁喇叭提示
            setTimeout(() => this.speak(target.char), 300);
        }
    }
    
    render() {
        const q = this.currentQuestion;
        
        if (q.mode === 'LISTEN') {
            document.getElementById('quiz-mode-label').innerText = '👂 听音辨字';
            this.elMainDisplay.innerText = q.target.pinyin;
            if (this.elSpeaker) this.elSpeaker.style.display = 'block';
            
            q.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = opt.char;
                btn.onclick = () => this.checkAnswer(opt);
                this.elOptions.appendChild(btn);
            });
            
        } else {
            document.getElementById('quiz-mode-label').innerText = '👁️ 看字选音';
            this.elMainDisplay.innerText = q.target.char;
            if (this.elSpeaker) this.elSpeaker.style.display = 'none';
            
            q.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = opt.pinyin;
                btn.onclick = () => this.checkAnswer(opt);
                this.elOptions.appendChild(btn);
            });
        }
    }
    
    checkAnswer(selected) {
        if (this.processing || this.game.isGameOver) return;
        
        if (selected === this.currentQuestion.target) {
            this.elFeedback.innerText = '✅ 正确 +40阳光';
            this.elFeedback.style.color = 'green';
            this.game.addScore(40);
            this.processing = true;
            setTimeout(() => this.generateQuestion(), 800);
        } else {
            this.elFeedback.innerText = '❌ 错误 -10阳光';
            this.elFeedback.style.color = 'red';
            this.game.addScore(-10);
            
            // 错误动画
            if (this.elFeedbackOverlay) {
                this.elFeedbackOverlay.style.display = 'flex';
                setTimeout(() => { this.elFeedbackOverlay.style.display = 'none'; }, 500);
            }
        }
    }
    
    speak(text) {
        // 停止上一次播放
        if (this._currentAudio) {
            this._currentAudio.pause();
            this._currentAudio = null;
        }
        
        const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=1`;
        const audio = new Audio(url);
        this._currentAudio = audio;
        
        const playPromise = audio.play();
        if (playPromise) {
            playPromise.catch(() => {
                // 自动播放被阻止（非用户手势上下文），闪烁喇叭提示用户点击
                this._showSpeakerHint();
            });
        }
    }
    
    /**
     * 闪烁喇叭按钮，提示用户手动点击发音
     */
    _showSpeakerHint() {
        if (this.elSpeaker) {
            this.elSpeaker.classList.add('speaker-hint');
            setTimeout(() => this.elSpeaker.classList.remove('speaker-hint'), 2000);
        }
    }
    
    speakCurrent() {
        if (!this.currentQuestion) return;
        
        // 停止上一次播放
        if (this._currentAudio) {
            this._currentAudio.pause();
            this._currentAudio = null;
        }
        
        const text = this.currentQuestion.target.char;
        const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=1`;
        const audio = new Audio(url);
        this._currentAudio = audio;
        // 喇叭按钮点击 = 用户手势上下文，play() 一定成功
        audio.play().catch(err => console.warn('Speaker play failed:', err));
    }
}
