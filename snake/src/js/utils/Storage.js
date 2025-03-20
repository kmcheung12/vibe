export class Storage {
    constructor(storageKey = 'slither-clone') {
        this.storageKey = storageKey;
        this.highScoreKey = `${storageKey}-highscore`;
        this.scoresKey = `${storageKey}-scores`;
        this.settingsKey = `${storageKey}-settings`;
    }
    
    // Save a score to local storage
    saveScore(score) {
        // Save high score if it's higher than current
        const currentHighScore = this.getHighScore();
        if (score > currentHighScore) {
            localStorage.setItem(this.highScoreKey, score.toString());
        }
        
        // Add to scores list
        const scores = this.getScores();
        scores.push({
            score: score,
            date: new Date().toISOString()
        });
        
        // Sort scores and keep only top 10
        scores.sort((a, b) => b.score - a.score);
        const topScores = scores.slice(0, 10);
        
        // Save to storage
        localStorage.setItem(this.scoresKey, JSON.stringify(topScores));
    }
    
    // Get the current high score
    getHighScore() {
        const highScore = localStorage.getItem(this.highScoreKey);
        return highScore ? parseInt(highScore) : 0;
    }
    
    // Get all saved scores
    getScores() {
        const scoresJson = localStorage.getItem(this.scoresKey);
        return scoresJson ? JSON.parse(scoresJson) : [];
    }
    
    // Save game settings
    saveSettings(settings) {
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }
    
    // Get game settings
    getSettings() {
        const settingsJson = localStorage.getItem(this.settingsKey);
        const defaultSettings = {
            sound: true,
            vibration: true,
            difficulty: 'normal'
        };
        
        if (settingsJson) {
            return { ...defaultSettings, ...JSON.parse(settingsJson) };
        }
        
        return defaultSettings;
    }
    
    // Clear all game data
    clearData() {
        localStorage.removeItem(this.highScoreKey);
        localStorage.removeItem(this.scoresKey);
        localStorage.removeItem(this.settingsKey);
    }
}
