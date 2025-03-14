class Visualization {
    constructor() {
        this.numberLine = document.getElementById('numberLine');
        this.blocksContainer = document.getElementById('blocksContainer');
        this.markersGroup = document.getElementById('numberLineMarkers');
        this.arrowsGroup = document.getElementById('numberLineArrows');
        this.firstNumber = document.getElementById('firstNumber');
        this.secondNumber = document.getElementById('secondNumber');
        this.totalNumber = document.getElementById('totalNumber');

        this.initializeArrowhead();
    }

    initializeArrowhead() {
        if (!document.getElementById('arrowhead')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', '#4CAF50');
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
            this.numberLine.appendChild(defs);
        }
    }

    update(problem) {
        // Hide all visualization types first
        this.numberLine.classList.add('hidden');
        this.blocksContainer.classList.add('hidden');

        if (!problem.visualization) return;

        const { type, values } = problem.visualization;

        switch (type) {
            case 'numberLine':
                this.renderNumberLine(values);
                break;
            case 'blocks':
                this.renderBlocks(values);
                break;
        }
    }

    renderNumberLine({ sequence, stepSize, isAscending }) {
        // Clear previous markers and arrows
        this.markersGroup.innerHTML = '';
        this.arrowsGroup.innerHTML = '';

        // Calculate scale
        const min = Math.min(...sequence);
        const max = Math.max(...sequence);
        const range = max - min;
        const padding = Math.ceil(range * 0.2);
        const startNum = Math.max(0, min - padding);
        const endNum = max + padding;
        
        // Determine the interval for number markers based on step size
        const interval = stepSize >= 5 ? 5 : 1;
        
        // Add number markers
        for (let i = Math.floor(startNum / interval) * interval; i <= endNum; i += interval) {
            const x = 50 + ((i - startNum) * 400 / (endNum - startNum));
            
            // Add tick mark
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', x);
            tick.setAttribute('y1', '45');
            tick.setAttribute('x2', x);
            tick.setAttribute('y2', '55');
            tick.setAttribute('stroke', 'black');
            tick.setAttribute('stroke-width', '1');
            this.markersGroup.appendChild(tick);
            
            // Add number
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', '70');
            text.setAttribute('class', 'number-line-marker');
            text.textContent = i;
            this.markersGroup.appendChild(text);
        }

        // Add arrows for sequence
        for (let i = 0; i < sequence.length - 1; i++) {
            const start = sequence[i];
            const end = sequence[i + 1];
            
            const startX = 50 + ((start - startNum) * 400 / (endNum - startNum));
            const endX = 50 + ((end - startNum) * 400 / (endNum - startNum));
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const midY = isAscending ? 20 : 80;
            path.setAttribute('d', `M ${startX} 50 Q ${(startX + endX) / 2} ${midY} ${endX} 50`);
            path.setAttribute('class', 'number-line-arrow');
            this.arrowsGroup.appendChild(path);
        }

        this.numberLine.classList.remove('hidden');
    }

    renderBlocks({ num1, num2, total }) {
        // Clear previous blocks
        this.firstNumber.innerHTML = '';
        this.secondNumber.innerHTML = '';
        this.totalNumber.innerHTML = '';

        // Helper function to create blocks
        const createBlocks = (container, number, isFirstNumber = true) => {
            // Show empty block if number is 0
            if (number === 0) {
                const line = document.createElement('div');
                line.className = 'blocks-line';
                const emptyBlock = document.createElement('div');
                emptyBlock.className = 'block empty';
                line.appendChild(emptyBlock);
                container.appendChild(line);
                return;
            }

            const tens = Math.floor(number / 10);
            const ones = number % 10;

            // Create unit-of-ten blocks, each in its own line
            for (let i = 0; i < tens; i++) {
                const line = document.createElement('div');
                line.className = 'blocks-line';
                
                const tenBlock = document.createElement('div');
                tenBlock.className = 'block unit-of-ten';
                
                // Create 10 segments within the block
                for (let j = 0; j < 10; j++) {
                    const segment = document.createElement('div');
                    segment.className = `ten-segment ${isFirstNumber ? 'first-number' : 'second-number'}`;
                    tenBlock.appendChild(segment);
                }
                
                line.appendChild(tenBlock);
                container.appendChild(line);
            }

            // Create unit blocks in a new line if there are any
            if (ones > 0) {
                const line = document.createElement('div');
                line.className = 'blocks-line';
                
                for (let i = 0; i < ones; i++) {
                    const block = document.createElement('div');
                    block.className = 'block';
                    block.style.backgroundColor = isFirstNumber ? '#4CAF50' : '#2196F3';
                    line.appendChild(block);
                }
                
                container.appendChild(line);
            }
        };

        // For total blocks, determine which segments belong to first and second number
        const createTotalBlocks = (container, num1, num2) => {
            const total = num1 + num2;
            
            // Show empty block if total is 0
            if (total === 0) {
                const line = document.createElement('div');
                line.className = 'blocks-line';
                const emptyBlock = document.createElement('div');
                emptyBlock.className = 'block empty';
                line.appendChild(emptyBlock);
                container.appendChild(line);
                return;
            }

            const tens = Math.floor(total / 10);
            const ones = total % 10;

            // Create unit-of-ten blocks, each in its own line
            for (let i = 0; i < tens; i++) {
                const line = document.createElement('div');
                line.className = 'blocks-line';
                
                const tenBlock = document.createElement('div');
                tenBlock.className = 'block unit-of-ten';
                
                // Fill segments based on the contribution from each number
                let remainingFromNum1 = Math.min(10, num1);
                
                for (let j = 0; j < 10; j++) {
                    const segment = document.createElement('div');
                    segment.className = `ten-segment ${remainingFromNum1 > 0 ? 'first-number' : 'second-number'}`;
                    tenBlock.appendChild(segment);
                    remainingFromNum1--;
                }
                
                line.appendChild(tenBlock);
                container.appendChild(line);
                num1 = Math.max(0, num1 - 10);
                num2 = Math.max(0, num2 - (10 - Math.max(0, remainingFromNum1)));
            }

            // Create remaining unit blocks in a new line if there are any
            if (ones > 0) {
                const line = document.createElement('div');
                line.className = 'blocks-line';
                
                for (let i = 0; i < ones; i++) {
                    const block = document.createElement('div');
                    block.className = 'block';
                    block.style.backgroundColor = num1 > 0 ? '#4CAF50' : '#2196F3';
                    line.appendChild(block);
                    num1--;
                }
                
                container.appendChild(line);
            }
        };

        createBlocks(this.firstNumber, num1, true);
        createBlocks(this.secondNumber, num2, false);
        if (total !== undefined) {
            createTotalBlocks(this.totalNumber, num1, num2);
        }

        this.blocksContainer.classList.remove('hidden');
    }
}
