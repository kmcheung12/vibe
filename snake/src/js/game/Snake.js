import * as THREE from 'three';
import { CONSTANTS } from '../utils/Constants.js';

export class Snake {
    constructor(options = {}) {
        this.isPlayer = options.isPlayer || false;
        this.game = options.game;
        
        // Initialize movement properties
        this.initialize();
        
        // Create shared geometry and materials for segments
        this.initGeometryAndMaterials();
        
        // Create the snake mesh
        this.createSnake();
        
        console.log("Snake mesh created:", this.mesh);
        console.log("Snake mesh position:", this.mesh.position);
    }
    
    initialize() {
        // Initialize arrays to store segments
        this.segments = [];
        this.positions = [];
        
        // Initialize movement properties
        this.direction = { ...CONSTANTS.DIRECTION.RIGHT };
        this.nextDirection = { ...CONSTANTS.DIRECTION.RIGHT };
        this.moveTimer = 0;
        this.lastMoveTime = Date.now();
        this.moveInterval = CONSTANTS.MOVE_INTERVAL;
        this.speedLevel = 0;
        
        // Initialize boost properties
        this.isBoosting = false;
        this.boostTime = 0;
        this.boostCooldown = 0;
        
        // Initialize state
        this.isDead = false;
    }
    
    initGeometryAndMaterials() {
        // Create shared geometry for all segments
        this.segmentGeometry = new THREE.BoxGeometry(
            CONSTANTS.CELL_SIZE * 0.9, 
            CONSTANTS.CELL_SIZE * 0.9, 
            CONSTANTS.CELL_SIZE * 0.9
        );
        
        // Create shared material for player snake
        this.playerMaterial = new THREE.MeshBasicMaterial({
            color: CONSTANTS.SNAKE_COLORS.PLAYER_ALIVE
        });
        
        // Create shared material for bot snakes
        this.botMaterial = new THREE.MeshBasicMaterial({
            color: CONSTANTS.SNAKE_COLORS.BOT_ALIVE
        });
    }

    reset() {
        // Clean up existing segments
        if (this.mesh) {
            while (this.mesh.children.length > 0) {
                const segment = this.mesh.children[0];
                this.mesh.remove(segment);
            }
        }
        
        // Reset internal state
        this.initialize();
        
        // Create new snake
        this.createSnake();
        
        console.log("Snake reset completed");
        console.log("Snake mesh children count:", this.mesh.children.length);
    }

    createSnake() {
        // Create a group to hold the snake segments if it doesn't exist
        if (!this.mesh) {
            this.mesh = new THREE.Group();
            this.mesh.position.set(0, 0, 0);
        }
        
        // Create snake head using the shared geometry and material
        const head = new THREE.Mesh(this.segmentGeometry, this.isPlayer ? this.playerMaterial : this.botMaterial);
        
        // Position the head relative to the group
        // Since the group is at (0,0,0), the head's position is absolute
        // Set z=0 to ensure visibility above the grid
        head.position.set(0, 0, 0);
        
        console.log(`Snake head created at grid position: 0, 0`);
        console.log(`Snake head world position: ${head.position.x}, ${head.position.y}, ${head.position.z}`);
        
        // Store grid position for game logic
        this.positions.push({ x: 0, y: 0 });
        
        // Add head to segments array and to the group
        this.segments.push(head);
        this.mesh.add(head);
        
        console.log("Total objects in group:", this.mesh.children.length);
    }

    update() {
        // Calculate time since last move
        const now = Date.now();
        const deltaTime = now - this.lastMoveTime;
        
        // Calculate move interval based on boost state and speed level
        const currentMoveInterval = this.isBoosting ? 
            this.moveInterval / CONSTANTS.BOOST_MULTIPLIER : 
            this.moveInterval;
        
        // Move snake at fixed intervals
        if (deltaTime >= currentMoveInterval) {
            this.lastMoveTime = now;
            this.move();
        }
    }
    
    move() {
        // Apply the next direction
        this.direction = { ...this.nextDirection };
        
        // Save previous positions for body segments to follow
        const prevPositions = this.positions.map(pos => ({ ...pos }));
        
        // Move head to new position
        const head = this.positions[0];
        const newHeadPos = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        
        // Check boundary collision
        if (this.checkBoundaryCollision(newHeadPos)) {
            // Handle boundary collision
            if (this.isPlayer) {
                // For player, die
                this.die();
            } else {
                // For bots, change direction
                this.changeRandomDirection();
                return; // Skip this move
            }
        }
        
        // Update head position
        this.positions[0] = newHeadPos;
        
        // Move body segments to follow the head (each segment takes the previous position of the segment in front of it)
        for (let i = 1; i < this.positions.length; i++) {
            this.positions[i] = prevPositions[i - 1];
        }
        
        // Update visual position
        this.updateSegmentVisuals();
        
        // Check for self-collision (head hitting body)
        this.checkSelfCollision();
    }
    
    updateSegmentVisuals() {
        // Update the visual position of all segments
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const position = this.positions[i];
            
            // Set target position
            const targetX = position.x * CONSTANTS.CELL_SIZE;
            const targetY = position.y * CONSTANTS.CELL_SIZE;
            
            // Update position - each segment's position is relative to the group
            segment.position.x = targetX;
            segment.position.y = targetY;
            segment.position.z = 0; // Keep z-position consistent
        }
    }
    
    checkBoundaryCollision(position) {
        return (
            position.x < -CONSTANTS.GRID_WIDTH / 2 ||
            position.x >= CONSTANTS.GRID_WIDTH / 2 + 1||
            position.y < -CONSTANTS.GRID_HEIGHT / 2 ||
            position.y >= CONSTANTS.GRID_HEIGHT / 2 + 1
        );
    }

    updateBoostState(deltaTime) {
        // Update boost cooldown
        if (this.boostCooldown > 0) {
            this.boostCooldown -= deltaTime;
        }
        
        // Update active boost time
        if (this.isBoosting) {
            this.boostTime -= deltaTime;
            
            // End boost if time is up
            if (this.boostTime <= 0) {
                this.isBoosting = false;
                this.boostCooldown = CONSTANTS.BOOST_COOLDOWN;
            }
        }
    }
    
    updateVisualEffects() {
        // Simplified - no visual effects
    }

    setDirection(direction) {
        // Prevent 180-degree turns (can't go directly backwards)
        if (
            (direction.x === -this.direction.x && direction.y === -this.direction.y) ||
            (direction.x === this.direction.x && direction.y === this.direction.y)
        ) {
            return;
        }
        
        // Set the next direction to turn on the next move
        this.nextDirection = { ...direction };
    }
    
    changeRandomDirection() {
        // Choose a random direction that's not the opposite of current direction
        const directions = Object.values(CONSTANTS.DIRECTION);
        let newDirection;
        
        do {
            newDirection = directions[Math.floor(Math.random() * directions.length)];
        } while (
            newDirection.x === -this.direction.x && 
            newDirection.y === -this.direction.y
        );
        
        this.setDirection(newDirection);
    }

    grow(amount = 1) {
        // Add new segments at the tail position
        for (let i = 0; i < amount; i++) {
            // Get the current tail position
            const tail = this.positions[this.positions.length - 1];
            
            // Create a new segment using the shared geometry and material
            const segment = new THREE.Mesh(this.segmentGeometry, this.isPlayer ? this.playerMaterial : this.botMaterial);
            
            // Position at the tail
            segment.position.x = tail.x * CONSTANTS.CELL_SIZE;
            segment.position.y = tail.y * CONSTANTS.CELL_SIZE;
            segment.position.z = 0; // Consistent z-position with other segments
            
            // Add to arrays
            this.positions.push({ ...tail });
            this.segments.push(segment);
            this.mesh.add(segment);
            
            console.log(`Snake grew to length: ${this.segments.length}`);
        }
    }

    boost() {
        // Only allow boost if not on cooldown
        if (this.boostCooldown <= 0 && !this.isBoosting) {
            this.isBoosting = true;
            this.boostTime = CONSTANTS.BOOST_DURATION;
        }
    }

    getRandomColor() {
        const colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff88, 0x0088ff];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    checkCollision(position) {
        // Convert world position to grid position
        const gridX = Math.round(position.x / CONSTANTS.CELL_SIZE);
        const gridY = Math.round(position.y / CONSTANTS.CELL_SIZE);
        
        // Check if head is at this position
        const head = this.positions[0];
        return head.x === gridX && head.y === gridY;
    }
    
    checkSelfCollision() {
        // Only check if snake has more than 2 segments
        if (this.positions.length <= 2 || this.isDead) return false;
        
        const head = this.positions[0];
        
        // Check if head position matches any body segment position
        // Start from index 2 to skip the segment immediately behind the head
        // This prevents false collisions during normal movement
        for (let i = 2; i < this.positions.length; i++) {
            const segment = this.positions[i];
            if (head.x === segment.x && head.y === segment.y) {
                console.log("Snake collided with itself!");
                this.die();
                return true;
            }
        }
        
        return false;
    }
    
    getHeadGridPosition() {
        if (this.positions.length === 0) return { x: 0, y: 0 };
        
        // Return the grid position of the head (first element in positions array)
        return this.positions[0];
    }
    
    getHeadWorldPosition() {
        if (this.segments.length === 0) return { x: 0, y: 0, z: 0 };
        
        const head = this.segments[0];
        
        // Get the world position by combining the group position and the head position
        return { 
            x: this.mesh.position.x + head.position.x, 
            y: this.mesh.position.y + head.position.y, 
            z: this.mesh.position.z + head.position.z 
        };
    }

    setSpeedLevel(level) {
        this.speedLevel = level;
        this.moveInterval = CONSTANTS.MOVE_INTERVAL * (1 - (level * 0.1));
        console.log(`Snake speed level set to ${level}, move interval: ${this.moveInterval}ms`);
    }
    
    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        
        // Change color of all segments to indicate death
        this.segments.forEach(segment => {
            segment.material.color.set(
                this.isPlayer ? 
                CONSTANTS.SNAKE_COLORS.PLAYER_DEAD : 
                CONSTANTS.SNAKE_COLORS.BOT_DEAD
            );
        });
    }
}
