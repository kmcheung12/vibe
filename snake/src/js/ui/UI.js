import * as THREE from 'three';
import { CONSTANTS } from '../utils/Constants.js';

export class UI {
    constructor({ container, highScore = 0 }) {
        this.container = container;
        this.highScore = highScore;
        this.eventListeners = {};
        this.selectedLevel = 4; // Default to level 4 (normal)
        
        // Create UI elements
        this.createUIElements();
        
        // Add event listeners
        this.addEventListeners();
        
        // Listen for level changes
        window.addEventListener('levelchange', this.onLevelChange.bind(this));
    }
    
    createUIElements() {
        // Create main menu
        this.createMainMenu();
        
        // Create game UI
        this.createGameUI();
        
        // Create game over screen
        this.createGameOverScreen();
        
        // Create pause screen
        this.createPauseScreen();
        
        // Create level selection
        this.createLevelSelection();
    }
    
    createMainMenu() {
        this.menuContainer = document.createElement('div');
        this.menuContainer.className = 'menu-container';
        
        const title = document.createElement('h1');
        title.textContent = 'Grid Snake';
        title.className = 'game-title';
        
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        startButton.className = 'menu-button';
        startButton.id = 'start-button';
        
        const instructions = document.createElement('div');
        instructions.className = 'instructions';
        instructions.innerHTML = `
            <h3>How to Play:</h3>
            <p>Use arrow keys or swipe to move</p>
            <p>Press space or double-tap to boost</p>
            <p>Collect food to grow longer</p>
            <p>Avoid hitting walls or yourself</p>
            <p>Press 1-9 to select difficulty level</p>
        `;
        
        this.menuContainer.appendChild(title);
        this.menuContainer.appendChild(startButton);
        this.menuContainer.appendChild(instructions);
        
        this.container.appendChild(this.menuContainer);
    }
    
    createLevelSelection() {
        this.levelContainer = document.createElement('div');
        this.levelContainer.className = 'level-container';
        
        const levelTitle = document.createElement('h3');
        levelTitle.textContent = 'Select Level:';
        levelTitle.className = 'level-title';
        
        this.levelDisplay = document.createElement('div');
        this.levelDisplay.className = 'level-display';
        this.levelDisplay.textContent = 'Level 4 - Normal';
        
        const levelButtons = document.createElement('div');
        levelButtons.className = 'level-buttons-grid'; // Changed class name to indicate grid layout
        
        // Create 9 level buttons in a 3x3 grid
        for (let row = 0; row < 3; row++) {
            const buttonRow = document.createElement('div');
            buttonRow.className = 'level-button-row';
            
            for (let col = 0; col < 3; col++) {
                const level = row * 3 + col + 1; // Calculate level number (1-9)
                const button = document.createElement('button');
                button.textContent = level;
                button.className = 'level-button';
                button.dataset.level = level;
                
                if (level === 4) {
                    button.classList.add('active');
                }
                
                button.addEventListener('click', () => {
                    // Update selected level
                    this.selectedLevel = level;
                    
                    // Update UI
                    document.querySelectorAll('.level-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    button.classList.add('active');
                    
                    // Dispatch level change event
                    window.dispatchEvent(new CustomEvent('levelchange', { 
                        detail: { 
                            level: level,
                            name: `Level ${level}`
                        }
                    }));
                });
                
                buttonRow.appendChild(button);
            }
            
            levelButtons.appendChild(buttonRow);
        }
        
        this.levelContainer.appendChild(levelTitle);
        this.levelContainer.appendChild(this.levelDisplay);
        this.levelContainer.appendChild(levelButtons);
        
        this.menuContainer.appendChild(this.levelContainer);
    }
    
    createGameUI() {
        this.gameUIContainer = document.createElement('div');
        this.gameUIContainer.className = 'game-ui-container';
        
        // Score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.scoreDisplay.textContent = 'Score: 0';
        
        // Level display
        this.gameLevelDisplay = document.createElement('div');
        this.gameLevelDisplay.className = 'game-level-display';
        this.gameLevelDisplay.textContent = 'Level: 4';
        
        // Pause button
        this.pauseButton = document.createElement('button');
        this.pauseButton.className = 'pause-button';
        this.pauseButton.innerHTML = '&#10074;&#10074;'; // Double vertical bar pause icon
        this.pauseButton.title = 'Pause Game';
        
        // Controls info
        const controlsInfo = document.createElement('div');
        controlsInfo.className = 'controls-info';
        controlsInfo.textContent = 'Arrows/Swipe to move | Space/Double-tap to boost';
        
        this.gameUIContainer.appendChild(this.scoreDisplay);
        this.gameUIContainer.appendChild(this.gameLevelDisplay);
        this.gameUIContainer.appendChild(this.pauseButton);
        this.gameUIContainer.appendChild(controlsInfo);
        
        this.container.appendChild(this.gameUIContainer);
        
        // Hide game UI initially
        this.gameUIContainer.style.display = 'none';
    }
    
    createGameOverScreen() {
        this.gameOverContainer = document.createElement('div');
        this.gameOverContainer.className = 'game-over-container';
        
        const gameOverTitle = document.createElement('h2');
        gameOverTitle.textContent = 'Game Over';
        gameOverTitle.className = 'game-over-title';
        
        this.finalScore = document.createElement('div');
        this.finalScore.className = 'final-score';
        
        this.highScoreDisplay = document.createElement('div');
        this.highScoreDisplay.className = 'high-score';
        
        this.levelInfo = document.createElement('div');
        this.levelInfo.className = 'level-info';
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.className = 'menu-button';
        restartButton.id = 'restart-button';
        
        const menuButton = document.createElement('button');
        menuButton.textContent = 'Main Menu';
        menuButton.className = 'menu-button';
        menuButton.id = 'menu-button';
        
        this.gameOverContainer.appendChild(gameOverTitle);
        this.gameOverContainer.appendChild(this.finalScore);
        this.gameOverContainer.appendChild(this.highScoreDisplay);
        this.gameOverContainer.appendChild(this.levelInfo);
        this.gameOverContainer.appendChild(restartButton);
        this.gameOverContainer.appendChild(menuButton);
        
        this.container.appendChild(this.gameOverContainer);
        
        // Hide game over screen initially
        this.gameOverContainer.style.display = 'none';
    }
    
    createPauseScreen() {
        this.pauseContainer = document.createElement('div');
        this.pauseContainer.className = 'pause-container';
        
        const pauseTitle = document.createElement('h2');
        pauseTitle.textContent = 'PAUSED';
        pauseTitle.className = 'pause-title';
        
        this.pauseScore = document.createElement('div');
        this.pauseScore.className = 'pause-score';
        this.pauseScore.textContent = 'Score: 0';
        
        this.pauseHighScore = document.createElement('div');
        this.pauseHighScore.className = 'pause-high-score';
        this.pauseHighScore.textContent = `High Score: ${this.highScore}`;
        
        this.pauseLevelInfo = document.createElement('div');
        this.pauseLevelInfo.className = 'pause-level-info';
        this.pauseLevelInfo.textContent = `Level: ${this.selectedLevel}`;
        
        const resumeButton = document.createElement('button');
        resumeButton.textContent = 'Resume Game';
        resumeButton.className = 'menu-button';
        resumeButton.id = 'resume-button';
        
        const pauseMenuButton = document.createElement('button');
        pauseMenuButton.textContent = 'Main Menu';
        pauseMenuButton.className = 'menu-button';
        pauseMenuButton.id = 'pause-menu-button';
        
        this.pauseContainer.appendChild(pauseTitle);
        this.pauseContainer.appendChild(this.pauseScore);
        this.pauseContainer.appendChild(this.pauseHighScore);
        this.pauseContainer.appendChild(this.pauseLevelInfo);
        this.pauseContainer.appendChild(resumeButton);
        this.pauseContainer.appendChild(pauseMenuButton);
        
        this.container.appendChild(this.pauseContainer);
        
        // Hide pause screen initially
        this.pauseContainer.style.display = 'none';
    }
    
    addEventListeners() {
        // Start button
        const startButton = document.getElementById('start-button');
        startButton.addEventListener('click', () => {
            this.emit('start');
        });
        
        // Restart button
        const restartButton = document.getElementById('restart-button');
        restartButton.addEventListener('click', () => {
            this.emit('restart');
        });
        
        // Menu button
        const menuButton = document.getElementById('menu-button');
        menuButton.addEventListener('click', () => {
            this.showMenu();
        });
        
        // Pause button
        this.pauseButton.addEventListener('click', () => {
            this.pauseGame();
        });
        
        // Resume button
        const resumeButton = document.getElementById('resume-button');
        resumeButton.addEventListener('click', () => {
            this.resumeGame();
        });
        
        // Pause menu button
        const pauseMenuButton = document.getElementById('pause-menu-button');
        pauseMenuButton.addEventListener('click', () => {
            this.showMenu();
        });
        
        // Number key level selection
        document.addEventListener('keydown', (event) => {
            if (this.menuContainer.style.display !== 'none') {
                const level = parseInt(event.key);
                if (!isNaN(level) && level >= 1 && level <= 9) {
                    // Update selected level
                    this.selectedLevel = level;
                    
                    // Update UI
                    document.querySelectorAll('.level-button').forEach(btn => {
                        btn.classList.remove('active');
                        if (parseInt(btn.dataset.level) === level) {
                            btn.classList.add('active');
                        }
                    });
                    
                    // Update level display
                    this.onLevelChange({ detail: { level: level } });
                }
            } else if (event.key === 'Escape' && this.gameUIContainer.style.display !== 'none') {
                // Toggle pause when Escape key is pressed during gameplay
                if (this.pauseContainer.style.display === 'none') {
                    this.pauseGame();
                } else {
                    this.resumeGame();
                }
            }
        });
    }
    
    onLevelChange(event) {
        const level = event.detail.level;
        const name = event.detail.name || `Level ${level}`;
        
        // Update level display
        this.levelDisplay.textContent = name;
        this.gameLevelDisplay.textContent = `Level: ${level}`;
        this.selectedLevel = level;
    }
    
    updateScore(score) {
        this.scoreDisplay.textContent = `Score: ${score}`;
    }
    
    pauseGame() {
        // Update pause screen information
        this.pauseScore.textContent = this.scoreDisplay.textContent;
        this.pauseHighScore.textContent = `High Score: ${this.highScore}`;
        this.pauseLevelInfo.textContent = this.gameLevelDisplay.textContent;
        
        // Show pause screen
        this.pauseContainer.style.display = 'flex';
        
        // Emit pause event
        this.emit('pause');
    }
    
    resumeGame() {
        // Hide pause screen
        this.pauseContainer.style.display = 'none';
        
        // Emit resume event
        this.emit('resume');
    }
    
    showGameUI() {
        this.menuContainer.style.display = 'none';
        this.gameOverContainer.style.display = 'none';
        this.pauseContainer.style.display = 'none';
        this.gameUIContainer.style.display = 'flex';
    }
    
    showGameOver(score, level) {
        this.gameUIContainer.style.display = 'none';
        this.pauseContainer.style.display = 'none';
        this.gameOverContainer.style.display = 'flex';
        
        this.finalScore.textContent = `Score: ${score}`;
        this.highScoreDisplay.textContent = `High Score: ${this.highScore}`;
        this.levelInfo.textContent = `Level: ${level}`;
    }
    
    showMenu() {
        this.gameUIContainer.style.display = 'none';
        this.gameOverContainer.style.display = 'none';
        this.pauseContainer.style.display = 'none';
        this.menuContainer.style.display = 'flex';
        
        // Emit menu event
        this.emit('menu');
    }
    
    hideMenu() {
        this.menuContainer.style.display = 'none';
    }
    
    hideGameOver() {
        this.gameOverContainer.style.display = 'none';
    }
    
    onResize() {
        // Adjust UI elements if needed on resize
    }
    
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
}
