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
                answer: num1 + num2,
                visualization: {
                    type: 'blocks',
                    values: { num1, num2 }
                }
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
                answer: num1 - num2,
                visualization: {
                    type: 'blocks',
                    values: { num1, num2 }
                }
            };
        }
    },
    sequenceOne: {
        type: 'sequence_one',
        generator: () => {
            const isAscending = Math.random() < 0.5;
            const multiple = 1;
            const limit = 100;
            const len = 4;
            const offset = multiple * len;
            const start = isAscending 
                ? Math.floor(Math.random() * (limit/multiple - len)) * multiple  // 0 to 96
                : offset + (Math.floor(Math.random() * (limit/multiple - len)) * multiple); // 4 to 100
            const sequence = Array.from({length: len}, (_, i) => 
                isAscending ? start + (i * multiple) : start - (i * multiple)
            );
            return {
                question: `What comes next in this ${isAscending ? 'increasing' : 'decreasing'} sequence ${sequence.join(', ')}, _`,
                answer: isAscending ? start + (len * multiple) : start - (len * multiple),
                explanation: `This is a sequence that ${isAscending ? 'increases' : 'decreases'} by ${multiple} each time. Each number is ${isAscending ? 'adding' : 'subtracting'} ${multiple} to get the next number.`,
                visualization: {
                    type: 'numberLine',
                    values: {
                        sequence,
                        stepSize: multiple,
                        isAscending
                    }
                }
            };
        }
    },
    sequenceTwo: {
        type: 'sequence_two',
        generator: () => {
            const isAscending = Math.random() < 0.5;
            const multiple = 2;
            const limit = 100;
            const len = 4;
            const offset = multiple * len;
            const start = isAscending 
                ? Math.floor(Math.random() * (limit/multiple - len)) * multiple  // 0 to 92
                : offset + (Math.floor(Math.random() * (limit/multiple - len)) * multiple); // 8 to 100
            const sequence = Array.from({length: len}, (_, i) => 
                isAscending ? start + (i * multiple) : start - (i * multiple)
            );
            return {
                question: `What comes next in this ${isAscending ? 'increasing' : 'decreasing'} sequence ${sequence.join(', ')}, _`,
                answer: isAscending ? start + (len * multiple) : start - (len * multiple),
                explanation: `This is a sequence of even numbers that ${isAscending ? 'increases' : 'decreases'} by ${multiple} each time. Each number is ${isAscending ? 'adding' : 'subtracting'} ${multiple} to get the next number.`,
                visualization: {
                    type: 'numberLine',
                    values: {
                        sequence,
                        stepSize: multiple,
                        isAscending
                    }
                }
            };
        }
    },
    sequenceFive: {
        type: 'sequence_five',
        generator: () => {
            const isAscending = Math.random() < 0.5;
            const multiple = 5;
            const limit = 100;
            const len = 4;
            const offset = multiple * len;
            const start = isAscending 
                ? Math.floor(Math.random() * (limit/multiple - len)) * multiple  // 0 to 80
                : offset + (Math.floor(Math.random() * (limit/multiple - len)) * multiple); // 20 to 100
            const sequence = Array.from({length: len}, (_, i) => 
                isAscending ? start + (i * multiple) : start - (i * multiple)
            );
            return {
                question: `What comes next in this ${isAscending ? 'increasing' : 'decreasing'} sequence ${sequence.join(', ')}, _`,
                answer: isAscending ? start + (len * multiple) : start - (len * multiple),
                explanation: `This is a sequence that counts by ${multiple}s. Each number is ${isAscending ? 'adding' : 'subtracting'} ${multiple} to get the next number.`,
                visualization: {
                    type: 'numberLine',
                    values: {
                        sequence,
                        stepSize: multiple,
                        isAscending
                    }
                }
            };
        }
    },
    sequenceTen: {
        type: 'sequence_ten',
        generator: () => {
            const isAscending = Math.random() < 0.5;
            const multiple = 10;
            const limit = 100;
            const len = 4;
            const offset = multiple * len;
            const start = isAscending 
                ? Math.floor(Math.random() * (limit/multiple - len)) * multiple  // 0 to 60
                : offset + (Math.floor(Math.random() * (limit/multiple - len)) * multiple); // 40 to 100
            const sequence = Array.from({length: len}, (_, i) => 
                isAscending ? start + (i * multiple) : start - (i * multiple)
            );
            return {
                question: `What comes next in this ${isAscending ? 'increasing' : 'decreasing'} sequence ${sequence.join(', ')}, _`,
                answer: isAscending ? start + (len * multiple) : start - (len * multiple),
                explanation: `This is a sequence that counts by ${multiple}s. Each number is ${isAscending ? 'adding' : 'subtracting'} ${multiple} to get the next number.`,
                visualization: {
                    type: 'numberLine',
                    values: {
                        sequence,
                        stepSize: multiple,
                        isAscending
                    }
                }
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
                answer: num1 * num2,
                visualization: {
                    type: 'arrays',
                    values: { num1, num2 }
                }
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
                answer: quotient,
                visualization: {
                    type: 'groups',
                    values: { divisor, quotient }
                }
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
                answer: dollars * 100 + cents,
                visualization: {
                    type: 'money',
                    values: { dollars, cents }
                }
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
                answer: Number(wholeNumber + numerator/denominator).toFixed(1),
                visualization: {
                    type: 'fractions',
                    values: { numerator, denominator, wholeNumber }
                }
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
                answer: minutes,
                visualization: {
                    type: 'clock',
                    values: { hours, minutes }
                }
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
                answer: price * quantity,
                visualization: {
                    type: 'groups',
                    values: { price, quantity }
                }
            };
        }
    },
    numberBondsTen: {
        type: 'number_bonds_ten',
        generator: () => {
            const total = 10;
            const known = Math.floor(Math.random() * 11); // 0 to 10
            const unknown = total - known;
            const isFirstNumber = Math.random() < 0.5;
            
            return {
                question: isFirstNumber 
                    ? `_ + ${known} = ${total}`
                    : `${known} + _ = ${total}`,
                answer: unknown,
                explanation: `${unknown} + ${known} = ${total} or ${known} + ${unknown} = ${total}. These numbers add up to ${total}.`,
                visualization: {
                    type: 'blocks',
                    values: { 
                        num1: isFirstNumber ? unknown : known,
                        num2: isFirstNumber ? known : unknown,
                        total
                    }
                }
            };
        }
    },
    numberBondsTwenty: {
        type: 'number_bonds_twenty',
        generator: () => {
            const total = 20;
            const known = Math.floor(Math.random() * 21); // 0 to 20
            const unknown = total - known;
            const isFirstNumber = Math.random() < 0.5;
            
            return {
                question: isFirstNumber 
                    ? `_ + ${known} = ${total}`
                    : `${known} + _ = ${total}`,
                answer: unknown,
                explanation: `${unknown} + ${known} = ${total} or ${known} + ${unknown} = ${total}. These numbers add up to ${total}.`,
                visualization: {
                    type: 'blocks',
                    values: { 
                        num1: isFirstNumber ? unknown : known,
                        num2: isFirstNumber ? known : unknown,
                        total
                    }
                }
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
            CONCEPTS.numberBondsTen
        ]
    },
    grade1_4: {
        name: 'Grade 1 - 4',
        problems: [
            CONCEPTS.numberBondsTen,
            CONCEPTS.numberBondsTwenty
        ]
    },
    grade1_5: {
        name: 'Grade 1 - 5',
        problems: [
            CONCEPTS.addition,
            CONCEPTS.subtraction,
            CONCEPTS.numberBondsTwenty
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
