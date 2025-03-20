/**
 * SoundManager class for handling game audio
 */
export class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.initialized = false;
    }
    
    /**
     * Initialize the sound manager with required sounds
     */
    init() {
        if (this.initialized) return;
        
        // Create audio elements for each sound
        this.sounds.eat = new Audio();
        this.sounds.eat.src = 'assets/sounds/eat.mp3';
        this.sounds.eat.volume = 0.5;
        
        this.sounds.gameOver = new Audio();
        this.sounds.gameOver.src = 'assets/sounds/game-over.mp3'; 
        this.sounds.gameOver.volume = 0.7; 
        
        // Preload sounds
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
        
        this.initialized = true;
        console.log('Sound manager initialized with game over sound');
    }
    
    /**
     * Play a sound by name
     * @param {string} soundName - The name of the sound to play
     */
    play(soundName) {
        if (this.muted || !this.initialized) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Reset the sound to the beginning if it's already playing
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn(`Error playing sound ${soundName}:`, error);
            });
        } else {
            console.warn(`Sound ${soundName} not found`);
        }
    }
    
    /**
     * Stop all currently playing sounds
     */
    stopAllSounds() {
        if (!this.initialized) return;
        
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        
        console.log('All sounds stopped');
    }
    
    /**
     * Toggle mute state
     * @returns {boolean} - New mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
    
    /**
     * Set mute state
     * @param {boolean} state - Mute state to set
     */
    setMute(state) {
        this.muted = state;
    }
}
