class Game {
    constructor() {
        this.ui = new UI();
        this.progressTracker = new ProgressTracker();
        this.visualization = new Visualization();
        this.currentProblem = null;
        this.correctAnswers = 0;
        this.wrongAttempts = 0;
        this.startTime = null;
        this.timer = null;
        this.gameMode = 'challenge';
        this.difficulty = null;
        this.totalProblems = 20;
        this.rankings = this.loadRankings() || {};

        // Event Listeners
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectMode(btn.dataset.mode));
        });

        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => this.startGame(btn.dataset.difficulty));
        });

        document.addEventListener('answer-submit', () => this.checkAnswer());
        document.addEventListener('answer-check', () => this.autoCheckAnswer());
        document.addEventListener('quit-game', () => this.quitGame());
        document.addEventListener('skip-problem', () => this.skipProblem());
        document.addEventListener('view-progress', () => this.showProgress());
    }

    selectMode(mode) {
        this.gameMode = mode;
        document.getElementById('modeDisplay').textContent = 
            mode.charAt(0).toUpperCase() + mode.slice(1);
        document.getElementById('difficultyButtons').classList.remove('hidden');
    }

    startGame(difficulty) {
        this.difficulty = difficulty;
        this.correctAnswers = 0;
        this.wrongAttempts = 0;
        this.startTime = Date.now();
        
        // Reset UI
        this.ui.showGameScreen();
        document.getElementById('score').textContent = '0/20';
        
        // Start timer
        this.updateTimer();
        this.timer = setInterval(() => this.updateTimer(), 1000);
        
        // Generate first problem
        this.generateProblem();
    }

    generateProblem() {
        const problems = LEVELS[this.difficulty].problems;
        const problemType = problems[Math.floor(Math.random() * problems.length)];
        this.currentProblem = problemType.generator();
        
        // Update UI
        this.ui.displayProblem(this.currentProblem.question);
        this.ui.skipBtn.classList.add('hidden');
        this.ui.explanation.classList.add('hidden');
        
        // Show explanation in practice mode
        if (this.gameMode === 'practice') {
            this.ui.explanation.textContent = this.currentProblem.explanation;
            this.ui.explanation.classList.remove('hidden');
        }

        // Handle visualization
        this.visualization.update(this.currentProblem);
    }

    autoCheckAnswer() {
        const userAnswer = parseInt(this.ui.getAnswer());
        if (!isNaN(userAnswer) && userAnswer === this.currentProblem.answer) {
            // Simulate enter button press after a short delay to show the completed answer
            setTimeout(() => {
                const enterButton = document.querySelector('.num-btn.enter');
                if (enterButton) {
                    enterButton.classList.add('pressed');
                    setTimeout(() => enterButton.classList.remove('pressed'), 100);
                }
                this.processCorrectAnswer();
            }, 300);
        }
    }

    checkAnswer() {
        const userAnswer = parseInt(this.ui.getAnswer());
        if (isNaN(userAnswer)) return;

        if (userAnswer === this.currentProblem.answer) {
            this.processCorrectAnswer();
        } else {
            this.processIncorrectAnswer();
        }
    }

    processCorrectAnswer() {
        this.correctAnswers++;
        this.wrongAttempts = 0;
        
        // Update score
        document.getElementById('score').textContent = 
            `${this.correctAnswers}/${this.gameMode === 'challenge' ? this.totalProblems : '∞'}`;
        
        // Show explanation in practice mode
        if (this.gameMode === 'practice') {
            this.ui.explanation.textContent = `Correct! ${this.currentProblem.explanation}`;
            this.ui.explanation.classList.remove('hidden');
        }

        // Check if challenge mode is complete
        if (this.gameMode === 'challenge' && this.correctAnswers >= this.totalProblems) {
            this.endGame();
        } else {
            this.generateProblem();
        }
    }

    processIncorrectAnswer() {
        this.wrongAttempts++;
        
        // Show wrong answer animation
        this.ui.shake();

        // Show skip button after 3 wrong attempts in challenge mode
        if (this.wrongAttempts >= 3 && this.gameMode === 'challenge') {
            this.ui.skipBtn.classList.remove('hidden');
        }

        // Show explanation in practice mode
        if (this.gameMode === 'practice') {
            this.ui.explanation.textContent = `Try again. Hint: ${this.currentProblem.explanation}`;
            this.ui.explanation.classList.remove('hidden');
        }
    }

    skipProblem() {
        if (this.gameMode === 'challenge') {
            this.generateProblem();
        }
    }

    quitGame() {
        // Clear timer and game state
        clearInterval(this.timer);
        this.currentProblem = null;
        this.startTime = null;
        
        // Reset UI
        this.ui.showDifficultySelect();
        document.getElementById('difficultyButtons').classList.add('hidden');
        document.getElementById('timer').textContent = '00:00';
        document.getElementById('score').textContent = '0/20';
    }

    updateTimer() {
        if (!this.startTime) return;
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    endGame() {
        clearInterval(this.timer);
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Update progress tracker
        this.progressTracker.updateStats({
            mode: this.gameMode,
            difficulty: this.difficulty,
            correct: this.correctAnswers,
            total: this.totalProblems,
            time: totalTime,
            skipped: this.wrongAttempts > 0
        });

        // Update rankings for challenge mode
        if (this.gameMode === 'challenge') {
            this.updateRankings({
                difficulty: this.difficulty,
                correct: this.correctAnswers,
                time: totalTime
            });
            this.ui.showRankings(this.getRankingsForDifficulty(this.difficulty));
        } else {
            this.ui.showProgress();
        }
    }

    showProgress() {
        this.progressTracker.updateProgressDisplay();
        this.ui.showProgress();
    }

    loadRankings() {
        const rankings = localStorage.getItem('rankings');
        return rankings ? JSON.parse(rankings) : {};
    }

    updateRankings(score) {
        if (!this.rankings[score.difficulty]) {
            this.rankings[score.difficulty] = [];
        }

        this.rankings[score.difficulty].push({
            correct: score.correct,
            time: score.time,
            date: new Date().toISOString()
        });

        // Sort by correct answers (desc) and time (asc)
        this.rankings[score.difficulty].sort((a, b) => {
            if (b.correct !== a.correct) return b.correct - a.correct;
            return a.time - b.time;
        });

        // Keep only top 20
        this.rankings[score.difficulty] = this.rankings[score.difficulty].slice(0, 20);
        localStorage.setItem('rankings', JSON.stringify(this.rankings));
    }

    getRankingsForDifficulty(difficulty) {
        return this.rankings[difficulty] || [];
    }
}
