// Math concepts organized by type
const CONCEPTS = {
    addition: {
        type: 'addition',
        range: { min: 0, max: 20 },
        generator: () => {
            const num1 = Math.floor(Math.random() * 11);
            const num2 = Math.floor(Math.random() * (20 - num1));
            return {
                question: `${num1} + ${num2} = ?`,
                answer: num1 + num2
            };
        }
    },
    subtraction: {
        type: 'subtraction',
        range: { min: 0, max: 20 },
        generator: () => {
            const num1 = Math.floor(Math.random() * 20) + 1;
            const num2 = Math.floor(Math.random() * num1);
            return {
                question: `${num1} - ${num2} = ?`,
                answer: num1 - num2
            };
        }
    },
    sequence: {
        type: 'sequence',
        generator: () => {
            const start = Math.floor(Math.random() * 5) + 1;
            const step = Math.floor(Math.random() * 3) + 1;
            const sequence = Array.from({length: 4}, (_, i) => start + (step * i));
            return {
                question: `What comes next? ${sequence.join(', ')}, ?`,
                answer: start + (step * 4)
            };
        }
    },
    multiplication: {
        type: 'multiplication',
        range: { min: 0, max: 100 },
        generator: () => {
            const num1 = Math.floor(Math.random() * 11);
            const num2 = Math.floor(Math.random() * 11);
            return {
                question: `${num1} × ${num2} = ?`,
                answer: num1 * num2
            };
        }
    },
    division: {
        type: 'division',
        generator: () => {
            const divisor = Math.floor(Math.random() * 9) + 1;
            const quotient = Math.floor(Math.random() * 10) + 1;
            const dividend = divisor * quotient;
            return {
                question: `${dividend} ÷ ${divisor} = ?`,
                answer: quotient
            };
        }
    },
    money: {
        type: 'money',
        generator: () => {
            const dollars = Math.floor(Math.random() * 20) + 1;
            const cents = Math.floor(Math.random() * 100);
            return {
                question: `How many cents in $${dollars}.${cents.toString().padStart(2, '0')}?`,
                answer: dollars * 100 + cents
            };
        }
    },
    fractions: {
        type: 'fractions',
        generator: () => {
            const denominator = Math.floor(Math.random() * 8) + 2;
            const numerator = Math.floor(Math.random() * denominator) + 1;
            const wholeNumber = Math.floor(Math.random() * 5) + 1;
            return {
                question: `${wholeNumber} + ${numerator}/${denominator} = ? (Convert to decimal, round to 1 decimal place)`,
                answer: Number(wholeNumber + numerator/denominator).toFixed(1)
            };
        }
    },
    time: {
        type: 'time',
        generator: () => {
            const hours = Math.floor(Math.random() * 12) + 1;
            const minutes = Math.floor(Math.random() * 60);
            return {
                question: `If it's ${hours}:${minutes.toString().padStart(2, '0')}, how many minutes past ${hours}:00?`,
                answer: minutes
            };
        }
    },
    wordProblems: {
        type: 'word_problems',
        generator: () => {
            const items = ['apples', 'oranges', 'books', 'pencils'];
            const item = items[Math.floor(Math.random() * items.length)];
            const price = Math.floor(Math.random() * 5) + 1;
            const quantity = Math.floor(Math.random() * 10) + 1;
            return {
                question: `If one ${item} costs $${price}, how much do ${quantity} ${item} cost?`,
                answer: price * quantity
            };
        }
    }
};

// Levels organized by difficulty, referencing concepts
const LEVELS = {
    easy: {
        name: 'Easy (Grade 1)',
        problems: [
            CONCEPTS.addition,
            CONCEPTS.subtraction,
            CONCEPTS.sequence
        ]
    },
    medium: {
        name: 'Medium (Grade 2)',
        problems: [
            CONCEPTS.multiplication,
            CONCEPTS.division,
            CONCEPTS.money
        ]
    },
    hard: {
        name: 'Hard (Grade 3)',
        problems: [
            CONCEPTS.fractions,
            CONCEPTS.time,
            CONCEPTS.wordProblems
        ]
    }
};
