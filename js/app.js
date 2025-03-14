// Initialize game components
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    // Handle skip problem event
    document.addEventListener('skip-problem', () => {
        game.skipProblem();
    });

    // Handle view progress event
    document.addEventListener('view-progress', () => {
        game.showProgress();
    });
});
