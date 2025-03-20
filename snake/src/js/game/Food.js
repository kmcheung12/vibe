import * as THREE from 'three';
import { CONSTANTS } from '../utils/Constants.js';

export class Food {
    constructor(game) {
        this.game = game;
        
        // Initialize food properties
        this.orb = null;
        this.orbMesh = null;
        
        // Create food material
        this.foodMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        
        // Create food geometry
        this.foodGeometry = new THREE.SphereGeometry(CONSTANTS.CELL_SIZE / 2, 8, 8);
        
        // Create a group to hold all food orbs
        this.foodGroup = new THREE.Group();
        this.game.scene.add(this.foodGroup);
    }
    
    reset() {
        // Clear existing orb
        this.clearOrb();
        
        // Spawn a new food orb
        this.spawnOrb();
    }
    
    clearOrb() {
        // Remove orb mesh from the scene if it exists
        if (this.orbMesh) {
            this.foodGroup.remove(this.orbMesh);
            this.orbMesh.geometry.dispose();
            if (this.orbMesh.material) this.orbMesh.material.dispose();
        }
        
        // Clear references
        this.orb = null;
        this.orbMesh = null;
    }
    
    spawnOrb() {
        // Only spawn if there is no orb
        if (!this.orb) {
            // Generate random position on the grid
            const halfWidth = Math.floor(CONSTANTS.GRID_WIDTH / 2);
            const halfHeight = Math.floor(CONSTANTS.GRID_HEIGHT / 2);
            
            const gridX = Math.floor(Math.random() * (CONSTANTS.GRID_WIDTH + 1)) - halfWidth;
            const gridY = Math.floor(Math.random() * (CONSTANTS.GRID_HEIGHT + 1)) - halfHeight;
            
            // Create orb object
            this.orb = {
                x: gridX,
                y: gridY,
                value: CONSTANTS.FOOD_VALUE
            };
            
            // Create mesh for the orb
            this.orbMesh = new THREE.Mesh(this.foodGeometry, this.foodMaterial);
            
            // Position the mesh in world coordinates
            this.orbMesh.position.set(
                gridX * CONSTANTS.CELL_SIZE,
                gridY * CONSTANTS.CELL_SIZE,
                0
            );
            
            // Add to scene
            this.foodGroup.add(this.orbMesh);
        }
    }
    
    removeOrb() {
        // Remove the orb mesh from the scene
        if (this.orbMesh) {
            this.foodGroup.remove(this.orbMesh);
            this.orbMesh.geometry.dispose();
            if (this.orbMesh.material) this.orbMesh.material.dispose();
        }
        
        // Clear references
        this.orb = null;
        this.orbMesh = null;
    }
    
    update() {
        // No update logic needed for static food
        
        // Debug: If no orbs, spawn one
        if (!this.orb) {
            this.spawnOrb();
        }
    }
    
    checkCollision(snake) {
        if (!this.orb) return false;
        
        const headPos = snake.getHeadGridPosition();
        
        // Check if snake head is at the same grid position as the orb
        if (headPos.x === this.orb.x && headPos.y === this.orb.y) {
            console.log(`Food eaten at: ${this.orb.x}, ${this.orb.y}`);
            
            // Grow the snake
            snake.grow();
            
            // Update score
            this.game.score += this.orb.value;
            this.game.dispatchEvent(new CustomEvent('scoreupdate', { 
                detail: { score: this.game.score }
            }));
            
            // Remove the eaten orb
            this.removeOrb();
            
            // Spawn a new orb
            this.spawnOrb();
            
            return true;
        }
        
        return false;
    }
    
    getFoodGridPosition() {
        if (this.orb) {
            return this.orb;
        } else {
            return null;
        }
    }
    
    // Utility function to check if a position is occupied by food
    isPositionOccupied(x, y) {
        return this.orb && this.orb.x === x && this.orb.y === y;
    }
}
