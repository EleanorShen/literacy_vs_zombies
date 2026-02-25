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
        this.voicesReady = false;
        this.audioUnlocked = false;
        
        // 预加载语音列表（移动端需要等 voiceschanged 事件）
        this._initVoices();
        
        // Bind events
        if (this.elSpeaker) {
            this.elSpeaker.addEventListener('click', () => this.speakCurrent());
        }
    }
    
    _initVoices() {
        if (!this.synth) return;
        const voices = this.synth.getVoices();
        if (voices.length > 0) {
            this.voicesReady = true;
        }
        this.synth.addEventListener('voiceschanged', () => {
            this.voicesReady = true;
        });
    }
    
    setModes(modes) {
        this.modes = modes;
    }

    start() {
        this.generateQuestion();
    }
    
    /**
     * 在用户手势（click/touch）中调用，解锁移动端语音权限
     */
    unlockAudio() {
        if (!this.synth || this.audioUnlocked) return;
        // 用一个极短的静音utterance来解锁
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        u.lang = 'zh-CN';
        this.synth.speak(u);
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
            // 移动端：自动发音可能因缺少用户手势而静默失败
            // 先尝试自动播放，失败时用户可点击喇叭按钮
            setTimeout(() => this.speak(target.char), 300);
            // 喇叭按钮闪烁提示用户可点击
            if (this.elSpeaker) {
                this.elSpeaker.classList.add('speaker-hint');
                setTimeout(() => this.elSpeaker.classList.remove('speaker-hint'), 2000);
            }
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
        
        // 关键修复：Android Chrome 上 cancel() 紧接 speak() 会导致静默失败
        // 需要先 cancel，等一帧再 speak
        this.synth.cancel();
        
        const doSpeak = () => {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-CN';
            u.rate = 0.9;
            
            // 尝试选择中文语音
            const voices = this.synth.getVoices();
            const zhVoice = voices.find(v => v.lang.startsWith('zh'));
            if (zhVoice) u.voice = zhVoice;
            
            u.onerror = (e) => {
                console.warn('TTS error:', e.error);
            };
            
            this.synth.speak(u);
            
            // Android Chrome 防卡死：speak 后立即 resume
            // 某些版本会进入 paused 状态
            setTimeout(() => {
                if (this.synth.paused) {
                    this.synth.resume();
                }
            }, 100);
        };
        
        // cancel() 后延迟一帧再 speak，避免队列卡死
        setTimeout(doSpeak, 50);
    }
    
    speakCurrent() {
        if (this.currentQuestion) this.speak(this.currentQuestion.target.char);
    }
}
