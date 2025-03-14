class ProgressTracker {
    constructor() {
        this.progress = this.loadProgress();
        this.achievements = {
            'speed_demon': { name: 'Speed Demon', description: 'Complete a challenge in under 2 minutes', icon: '⚡' },
            'perfect_score': { name: 'Perfect Score', description: 'Get all answers correct in a challenge', icon: '🌟' },
            'practice_master': { name: 'Practice Master', description: 'Solve 100 problems in practice mode', icon: '📚' },
            'persistent': { name: 'Persistent', description: 'Complete a challenge without skipping', icon: '💪' }
        };
    }

    loadProgress() {
        const saved = localStorage.getItem('mathGameProgress');
        return saved ? JSON.parse(saved) : {
            totalSolved: 0,
            correctAnswers: 0,
            practiceProblems: 0,
            challengesCompleted: 0,
            bestTimes: {},
            history: [],
            achievements: [],
            lastUpdate: Date.now()
        };
    }

    saveProgress() {
        localStorage.setItem('mathGameProgress', JSON.stringify(this.progress));
    }

    updateStats(gameData) {
        const { mode, difficulty, correct, total, time, skipped } = gameData;
        
        // Update basic stats
        this.progress.totalSolved += total;
        this.progress.correctAnswers += correct;
        
        if (mode === 'practice') {
            this.progress.practiceProblems += total;
        } else {
            this.progress.challengesCompleted++;
            
            // Update best times
            if (!this.progress.bestTimes[difficulty] || time < this.progress.bestTimes[difficulty]) {
                this.progress.bestTimes[difficulty] = time;
            }
        }

        // Add to history
        this.progress.history.push({
            timestamp: Date.now(),
            mode,
            difficulty,
            correct,
            total,
            time
        });

        // Limit history to last 50 entries
        if (this.progress.history.length > 50) {
            this.progress.history = this.progress.history.slice(-50);
        }

        // Check achievements
        this.checkAchievements(gameData);
        
        this.saveProgress();
    }

    checkAchievements(gameData) {
        const { mode, correct, total, time, skipped } = gameData;
        
        // Speed Demon
        if (mode === 'challenge' && time < 120 && !this.hasAchievement('speed_demon')) {
            this.awardAchievement('speed_demon');
        }

        // Perfect Score
        if (mode === 'challenge' && correct === total && !this.hasAchievement('perfect_score')) {
            this.awardAchievement('perfect_score');
        }

        // Practice Master
        if (this.progress.practiceProblems >= 100 && !this.hasAchievement('practice_master')) {
            this.awardAchievement('practice_master');
        }

        // Persistent
        if (mode === 'challenge' && !skipped && !this.hasAchievement('persistent')) {
            this.awardAchievement('persistent');
        }
    }

    hasAchievement(id) {
        return this.progress.achievements.includes(id);
    }

    awardAchievement(id) {
        if (!this.hasAchievement(id)) {
            this.progress.achievements.push(id);
            this.saveProgress();
            
            // Trigger achievement notification
            const achievement = this.achievements[id];
            this.showAchievementNotification(achievement);
        }
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <div class="achievement-text">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    getStats() {
        return {
            totalSolved: this.progress.totalSolved,
            accuracy: this.progress.totalSolved ? 
                Math.round((this.progress.correctAnswers / this.progress.totalSolved) * 100) : 0,
            bestTimes: this.progress.bestTimes,
            recentHistory: this.progress.history.slice(-10),
            achievements: this.progress.achievements.map(id => this.achievements[id])
        };
    }

    updateProgressDisplay() {
        const stats = this.getStats();
        
        // Update basic stats
        document.getElementById('totalSolved').textContent = stats.totalSolved;
        document.getElementById('avgAccuracy').textContent = stats.accuracy + '%';
        document.getElementById('bestTime').textContent = 
            Object.values(stats.bestTimes).length > 0 ? 
            Math.min(...Object.values(stats.bestTimes)) + 's' : '--:--';

        // Update achievements
        const achievementsContainer = document.getElementById('achievements');
        achievementsContainer.innerHTML = stats.achievements.map(achievement => `
            <div class="achievement">
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `).join('');

        // Update progress chart
        this.updateChart(stats.recentHistory);
    }

    updateChart(history) {
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        // Prepare data
        const labels = history.map((_, i) => `Game ${i + 1}`);
        const accuracyData = history.map(h => (h.correct / h.total) * 100);

        // Create or update chart
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Accuracy %',
                    data: accuracyData,
                    borderColor: '#4CAF50',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}
