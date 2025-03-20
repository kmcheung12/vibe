import * as THREE from 'three';
import { Snake } from './Snake.js';
import { Food } from './Food.js';
import { CONSTANTS } from '../utils/Constants.js';
import { SoundManager } from '../utils/SoundManager.js';

export class Game {
    constructor({ width, height, storage }) {
        this.storage = storage;
        this.score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.speedLevel = CONSTANTS.DEFAULT_SPEED_LEVEL;
        
        // Initialize sound manager
        this.soundManager = new SoundManager();
        this.soundManager.init();
        
        // Initialize Three.js scene
        this.initScene(width, height);
        
        // Initialize game components after scene is ready
        this.initGame();

        // Set camera position for orthographic view
        // Z position doesn't affect the scale in orthographic projection
        // but we still need some distance for proper rendering
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(0, 0, 0);
        
        console.log("Camera position:", this.camera.position);
        console.log("Scene children count:", this.scene.children.length);
    }

    initScene(width, height) {
        // Setup Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x112111);

        // Calculate the aspect ratio
        const aspect = width / height;
        
        // Calculate camera frustum based on grid size
        const gridWidth = CONSTANTS.GRID_WIDTH * CONSTANTS.CELL_SIZE;
        const gridHeight = CONSTANTS.GRID_HEIGHT * CONSTANTS.CELL_SIZE;
        
        // Add some padding to ensure everything is visible
        const padding = 2;
        const frustumSize = Math.max(gridWidth, gridHeight) + padding;
        
        // Setup orthographic camera instead of perspective
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,  // left
            frustumSize * aspect / 2,   // right
            frustumSize / 2,            // top
            frustumSize / -2,           // bottom
            0.1,                        // near
            1000                        // far
        );

        // Setup renderer with antialiasing and device pixel ratio
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Setup game boundaries
        this.setupBoundaries();
    }

    setupBoundaries() {
        const cellSize = CONSTANTS.CELL_SIZE;
        
        // Create a boundary box to visualize the game boundaries
        const boundaryGeometry = new THREE.BoxGeometry(
            CONSTANTS.BOUNDARY_WIDTH * cellSize,
            CONSTANTS.BOUNDARY_HEIGHT * cellSize,
            1
        );
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff, // Bright blue color for boundary
            wireframe: true,
            transparent: true,
            opacity: 0.7
        });
        this.boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        this.scene.add(this.boundary);

        // Add grid helper for better visual reference
        // const gridHelper = new THREE.GridHelper(
        //     CONSTANTS.BOUNDARY_WIDTH * cellSize,
        //     CONSTANTS.BOUNDARY_HEIGHT * cellSize,
        //     0x4444ff, // Brighter blue for primary grid lines
        //     0x222266  // Darker blue for secondary grid lines
        // );
        // gridHelper.rotation.x = Math.PI / 2;
        // this.scene.add(gridHelper);
    }
    
    initGame() {
        // Initialize game state
        this.isRunning = false;
        this.score = 0;
        this.speedLevel = 0;
        
        // Setup input handling
        this.setupInputHandling();
    }
    
    start() {
        // Stop all sounds when starting a new game
        this.soundManager.stopAllSounds();
        
        // Set game state
        this.isRunning = true;
        this.isPaused = false;
        this.score = 0;
        
        // Initialize player snake if it doesn't exist
        if (!this.snakePlayer) {
            this.snakePlayer = new Snake({
                isPlayer: true,
                game: this
            });
            
            // Add the snake to the scene
            this.scene.add(this.snakePlayer.mesh);
            
            console.log("Snake created and added to scene");
        } else {
            // Reset existing snake
            console.log("Resetting existing snake");
            this.snakePlayer.reset();
        }
        
        // Initialize or reset food system
        if (!this.food) {
            this.food = new Food(this);
            console.log("Food system initialized");
        } else {
            this.food.reset();
            console.log("Food system reset");
        }
        
        // Set player speed level
        this.snakePlayer.setSpeedLevel(this.speedLevel);

        // Dispatch initial score
        this.dispatchEvent(new CustomEvent('scoreupdate', { 
            detail: { score: this.score }
        }));
    }

    setupInputHandling() {
        // Handle keyboard input
        document.addEventListener('keydown', (event) => {
            if (!this.isRunning) return;
            
            switch (event.key) {
                case 'ArrowUp':
                    this.snakePlayer.setDirection(CONSTANTS.DIRECTION.UP);
                    break;
                case 'ArrowDown':
                    this.snakePlayer.setDirection(CONSTANTS.DIRECTION.DOWN);
                    break;
                case 'ArrowLeft':
                    this.snakePlayer.setDirection(CONSTANTS.DIRECTION.LEFT);
                    break;
                case 'ArrowRight':
                    this.snakePlayer.setDirection(CONSTANTS.DIRECTION.RIGHT);
                    break;
                case ' ':
                    this.snakePlayer.boost();
                    break;
                case 'p':
                    this.pause();
                    break;
                case 'r':
                    this.resume();
                    break;
            }
        });
        
        // Handle touch input for mobile devices
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (event) => {
            if (!this.isRunning) return;
            
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        });
        
        document.addEventListener('touchmove', (event) => {
            if (!this.isRunning) return;
            
            // Prevent scrolling
            event.preventDefault();
            
            const touchX = event.touches[0].clientX;
            const touchY = event.touches[0].clientY;
            
            // Calculate swipe direction
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Only change direction if swipe is significant
            if (Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20) {
                // Determine primary swipe direction (horizontal or vertical)
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (deltaX > 0) {
                        this.snakePlayer.setDirection(CONSTANTS.DIRECTION.RIGHT);
                    } else {
                        this.snakePlayer.setDirection(CONSTANTS.DIRECTION.LEFT);
                    }
                } else {
                    // Vertical swipe
                    if (deltaY > 0) {
                        this.snakePlayer.setDirection(CONSTANTS.DIRECTION.DOWN);
                    } else {
                        this.snakePlayer.setDirection(CONSTANTS.DIRECTION.UP);
                    }
                }
                
                // Update touch start position for next move
                touchStartX = touchX;
                touchStartY = touchY;
            }
        });
        
        // Double tap for boost
        let lastTapTime = 0;
        document.addEventListener('touchend', (event) => {
            if (!this.isRunning) return;
            
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;
            
            if (tapLength < 300 && tapLength > 0) {
                // Double tap detected
                this.snakePlayer.boost();
                event.preventDefault();
            }
            
            lastTapTime = currentTime;
        });
        
        // Level selection with number keys (1-9)
        document.addEventListener('keydown', (event) => {
            if (this.isRunning) return;
            
            // Check if key is a number between 1-9
            const level = parseInt(event.key);
            if (!isNaN(level) && level >= 1 && level <= 9) {
                this.setSpeedLevel(level - 1); // 0-indexed
                
                // Dispatch event to update UI
                this.dispatchEvent(new CustomEvent('levelchange', { 
                    detail: { 
                        level: level,
                        name: CONSTANTS.SPEED_LEVELS[level - 1].name
                    }
                }));
            }
        });
    }
    
    setSpeedLevel(level) {
        // Ensure level is within valid range
        level = Math.max(0, Math.min(CONSTANTS.SPEED_LEVELS.length - 1, level));
        this.speedLevel = level;
        
        // Update player speed if exists
        if (this.snakePlayer) {
            this.snakePlayer.setSpeedLevel(level);
        }
    }

    update() {
        // Skip update if game is not running or is paused
        if (!this.isRunning || this.isPaused) {
            // Even when not running, render the scene to show the snake
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        // Update player snake
        this.snakePlayer.update();
        
        // Update food system
        this.food.update();
        
        // Check for collisions
        this.checkCollisions();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    checkCollisions() {
        // Check player collisions with food
        const foodEaten = this.food.checkCollision(this.snakePlayer);
        
        // Play sound if food was eaten
        if (foodEaten) {
            this.soundManager.play('eat');
        }
        
        // Check player self-collision
        if (this.snakePlayer.checkSelfCollision()) {
            console.log("Snake hit itself! Game over.");
            this.snakePlayer.die();
        }
        
        // Check boundary collision
        const headPos = this.snakePlayer.getHeadGridPosition();
        if (this.snakePlayer.checkBoundaryCollision(headPos)) {
            this.snakePlayer.die();
            console.log("Snake hit boundary! Game over.");
        }
        if (this.snakePlayer.isDead){
            this.soundManager.play('gameOver');
            this.gameOver();
        }
    }

    gameOver() {
        this.isRunning = false;
        this.isPaused = false;
        
        // Get final score and level
        const finalScore = this.score;
        const finalLevel = this.speedLevel;
        
        // Update high score if needed
        if (finalScore > this.storage.getHighScore()) {
            this.storage.setHighScore(finalScore);
        }
        
        // Dispatch game over event
        this.dispatchEvent(new CustomEvent('gameover', { 
            detail: { 
                score: finalScore,
                level: finalLevel
            }
        }));
        
        console.log(`Game over! Final score: ${finalScore}, Level: ${finalLevel}`);
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            console.log("Game paused");
        }
    }
    
    resume() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            console.log("Game resumed");
        }
    }

    reset() {
        // Stop the game
        this.isRunning = false;
        this.isPaused = false;
        
        // Reset score
        this.score = 0;
        
        // Reset player snake
        if (this.snakePlayer) {
            this.snakePlayer.reset();
        }
        
        // Reset food
        if (this.food) {
            this.food.reset();
        }
        
        // Dispatch event to update UI
        this.dispatchEvent(new CustomEvent('scoreupdate', { 
            detail: { score: this.score }
        }));
        
        console.log("Game reset");
    }

    onResize(width, height) {
        // Update camera aspect ratio
        this.camera.left = Math.max(CONSTANTS.GRID_WIDTH, CONSTANTS.GRID_HEIGHT) * CONSTANTS.CELL_SIZE * width / height / -2;
        this.camera.right = Math.max(CONSTANTS.GRID_WIDTH, CONSTANTS.GRID_HEIGHT) * CONSTANTS.CELL_SIZE * width / height / 2;
        this.camera.top = Math.max(CONSTANTS.GRID_WIDTH, CONSTANTS.GRID_HEIGHT) * CONSTANTS.CELL_SIZE / 2;
        this.camera.bottom = Math.max(CONSTANTS.GRID_WIDTH, CONSTANTS.GRID_HEIGHT) * CONSTANTS.CELL_SIZE / -2;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    dispatchEvent(event) {
        window.dispatchEvent(event);
    }
}
