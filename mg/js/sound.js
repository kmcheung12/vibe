class SoundManager {
    constructor() {
        this.correctSound = new Audio('sounds/correct.mp3');
        this.incorrectSound = new Audio('sounds/incorrect.mp3');
        this.completeSound = new Audio('sounds/complete.mp3');
    }

    playCorrect() {
        this.correctSound.currentTime = 0;
        this.correctSound.play();
    }

    playIncorrect() {
        this.incorrectSound.currentTime = 0;
        this.incorrectSound.play();
    }

    playComplete() {
        this.completeSound.currentTime = 0;
        this.completeSound.play();
    }
}
