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
        
        this.synth = window.speechSynthesis;
        this.modes = ['LISTEN', 'READ']; // 默认两种都有
        
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
    
    unlockAudio() {
        if (!this.synth) return;
        const u = new SpeechSynthesisUtterance("");
        this.synth.speak(u);
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
            setTimeout(() => this.speak(target.char), 500);
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
        if (!this.synth) return;
        this.synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        this.synth.speak(u);
    }
    
    speakCurrent() {
        if (this.currentQuestion) this.speak(this.currentQuestion.target.char);
    }
}
