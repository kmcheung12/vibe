import * as THREE from 'three';
import { Snake } from './Snake.js';
import { CONSTANTS } from '../utils/Constants.js';

export class BotAI {
    constructor(game) {
        this.game = game;
        this.bots = [];
        this.botUpdateTimer = 0;
        this.init();
    }
    
    init() {
        // Create initial bots
        for (let i = 0; i < CONSTANTS.INITIAL_BOT_COUNT; i++) {
            this.spawnBot();
        }
    }
    
    spawnBot() {
        // Create a new bot snake
        const bot = new Snake({
            isPlayer: false,
            game: this.game
        });
        
        // Set random starting position
        const gridPosition = this.getRandomSpawnPosition();
        
        // Position all segments at the spawn point initially
        for (let i = 0; i < bot.positions.length; i++) {
            bot.positions[i] = { ...gridPosition };
        }
        
        // Update visual positions
        bot.updateSegmentVisuals();
        
        // Set random initial direction
        bot.changeRandomDirection();
        
        // Add to game scene
        this.game.scene.add(bot.mesh);
        
        // Add to bots array
        this.bots.push(bot);
        
        // Set random behavior
        bot.behavior = this.getRandomBehavior();
        
        // Set target update interval
        bot.targetUpdateTime = 0;
        bot.targetUpdateInterval = 500 + Math.random() * 1000; // 0.5-1.5 seconds
        
        return bot;
    }
    
    getRandomSpawnPosition() {
        // Generate random grid position away from player
        const halfWidth = Math.floor(CONSTANTS.GRID_WIDTH / 2);
        const halfHeight = Math.floor(CONSTANTS.GRID_HEIGHT / 2);
        
        // Get player position
        const playerPos = this.game.player.getHeadGridPosition();
        
        // Generate position until we find one far enough from player
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * CONSTANTS.GRID_WIDTH) - halfWidth,
                y: Math.floor(Math.random() * CONSTANTS.GRID_HEIGHT) - halfHeight
            };
            
            // Calculate Manhattan distance to player
            const distance = Math.abs(position.x - playerPos.x) + Math.abs(position.y - playerPos.y);
            
            // Accept if far enough away
            if (distance > CONSTANTS.GRID_WIDTH / 4) {
                break;
            }
        } while (true);
        
        return position;
    }
    
    getRandomBehavior() {
        const behaviors = ['passive', 'aggressive', 'random'];
        return behaviors[Math.floor(Math.random() * behaviors.length)];
    }
    
    update() {
        // Update each bot
        this.bots.forEach(bot => {
            // Update bot movement
            bot.update();
            
            // Check for self collision
            if (bot.checkSelfCollision()) {
                this.removeBot(bot);
                return;
            }
            
            // Update target periodically
            const now = Date.now();
            if (now - bot.targetUpdateTime > bot.targetUpdateInterval) {
                bot.targetUpdateTime = now;
                
                // Update target based on behavior
                this.updateBotTarget(bot);
            }
        });
        
        // Check if we need to spawn more bots
        if (this.bots.length < CONSTANTS.INITIAL_BOT_COUNT) {
            this.spawnBot();
        }
    }
    
    updateBotTarget(bot) {
        // Get current head position
        const headPos = bot.getHeadGridPosition();
        
        // Check for nearby obstacles to avoid
        const avoidDirection = this.getObstacleAvoidanceDirection(bot, headPos);
        
        // If there's an obstacle nearby, prioritize avoiding it
        if (avoidDirection) {
            bot.setDirection(avoidDirection);
            
            // Use boost to escape if needed
            if (Math.random() < 0.3) {
                bot.boost();
            }
            
            return;
        }
        
        // Otherwise, follow behavior
        switch (bot.behavior) {
            case 'passive':
                this.passiveBehavior(bot, headPos);
                break;
            case 'aggressive':
                this.aggressiveBehavior(bot, headPos);
                break;
            case 'random':
                this.randomBehavior(bot);
                break;
        }
    }
    
    getObstacleAvoidanceDirection(bot, headPos) {
        // Check for nearby snakes (both player and other bots)
        const avoidanceThreshold = CONSTANTS.BOT_AVOIDANCE_DISTANCE;
        let closestObstacleDistance = Infinity;
        let avoidanceDirection = null;
        
        // Check player snake
        const playerHeadPos = this.game.player.getHeadGridPosition();
        
        // Calculate Manhattan distance to player
        const distanceToPlayer = Math.abs(headPos.x - playerHeadPos.x) + 
                                Math.abs(headPos.y - playerHeadPos.y);
        
        if (distanceToPlayer < avoidanceThreshold) {
            closestObstacleDistance = distanceToPlayer;
            
            // Determine direction to move away from player
            avoidanceDirection = this.getAvoidanceDirection(headPos, playerHeadPos);
        }
        
        // Check other bots
        this.bots.forEach(otherBot => {
            if (otherBot === bot) return; // Skip self
            
            const otherHeadPos = otherBot.getHeadGridPosition();
            
            // Calculate Manhattan distance
            const distance = Math.abs(headPos.x - otherHeadPos.x) + 
                            Math.abs(headPos.y - otherHeadPos.y);
            
            if (distance < avoidanceThreshold && distance < closestObstacleDistance) {
                closestObstacleDistance = distance;
                
                // Determine direction to move away from other bot
                avoidanceDirection = this.getAvoidanceDirection(headPos, otherHeadPos);
            }
        });
        
        return avoidanceDirection;
    }
    
    getAvoidanceDirection(fromPos, obstaclePos) {
        // Determine best direction to move away from obstacle
        
        // Calculate differences
        const dx = fromPos.x - obstaclePos.x;
        const dy = fromPos.y - obstaclePos.y;
        
        // Determine primary axis to move along (x or y)
        if (Math.abs(dx) > Math.abs(dy)) {
            // Move horizontally
            return dx > 0 ? CONSTANTS.DIRECTION.RIGHT : CONSTANTS.DIRECTION.LEFT;
        } else {
            // Move vertically
            return dy > 0 ? CONSTANTS.DIRECTION.UP : CONSTANTS.DIRECTION.DOWN;
        }
    }
    
    passiveBehavior(bot, headPos) {
        // Find nearest food and move towards it
        const nearestOrb = this.game.food.getNearestOrb(headPos);
        
        if (nearestOrb) {
            // Determine direction to food
            const targetDirection = this.getDirectionToTarget(headPos, nearestOrb.position);
            bot.setDirection(targetDirection);
            
            // Occasionally use boost to catch food
            if (nearestOrb.distance < 5 && Math.random() < 0.1) {
                bot.boost();
            }
        } else {
            // No food found, move randomly
            this.randomBehavior(bot);
        }
    }
    
    aggressiveBehavior(bot, headPos) {
        // Get player position
        const playerPos = this.game.player.getHeadGridPosition();
        
        // Calculate Manhattan distance to player
        const distanceToPlayer = Math.abs(headPos.x - playerPos.x) + 
                                Math.abs(headPos.y - playerPos.y);
        
        // If player is within targeting distance, chase them
        if (distanceToPlayer < CONSTANTS.BOT_TARGETING_DISTANCE) {
            // Determine direction to player
            const targetDirection = this.getDirectionToTarget(headPos, playerPos);
            bot.setDirection(targetDirection);
            
            // Use boost to catch up to player
            if (distanceToPlayer < 10 && Math.random() < 0.2) {
                bot.boost();
            }
        } else {
            // Player too far, behave like passive bot
            this.passiveBehavior(bot, headPos);
        }
    }
    
    randomBehavior(bot) {
        // Randomly change direction occasionally
        if (Math.random() < 0.2) {
            bot.changeRandomDirection();
        }
        
        // Randomly boost
        if (Math.random() < 0.05) {
            bot.boost();
        }
    }
    
    getDirectionToTarget(fromPos, targetPos) {
        // Determine best direction to move towards target
        
        // Calculate differences
        const dx = targetPos.x - fromPos.x;
        const dy = targetPos.y - fromPos.y;
        
        // Determine primary axis to move along (x or y)
        if (Math.abs(dx) > Math.abs(dy)) {
            // Move horizontally
            return dx > 0 ? CONSTANTS.DIRECTION.RIGHT : CONSTANTS.DIRECTION.LEFT;
        } else {
            // Move vertically
            return dy > 0 ? CONSTANTS.DIRECTION.UP : CONSTANTS.DIRECTION.DOWN;
        }
    }
    
    checkCollisions(snake) {
        // Check if player collides with any bot
        const headPos = snake.getHeadGridPosition();
        
        for (let i = 0; i < this.bots.length; i++) {
            const bot = this.bots[i];
            
            // Check each segment of the bot
            for (let j = 0; j < bot.positions.length; j++) {
                const segment = bot.positions[j];
                
                // Check if player head collides with bot segment
                if (headPos.x === segment.x && headPos.y === segment.y) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    removeBot(bot) {
        // Remove bot from scene
        this.game.scene.remove(bot.mesh);
        
        // Remove from bots array
        const index = this.bots.indexOf(bot);
        if (index !== -1) {
            this.bots.splice(index, 1);
        }
    }
    
    reset() {
        // Remove all bots
        this.bots.forEach(bot => {
            this.game.scene.remove(bot.mesh);
        });
        
        this.bots = [];
        
        // Create new bots
        this.init();
    }
}
