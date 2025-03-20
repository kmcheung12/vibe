import { Game } from './game/Game.js';
import { Storage } from './utils/Storage.js';
import { UI } from './ui/UI.js';

export class App {
    constructor({ container }) {
        // Get container element
        this.container = container;
        
        // Initialize storage
        this.storage = new Storage('snake-game');
        
        // Initialize UI
        this.ui = new UI({
            container: this.container,
            highScore: this.storage.getHighScore()
        });
        
        // Initialize game
        this.initGame();
        
        // Add event listeners
        this.addEventListeners();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', this.onResize.bind(this));
        this.onResize();
    }
    
    initGame() {
        // Get container dimensions
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Initialize game
        this.game = new Game({
            width: width,
            height: height,
            storage: this.storage
        });
        
        // Add game renderer to container
        this.container.appendChild(this.game.renderer.domElement);
    }
    
    addEventListeners() {
        // Listen for UI events
        this.ui.on('start', () => {
            this.startGame();
        });
        
        this.ui.on('restart', () => {
            this.restartGame();
        });
        
        this.ui.on('pause', () => {
            this.pauseGame();
        });
        
        this.ui.on('resume', () => {
            this.resumeGame();
        });
        
        this.ui.on('menu', () => {
            this.returnToMenu();
        });
        
        // Listen for game events
        window.addEventListener('scoreupdate', (event) => {
            this.ui.updateScore(event.detail.score);
        });
        
        window.addEventListener('gameover', (event) => {
            this.gameOver(event.detail.score, event.detail.level);
        });
        
        window.addEventListener('levelchange', (event) => {
            // Set game speed level (0-indexed)
            this.game.setSpeedLevel(event.detail.level - 1);
        });
    }
    
    startGame() {
        // Hide menu
        this.ui.hideMenu();
        
        // Show game UI
        this.ui.showGameUI();
        
        // Start game
        this.game.start();
    }
    
    restartGame() {
        // Hide game over screen
        this.ui.hideGameOver();
        
        // Show game UI
        this.ui.showGameUI();
        
        // Start game
        this.game.start();
    }
    
    pauseGame() {
        // Pause the game
        this.game.pause();
    }
    
    resumeGame() {
        // Resume the game
        this.game.resume();
    }
    
    returnToMenu() {
        // Reset game state
        this.game.reset();
    }
    
    gameOver(score, level) {
        // Show game over screen with final score and level
        this.ui.showGameOver(score, level);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update game
        this.game.update();
    }
    
    onResize() {
        // Get container dimensions
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Update game size
        this.game.onResize(width, height);
        
        // Update UI
        this.ui.onResize();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    new App({ container });
});
