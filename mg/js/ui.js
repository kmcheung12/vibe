class UI {
    constructor() {
        // Initialize UI elements
        this.difficultySelect = document.getElementById('difficultySelect');
        this.gameScreen = document.getElementById('gameScreen');
        this.problemDisplay = document.getElementById('problemDisplay');
        this.skipBtn = document.getElementById('skipBtn');
        this.explanation = document.getElementById('explanation');
        this.progressScreen = document.getElementById('progressScreen');
        this.rankings = document.getElementById('rankings');
        this.rankingsList = document.getElementById('rankingsList');
        this.modeDisplay = document.getElementById('modeDisplay');
        this.scoreDisplay = document.getElementById('score');
        this.timerDisplay = document.getElementById('timer');
        this.quitButton = document.getElementById('quitBtn');
        this.currentAnswer = '';
        this.originalProblem = '';
        this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Initialize event listeners
        this.initializeElements();
        this.initializeStyles();
        this.initializeEventListeners();
        this.initializeKeyboardSupport();
        this.initializeAnimations();
        this.initializeModeButtons();
        this.initializeGameControls();
        this.initializeQuitButton();

        // Hide number pad on mobile devices
        if (this.isMobileDevice) {
            const numberPad = document.getElementById('numberPad');
            if (numberPad) numberPad.classList.add('hidden');
        }
    }

    initializeElements() {
        // Initialize UI elements
    }

    initializeStyles() {
        // Initialize styles
    }

    initializeEventListeners() {
        // Initialize event listeners
    }

    initializeGameControls() {
        // Skip button
        this.skipBtn.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('skip-problem'));
        });

        // Play again button
        document.getElementById('playAgain').addEventListener('click', () => {
            this.showDifficultySelect();
        });

        // View progress button
        document.getElementById('viewProgress').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('view-progress'));
        });
    }

    initializeNumberPad() {
        document.querySelector('.number-pad').addEventListener('click', (e) => {
            const button = e.target;
            if (!button.classList.contains('num-btn')) return;

            button.classList.add('pressed');
            setTimeout(() => button.classList.remove('pressed'), 100);
            
            if (button.classList.contains('enter')) {
                document.dispatchEvent(new CustomEvent('answer-submit'));
            } else if (button.classList.contains('erase')) {
                this.currentAnswer = this.currentAnswer.slice(0, -1);
                this.updateProblemDisplay();
            } else if (this.currentAnswer.length < 10) {
                this.currentAnswer += button.textContent;
                this.updateProblemDisplay();
                document.dispatchEvent(new CustomEvent('answer-check'));
            }
        });
    }

    initializeKeyboardSupport() {
        const hiddenInput = document.getElementById('hiddenInput');

        // Focus hidden input when game screen is shown
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('hidden')) {
                    hiddenInput.blur();
                } else {
                    hiddenInput.focus();
                    if (this.isMobileDevice) {
                        // Ensure virtual keyboard shows up on mobile
                        hiddenInput.readOnly = false;
                        hiddenInput.click();
                    }
                }
            });
        });
        observer.observe(this.gameScreen, { attributes: true, attributeFilter: ['class'] });

        // Keep focus on hidden input
        document.addEventListener('click', () => {
            if (!this.gameScreen.classList.contains('hidden')) {
                hiddenInput.focus();
                if (this.isMobileDevice) {
                    hiddenInput.click();
                }
            }
        });

        // Handle input events for numbers
        hiddenInput.addEventListener('input', (e) => {
            // Get the last character entered
            const input = e.target.value.slice(-1);
            if (/^[0-9]$/.test(input)) {
                if (this.currentAnswer.length < 10) {
                    if (!this.isMobileDevice) {
                        const button = document.querySelector(`.num-btn[data-key="${input}"]`);
                        if (button) {
                            button.classList.add('pressed');
                            setTimeout(() => button.classList.remove('pressed'), 100);
                        }
                    }
                    this.currentAnswer += input;
                    this.updateProblemDisplay();
                    document.dispatchEvent(new CustomEvent('answer-check'));
                }
            }
            // Clear the input for next key, but keep focus
            hiddenInput.value = '';
        });

        // Handle control keys
        hiddenInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.code === 'NumpadEnter') {
                if (!this.isMobileDevice) {
                    const button = document.querySelector('.num-btn.enter');
                    if (button) {
                        button.classList.add('pressed');
                        setTimeout(() => button.classList.remove('pressed'), 100);
                    }
                }
                document.dispatchEvent(new CustomEvent('answer-submit'));
                e.preventDefault();
            }
            else if (e.key === 'Backspace' || e.key === 'Delete') {
                if (!this.isMobileDevice) {
                    const button = document.querySelector('.num-btn.erase');
                    if (button) {
                        button.classList.add('pressed');
                        setTimeout(() => button.classList.remove('pressed'), 100);
                    }
                }
                this.currentAnswer = this.currentAnswer.slice(0, -1);
                this.updateProblemDisplay();
                e.preventDefault();
            }
        });
    }

    initializeAnimations() {
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            .num-btn {
                transition: transform 0.1s, background-color 0.2s;
            }
            .num-btn.pressed {
                transform: scale(0.95);
                background-color: #e0e0e0;
            }
            .shake {
                animation: shake 0.5s;
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            .achievement-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.5s, slideOut 0.5s 2.5s;
                z-index: 1000;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            @keyframes slideOut {
                from { transform: translateX(0); }
                to { transform: translateX(100%); }
            }
            .mode-btn {
                display: flex;
                flex-direction: column;
                gap: 5px;
                text-align: center;
            }
            .mode-title {
                font-size: 1.2em;
                font-weight: bold;
            }
            .mode-desc {
                font-size: 0.9em;
                opacity: 0.9;
            }
            .mode-btn:hover .mode-desc {
                opacity: 1;
            }
            .achievement-icon {
                font-size: 24px;
            }
            .stat-box {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                text-align: center;
            }
            .stats-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            #progressChart {
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
            .achievement {
                display: flex;
                align-items: center;
                gap: 10px;
                background: white;
                padding: 15px;
                border-radius: 10px;
                margin: 10px 0;
            }
            .checkmark {
                font-size: 24px;
                color: green;
                animation: fadeOut 0.8s;
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    initializeModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    initializeQuitButton() {
        this.quitButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
                window.location.reload();
            }
        });
    }

    showGameScreen() {
        this.difficultySelect.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.progressScreen.classList.add('hidden');
        this.rankings.classList.add('hidden');
        this.skipBtn.classList.add('hidden');
        this.explanation.classList.add('hidden');
        this.currentAnswer = '';
        this.updateProblemDisplay();
    }

    showDifficultySelect() {
        this.difficultySelect.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.progressScreen.classList.add('hidden');
        this.rankings.classList.add('hidden');
        this.currentAnswer = '';
        this.originalProblem = '';
        this.problemDisplay.textContent = '';
    }

    showRankings(rankings) {
        this.rankingsList.innerHTML = '';
        rankings.forEach((score, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item';
            
            const position = document.createElement('span');
            position.className = 'ranking-position';
            position.textContent = `#${index + 1}`;
            
            const scoreText = document.createElement('span');
            scoreText.className = 'ranking-score';
            scoreText.textContent = `${score.correct}/20`;
            
            const time = document.createElement('span');
            time.className = 'ranking-time';
            const minutes = Math.floor(score.time / 60);
            const seconds = score.time % 60;
            time.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            item.appendChild(position);
            item.appendChild(scoreText);
            item.appendChild(time);
            this.rankingsList.appendChild(item);
        });

        this.difficultySelect.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.progressScreen.classList.add('hidden');
        this.rankings.classList.remove('hidden');
    }

    showProgress() {
        this.difficultySelect.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.rankings.classList.add('hidden');
        this.progressScreen.classList.remove('hidden');
    }

    displayProblem(problem) {
        this.originalProblem = problem;
        this.currentAnswer = '';
        this.updateProblemDisplay();
        this.explanation.classList.add('hidden');
        this.removeCheckmark(); // Ensure any previous checkmark is removed
    }

    updateProblemDisplay() {
        let displayText = this.originalProblem;
        if (!displayText) return;
        
        if (displayText.includes('_')) {
            displayText = displayText.replace('_', this.currentAnswer || '_');
        } else if (displayText.includes('?')) {
            displayText = displayText.replace('?', this.currentAnswer || '?');
        } else {
            displayText = displayText + ' = ' + (this.currentAnswer || '_');
        }
        this.problemDisplay.textContent = displayText;
    }

    updateTimer(seconds) {
        this.timerDisplay.textContent = this.formatTime(seconds);
    }

    updateScore(correct, total) {
        this.scoreDisplay.textContent = `${correct}/${total}`;
    }

    showSkipButton() {
        this.skipBtn.classList.remove('hidden');
    }

    hideSkipButton() {
        this.skipBtn.classList.add('hidden');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    getAnswer() {
        return this.currentAnswer.trim();
    }

    clearAnswer() {
        this.currentAnswer = '';
        this.updateProblemDisplay();
    }

    shake() {
        this.problemDisplay.classList.add('shake');
        setTimeout(() => this.problemDisplay.classList.remove('shake'), 500);
    }

    showCheckmark() {
        this.removeCheckmark(); // Remove any existing checkmark
        const checkmark = document.createElement('span');
        checkmark.textContent = '✓';
        checkmark.className = 'checkmark';
        this.problemDisplay.appendChild(checkmark);
        // Checkmark will auto-remove due to CSS animation
        setTimeout(() => this.removeCheckmark(), 800);
    }

    removeCheckmark() {
        const existingCheckmark = this.problemDisplay.querySelector('.checkmark');
        if (existingCheckmark) {
            existingCheckmark.remove();
        }
    }
}
