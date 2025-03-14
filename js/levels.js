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
    sequenceOne: {
        type: 'sequence_one',
        generator: () => {
            const isAscending = Math.random() < 0.5;
            const step = 1;
            const len = 4;
            const offset = step * len;
            // For ascending: start + 4 <= 100
            // For descending: start - 4 >= 0
            const start = isAscending 
                ? Math.floor(Math.random() * (100 - offset))  // 0 to 96
                : Math.floor(Math.random() * (100 - offset)) + offset; // 4 to 100
            const sequence = Array.from({length: 4}, (_, i) => 
                isAscending ? start + i : start - i
            );
            return {
                question: `What comes next? ${sequence.join(', ')}, ?`,
                answer: isAscending ? start + offset : start - offset
            };
        }
    },
    sequenceTwo: {
        type: 'sequence_two',
        generator: () => {
            const isAscending = Math.random() < 0.5;
            const step = 2;
            const len = 4;
            const offset = step * len;
            // For ascending: start + (4 * 2) <= 100
            // For descending: start - (4 * 2) >= 0
            const start = isAscending 
                ? Math.floor(Math.random() * (100 - offset))  // 0 to 92
                : Math.floor(Math.random() * (100 - offset)) + offset; // 8 to 100
            const sequence = Array.from({length: 4}, (_, i) => 
                isAscending ? start + (i * step) : start - (i * step)
            );
            return {
                question: `What comes next? ${sequence.join(', ')}, ?`,
                answer: isAscending ? start + offset : start - offset
            };
        }
    },
    sequenceFive: {
        type: 'sequence_five',
        generator: () => {
            const isAscending = Math.random() < 0.5;
            const step = 5;
            const len = 4;
            const offset = step * len;
            // For ascending: start + (4 * 5) <= 100
            // For descending: start - (4 * 5) >= 0
            const start = isAscending 
                ? Math.floor(Math.random() * (100 - offset))  // 0 to 80
                : Math.floor(Math.random() * (100 - offset)) + offset; // 20 to 100
            const sequence = Array.from({length: 4}, (_, i) => 
                isAscending ? start + (i * step) : start - (i * step)
            );
            return {
                question: `What comes next? ${sequence.join(', ')}, ?`,
                answer: isAscending ? start + offset : start - offset
            };
        }
    },
    sequenceTen: {
        type: 'sequence_ten',
        generator: () => {
            const isAscending = Math.random() < 0.5;
            const step = 10;
            const len = 4;
            const offset = step * len;
            // For ascending: start + (4 * 10) <= 100
            // For descending: start - (4 * 10) >= 0
            const start = isAscending 
                ? Math.floor(Math.random() * (100 - offset))  // 0 to 60
                : Math.floor(Math.random() * (100 - offset)) + offset; // 40 to 100
            const sequence = Array.from({length: 4}, (_, i) => 
                isAscending ? start + (i * step) : start - (i * step)
            );
            return {
                question: `What comes next? ${sequence.join(', ')}, ?`,
                answer: isAscending ? start + offset : start - offset
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
    grade1_1: {
        name: 'Grade 1 - 1',
        problems: [
            CONCEPTS.sequenceOne,
            CONCEPTS.sequenceTwo
        ]
    },
    grade1_2: {
        name: 'Grade 1 - 2',
        problems: [
            CONCEPTS.sequenceTwo,
            CONCEPTS.sequenceFive,
            CONCEPTS.sequenceTen
        ]
    },
    grade1_3: {
        name: 'Grade 1 - 3',
        problems: [
            CONCEPTS.addition,
            CONCEPTS.subtraction,
            CONCEPTS.sequenceFive
        ]
    },
    grade2_1: {
        name: 'Grade 2 - 1',
        problems: [
            CONCEPTS.multiplication,
            CONCEPTS.division,
            CONCEPTS.money
        ]
    },
    grade3_1: {
        name: 'Grade 3 - 1',
        problems: [
            CONCEPTS.fractions,
            CONCEPTS.time,
            CONCEPTS.wordProblems
        ]
    }
};
