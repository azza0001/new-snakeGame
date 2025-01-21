////////////////// Variables //////////////////

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("scoreValue");
const questionElement = document.getElementById("mathQuestion");
const wrongAnswerElement = document.getElementById("wrongAnswer");
const startMenu = document.getElementById("startMenu");
startMenu.style.display = "block";
const deathScreen = document.getElementById("deathScreen");
const finalScoreElement = document.getElementById("finalScore");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const GRID = 24;
const GAME_SPEED = 120;
const SCORE_INCREMENT = 1;
const ROUND_TIME = 7000; // 6 seconds in milliseconds

// Set canvas size to be divisible by grid size
canvas.width = 576; // 24 * 24 grid cells
canvas.height = 576; // 24 * 24 grid cells


////////////////// Classes and Constructors //////////////////

class MathProblem {
    constructor(snake) {
        this.snake = snake;
        this.operators = ["+", "-", "*"];
        // Initialize an array to store response times
        this.responseTimes = [];
    }

    generateNewProblem() {
        // Clear existing timer first
        if (this.snake.roundTimer) {
            clearInterval(this.snake.roundTimer);
        }

        // Record the start time when a new problem is generated
        this.startTime = Date.now();

        const score = parseInt(scoreElement.textContent);
        const maxNum = Math.min(12, Math.max(5, Math.floor(score / 50) + 5));
        this.num1 = Math.floor(Math.random() * maxNum) + 1;
        this.num2 = Math.floor(Math.random() * maxNum) + 1;
        this.operator = this.operators[Math.floor(Math.random() * this.operators.length)];

        switch (this.operator) {
            case "+":
                this.answer = this.num1 + this.num2;
                break;
            case "-":
                this.answer = this.num1 - this.num2;
                break;
            case "*":
                this.answer = this.num1 * this.num2;
                break;
        }

        this.wrongAnswers = this.generateWrongAnswers();
        this.allAnswers = [...this.wrongAnswers, this.answer];
        this.shuffleAnswers();

        questionElement.textContent = `${this.num1} ${this.operator} ${this.num2} = ?`;
        questionElement.style.fontSize = '36px';

        // Start the timer immediately after generating a new problem
        this.snake.timeLeft = ROUND_TIME;
        this.snake.roundTimer = setInterval(() => {
            this.snake.timeLeft -= 100;
            if (this.snake.timeLeft <= 0) {
                clearInterval(this.snake.roundTimer);
                showThrobber(); // Show the throbber when the timer runs out
                this.snake.gameOver("Time's up!");
            }
        }, 100);
    }

    generateWrongAnswers() {
        const wrongAnswers = new Set();
        while (wrongAnswers.size < 2) {
            let wrong =
                this.answer +
                (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
            if (wrong !== this.answer && wrong >= 0) {
                wrongAnswers.add(wrong);
            }
        }
        return Array.from(wrongAnswers);
    }

    shuffleAnswers() {
        for (let i = this.allAnswers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.allAnswers[i], this.allAnswers[j]] = [
                this.allAnswers[j],
                this.allAnswers[i],
            ];
        }
    }

    getCurrentProblem() {
        return {
            num1: this.num1,
            num2: this.num2,
            operator: this.operator,
            answer: this.answer
        };
    }

    // Function to handle player's answer
    handleAnswer(playerAnswer) {
        // Record the end time when the player answers
        const endTime = Date.now();
        // Calculate the response time
        const responseTime = endTime - this.startTime;
        // Add the response time to the array
        this.responseTimes.push(responseTime);

        // Calculate the average response time
        const totalResponseTime = this.responseTimes.reduce((acc, time) => acc + time, 0);
        const averageResponseTime = totalResponseTime / this.responseTimes.length;

        console.log(`Average Response Time: ${averageResponseTime} ms`);

        // ...existing code to handle the answer...
    }
}

class Answer {
    constructor(value, x, y, isCorrect) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.isCorrect = isCorrect;
    }

    draw() {
        context.fillStyle = "#cc4f4f";
        context.fillRect(this.x, this.y, GRID, GRID);
        context.fillStyle = "white";
        context.font = "20px Times New Roman";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(this.value, this.x + GRID / 2, this.y + GRID / 2);
    }
}

// Add these new classes after your existing classes
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        this.alpha = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= 0.02;
        this.size = Math.max(0, this.size - 0.1);
    }

    draw() {
        if (this.size > 0) {
            context.save();
            context.globalAlpha = this.alpha;
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }
    }
}

// Class representing the Snake in the game, handling its movement, growth, and collision detection.
class Snake {
    // Constructor to initialize the Snake object
    constructor() {
        this.reset(); // Reset the snake's properties
        // Initialize statistics-related properties
        this.averageResponseTime = [];
        this.currentStreak = 0;
        this.totalCorrect = 0;
        this.totalWrong = 0;
        this.gameStats = {
            totalProblems: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            averageResponseTime: 0,
            longestStreak: 0,
            accuracyRate: 0,
            timeEfficiency: 0,
            problemDifficulty: [],
            responseTimesByDifficulty: {},
            scoresByOperator: {
                '+': [],
                '-': [],
                '*': []
            }
        };
        this.particles = [];
        this.glowIntensity = 0;
        this.glowIncreasing = true;
        this.gameOverCalled = false; // Add a flag to track if gameOver has been called
    }

    // Method to reset the snake's position and properties
    reset() {
        this.x = 12 * GRID; // Initial x position at center
        this.y = 12 * GRID; // Initial y position at center
        this.cells = []; // Array to hold the snake's body segments
        this.maxCells = 4; // Maximum number of cells in the snake
        this.score = 0; // Initial score
        this.currentDirection = "right"; // Current direction of the snake
        this.nextDirection = "right"; // Next direction of the snake
        this.dx = GRID; // Change in x (horizontal movement)
        this.dy = 0; // Change in y (vertical movement)
        scoreElement.textContent = this.score; // Update the score display

        // Reset statistics
        this.averageResponseTime = [];
        this.currentStreak = 0;
        this.totalCorrect = 0;
        this.totalWrong = 0;
        this.gameStats = {
            totalProblems: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            averageResponseTime: 0,
            longestStreak: 0,
            accuracyRate: 0,
            timeEfficiency: 0,
            problemDifficulty: [],
            responseTimesByDifficulty: {},
            scoresByOperator: {
                '+': [],
                '-': [],
                '*': []
            }
        };
        this.gameLoop = null;
        this.roundTimer = null;
        this.timeLeft = ROUND_TIME;
        this.gameOverCalled = false; // Reset the flag when the game is reset
    }

    // Method to update the snake's direction based on user input
    updateDirection() {
        switch (this.nextDirection) {
            case "left":
                this.dx = -GRID; // Move left
                this.dy = 0; // No vertical movement
                break;
            case "up":
                this.dx = 0; // No horizontal movement
                this.dy = -GRID; // Move up
                break;
            case "right":
                this.dx = GRID; // Move right
                this.dy = 0; // No vertical movement
                break;
            case "down":
                this.dx = 0; // No horizontal movement
                this.dy = GRID; // Move down
                break;
        }
        this.currentDirection = this.nextDirection; // Update current direction
    }

    // Method to move the snake based on its current direction
    move() {
        this.updateDirection(); // Update direction before moving
        this.x += this.dx; // Update x position
        this.y += this.dy; // Update y position

        // Check for wall collisions
        if (
            this.x < 0 ||
            this.x >= canvas.width ||
            this.y < 0 ||
            this.y >= canvas.height
        ) {
            this.gameOver("Wall Collision"); // Trigger game over with reason
            return; // Exit the method
        }

        this.cells.unshift({
            x: this.x,
            y: this.y
        }); // Add new head position to the cells array

        // Remove the last cell if the snake exceeds its maximum length
        if (this.cells.length > this.maxCells) {
            this.cells.pop(); // Remove the last segment
        }
    }

    // Method to check for collisions with the snake's own body
    checkCollision() {
        for (let i = 1; i < this.cells.length; i++) {
            // Check if the head collides with any body segment
            if (
                this.cells[i].x === this.cells[0].x &&
                this.cells[i].y === this.cells[0].y
            ) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }

    // Method to draw the snake on the canvas
    draw() {
        // Draw glow effect
        const gradient = context.createRadialGradient(
            this.x + GRID / 2, this.y + GRID / 2, 0,
            this.x + GRID / 2, this.y + GRID / 2, GRID
        );

        // Pulsating glow effect
        if (this.glowIncreasing) {
            this.glowIntensity += 0.05;
            if (this.glowIntensity >= 1) this.glowIncreasing = false;
        } else {
            this.glowIntensity -= 0.05;
            if (this.glowIntensity <= 0.3) this.glowIncreasing = true;
        }

        gradient.addColorStop(0, `rgba(76, 175, 80, ${this.glowIntensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');

        // Draw particles
        this.particles.forEach((particle, index) => {
            particle.update();
            particle.draw();
            if (particle.alpha <= 0 || particle.size <= 0) {
                this.particles.splice(index, 1);
            }
        });

        // Draw snake segments with gradient effect
        this.cells.forEach((cell, index) => {
            // Head of the snake
            if (index === 0) {
                context.fillStyle = '#2E7D32';
            }
            // Body segments with gradient
            else {
                const gradientIntensity = 1 - (index / this.cells.length);
                context.fillStyle = `rgb(${46 + 30 * gradientIntensity}, ${125 + 30 * gradientIntensity}, ${50 + 30 * gradientIntensity})`;
            }

            // Draw segment with rounded corners
            context.beginPath();
            context.roundRect(cell.x, cell.y, GRID - 1, GRID - 1, 4);
            context.fill();
        });
    }

    // Method to handle game over state
    async gameOver(reason) {
        if (this.gameOverCalled) {
            console.log('gameOver already called, skipping...');
            showThrobber(); // Show the throbber
            return;
        }
        this.gameOverCalled = true; // Set the flag to true to prevent further calls

        console.log('Game Over:', reason); // Log the reason for game over

        // Clear all text effects
        textEffects = [];
        this.particles = [];

        const stats = this.getGameStats();

        const dataTracker = new DataTracker();
        try {
            await dataTracker.sendGameStats(stats);
            console.log('Game statistics sent to Google Sheets');
        } catch (error) {
            console.error('Failed to send game statistics:', error);
        } finally {
            hideThrobber(); // Hide the throbber once processing is complete
        }

        // Safely update DOM elements with null checks
        const safeUpdateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };

        // Update basic stats
        safeUpdateElement('finalScore', this.score.toFixed(2));
        safeUpdateElement('accuracyRate', stats.accuracyRate.toFixed(1));
        safeUpdateElement('longestStreak', stats.longestStreak);

        // Update detailed stats
        safeUpdateElement('totalProblems', stats.totalProblems);
        safeUpdateElement('correctAnswers', stats.correctAnswers);
        safeUpdateElement('wrongAnswers', stats.wrongAnswers);
        safeUpdateElement('avgResponseTime', (stats.averageResponseTime / 1000).toFixed(2));

        // Update operator stats
        const operatorStatsDiv = document.getElementById('operatorStats');
        if (operatorStatsDiv) {
            operatorStatsDiv.innerHTML = '';

            Object.entries(stats.operatorPerformance).forEach(([op, avg]) => {
                const card = document.createElement('div');
                card.className = 'operator-card';
                card.innerHTML = `
                <div class="operator">${op}</div>
                <div class="stat-value">${avg.toFixed(2)}</div>
            `;
                operatorStatsDiv.appendChild(card);
            });
        }

        // Show death screen and hide canvas
        if (deathScreen) {
            deathScreen.style.display = "block";
        }
        if (canvas) {
            canvas.style.display = "none";
        }

        // Display the reason for game over
        safeUpdateElement('gameOverReason', `Game Over: ${reason}`);

        // Clear intervals
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        if (this.roundTimer) {
            clearInterval(this.roundTimer);
        }

        // Log stats to console for debugging/research
        console.log('Detailed Game Statistics:', stats);

        // Add event listener for download button
        // const downloadButton = document.getElementById('downloadStatsButton');
        // if (downloadButton) {
        //     downloadButton.addEventListener('click', downloadGameStats);
        // }
    }

    calculateScore(timeRemaining, isCorrect) {
        const baseScore = 1;
        let finalScore = 0;

        // Time bonus multiplier (0.1 to 1.0)
        const timeMultiplier = timeRemaining / ROUND_TIME;

        // Streak bonus (consecutive correct answers)
        const streakBonus = this.currentStreak * 0.1; // 10% bonus per streak

        if (isCorrect) {
            finalScore = baseScore * (1 + timeMultiplier + streakBonus);
            this.currentStreak++;
            this.totalCorrect++;
            this.averageResponseTime.push(ROUND_TIME - timeRemaining);
        } else {
            finalScore = -0.25; // Penalty for wrong answers
            this.currentStreak = 0;
            this.totalWrong++;
        }

        // Update statistics
        this.updateStats({
            timeRemaining,
            isCorrect,
            finalScore
        });

        return finalScore;
    }

    updateStats(data) {
        if (!this.gameStats) {
            this.gameStats = {
                totalProblems: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                averageResponseTime: 0,
                longestStreak: 0,
                accuracyRate: 0,
                timeEfficiency: 0,
                problemDifficulty: [], // Track difficulty of each problem
                responseTimesByDifficulty: {}, // Response times grouped by difficulty
                scoresByOperator: {
                    '+': [],
                    '-': [],
                    '*': []
                }
            };
        }

        // Update statistics
        this.gameStats.totalProblems++;
        if (data.isCorrect) {
            this.gameStats.correctAnswers++;
            this.gameStats.longestStreak = Math.max(this.currentStreak, this.gameStats.longestStreak);
        } else {
            this.gameStats.wrongAnswers++;
        }

        // Calculate running averages
        this.gameStats.accuracyRate = (this.gameStats.correctAnswers / this.gameStats.totalProblems) * 100;
        this.gameStats.averageResponseTime = this.averageResponseTime.reduce((a, b) => a + b, 0) / this.averageResponseTime.length;
        this.gameStats.timeEfficiency = (this.gameStats.averageResponseTime / ROUND_TIME) * 100;

        // Store current problem's data
        const currentProblem = mathProblem.getCurrentProblem();
        this.gameStats.problemDifficulty.push({
            difficulty: this.calculateProblemDifficulty(currentProblem),
            responseTime: ROUND_TIME - data.timeRemaining,
            isCorrect: data.isCorrect
        });

        // Store score by operator
        this.gameStats.scoresByOperator[currentProblem.operator].push(data.finalScore);
    }

    calculateProblemDifficulty(problem) {
        // Basic difficulty calculation based on numbers and operator
        let difficulty = 1;

        // Larger numbers increase difficulty
        difficulty += (problem.num1 + problem.num2) / 20;

        // Operator-based difficulty
        switch (problem.operator) {
            case '+':
                difficulty *= 1;
                break;
            case '-':
                difficulty *= 1.2;
                break;
            case '*':
                difficulty *= 1.5;
                break;
        }

        return difficulty;
    }

    getGameStats() {
        return {
            ...this.gameStats,
            finalScore: this.score,
            // Additional analysis
            operatorPerformance: {
                '+': this.calculateOperatorAverage('+'),
                '-': this.calculateOperatorAverage('-'),
                '×': this.calculateOperatorAverage('*')
            },
            difficultyAnalysis: this.analyzeDifficultyLevels(),
            speedProgression: this.analyzeSpeedProgression()
        };
    }

    calculateOperatorAverage(operator) {
        const scores = this.gameStats.scoresByOperator[operator];
        return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    }

    analyzeDifficultyLevels() {
        // Group performance by difficulty levels
        const difficultyGroups = {};
        this.gameStats.problemDifficulty.forEach(problem => {
            const difficultyLevel = Math.floor(problem.difficulty);
            if (!difficultyGroups[difficultyLevel]) {
                difficultyGroups[difficultyLevel] = {
                    total: 0,
                    correct: 0,
                    avgResponseTime: 0
                };
            }
            difficultyGroups[difficultyLevel].total++;
            if (problem.isCorrect) difficultyGroups[difficultyLevel].correct++;
            difficultyGroups[difficultyLevel].avgResponseTime += problem.responseTime;
        });

        // Calculate averages for each difficulty level
        Object.keys(difficultyGroups).forEach(level => {
            const group = difficultyGroups[level];
            group.accuracyRate = (group.correct / group.total) * 100;
            group.avgResponseTime /= group.total;
        });

        return difficultyGroups;
    }

    analyzeSpeedProgression() {
        // Analyze how response times change throughout the game
        const chunkSize = 5; // Group every 5 problems
        const chunks = [];

        for (let i = 0; i < this.averageResponseTime.length; i += chunkSize) {
            const chunk = this.averageResponseTime.slice(i, i + chunkSize);
            chunks.push({
                problemRange: `${i + 1}-${Math.min(i + chunkSize, this.averageResponseTime.length)}`,
                avgResponseTime: chunk.reduce((a, b) => a + b, 0) / chunk.length
            });
        }

        return chunks;
    }
}

class Game {
    constructor() {
        // ...existing code...
        this.combo = 0;
        this.comboTimer = null;
        this.comboTimeout = 5000; // 5 seconds to maintain combo
        this.maxCombo = 10; // Maximum combo multiplier
    }

    handleCorrectAnswer() {
        // ...existing code...
        this.increaseCombo();
        this.calculateComboScore();
        this.showComboEffect();
    }

    handleWrongAnswer() {
        // ...existing code...
        this.resetCombo();
    }

    increaseCombo() {
        clearTimeout(this.comboTimer);
        this.combo = Math.min(this.combo + 1, this.maxCombo);
        this.startComboTimer();
    }

    resetCombo() {
        clearTimeout(this.comboTimer);
        this.combo = 0;
        this.updateComboDisplay();
    }

    startComboTimer() {
        this.comboTimer = setTimeout(() => {
            this.resetCombo();
        }, this.comboTimeout);
        this.updateComboDisplay();
    }

    calculateComboScore() {
        const baseScore = 10;
        const comboBonus = this.combo * 5;
        return baseScore + comboBonus;
    }

    showComboEffect() {
        if (this.combo > 1) {
            const comboText = document.createElement('div');
            comboText.className = 'combo-text';
            comboText.textContent = `${this.combo}x Combo!`;
            Object.assign(comboText.style, {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#FFD700',
                fontSize: '24px',
                fontWeight: 'bold',
                opacity: '1',
                transition: 'all 0.5s',
                pointerEvents: 'none',
                zIndex: '1000'
            });

            document.body.appendChild(comboText);

            requestAnimationFrame(() => {
                comboText.style.transform = 'translate(-50%, -100px)';
                comboText.style.opacity = '0';
            });

            setTimeout(() => {
                document.body.removeChild(comboText);
            }, 500);
        }
    }

    updateComboDisplay() {
        const comboDisplay = document.getElementById('combo-display');
        if (this.combo > 1) {
            comboDisplay.textContent = `Combo: x${this.combo}`;
            comboDisplay.style.display = 'block';
        } else {
            comboDisplay.style.display = 'none';
        }
    }
}

class GameStatsFormatter {
    constructor(stats) {
        this.stats = stats;
    }

    formatDate(isoDate) {
        return new Date(isoDate).toLocaleString();
    }

    toJSON() {
        return {
            "Game Summary": {
                "Date": this.formatDate(new Date()),
                "Total Score": this.stats.score,
                "Highest Combo": this.stats.maxCombo,
                "Questions Answered": this.stats.totalQuestions,
                "Accuracy": `${Math.round((this.stats.correctAnswers / this.stats.totalQuestions) * 100)}%`
            },
            "Performance": {
                "Correct Answers": this.stats.correctAnswers,
                "Wrong Answers": this.stats.wrongAnswers,
                "Average Response Time": `${Math.round(this.stats.avgResponseTime)}ms`,
                "Best Response Time": `${Math.round(this.stats.bestResponseTime)}ms`
            },
            "Snake Stats": {
                "Final Length": this.stats.snakeLength,
                "Food Eaten": this.stats.foodEaten,
                "Time Played": `${Math.round(this.stats.timePlayed / 1000)}s`
            }
        };
    }

    toCSV() {
        const data = this.toJSON();
        let csv = [];

        Object.entries(data).forEach(([category, stats]) => {
            csv.push(`\n${category}`);
            Object.entries(stats).forEach(([key, value]) => {
                csv.push(`${key},${value}`);
            });
        });

        return csv.join('\n');
    }
}

class DataTracker {
    constructor() {
        this.SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbwBMWyAirS5q48ari7WI-sCcJcm0Zq3WWvcmqQJPry-ybd9yxFwNBJ4biW9Ys-awfh2kw/exec';
        this.isSubmitting = false;
        this.lastSubmitTime = 0;
        this.minSubmitInterval = 2000; // 2 seconds
    }

    async sendGameStats(stats) {
        // Prevent duplicate submissions
        const now = Date.now();
        if (this.isSubmitting || (now - this.lastSubmitTime) < this.minSubmitInterval) {
            console.log('Preventing duplicate submission');
            return false;
        }

        try {
            this.isSubmitting = true;
            console.log('Sending game stats...', stats);

            const payload = {
                finalScore: parseFloat(stats.finalScore.toFixed(2)),
                accuracy: `${parseFloat(stats.accuracyRate.toFixed(1))}%`,
                longestStreak: stats.longestStreak,
                avgResponseTime: parseFloat((stats.averageResponseTime / 1000).toFixed(2)),
                totalProblems: stats.totalProblems,
                correctAnswers: stats.correctAnswers,
                wrongAnswers: stats.wrongAnswers,
                timestamp: new Date().toISOString()
            };

            const response = await fetch(this.SHEETS_API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            this.lastSubmitTime = Date.now();
            console.log('Data sent successfully');
            return true;

        } catch (error) {
            console.error('Error sending data:', error);
            throw error;
        } finally {
            this.isSubmitting = false;
        }
    }
}

////////////////// Functions //////////////////

function showStatusMessage(message, type = 'info') {
  const statusDiv = document.createElement('div');
  statusDiv.className = `status-message ${type}`;
  statusDiv.textContent = message;
  document.body.appendChild(statusDiv);
  
  setTimeout(() => {
      statusDiv.remove();
  }, 3000);
}

function getRandomPosition() {
    return {
        x: getRandomInt(0, 24) * GRID,
        y: getRandomInt(0, 24) * GRID,
    };
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function createAnswers() {
    answers = [];
    let positions = [];

    while (positions.length < 50) {
        let pos = getRandomPosition();
        if (!positions.some((p) => p.x === pos.x && p.y === pos.y)) {
            positions.push(pos);
        }
    }

    mathProblem.allAnswers.forEach((value, index) => {
        answers.push(
            new Answer(
                value,
                positions[index].x,
                positions[index].y,
                value === mathProblem.answer
            )
        );
    });
}

class TextEffect {
    constructor(text, x, y, type = 'score') {
        this.text = text;
        this.x = x;
        this.y = y - GRID;
        this.alpha = 1.0;
        this.scale = 1.0;
        this.type = type;
        this.dy = -1.5;
        this.color = text.includes('+') ? '#4CAF50' : '#cc4f4f';
        this.fontSize = 20;
        this.startTime = performance.now();
        this.duration = 1000; // 1 second duration
        this.isActive = true;
    }

    update() {
        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // Smooth easing function
        const easeOut = t => 1 - Math.pow(1 - t, 3);

        this.y += this.dy * (1 - progress);
        this.alpha = 1 - easeOut(progress);
        this.scale = 1 + (progress * 0.2);

        if (progress >= 1) {
            this.isActive = false;
        }
    }

    draw() {
        if (!this.isActive) return;

        context.save();
        context.globalAlpha = this.alpha;
        context.fillStyle = this.color;
        context.font = `bold ${this.fontSize * this.scale}px Arial`;
        context.textAlign = "center";
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        context.shadowBlur = 4;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillText(this.text, this.x, this.y);
        context.restore();
    }
}

let textEffects = []; // Array to hold active text effects

function checkAnswerCollision() {
    const head = snake.cells[0];
    if (!head) return false;

    for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        if (head.x === answer.x && head.y === answer.y) {
            // Create particles
            for (let j = 0; j < 15; j++) {
                snake.particles.push(
                    new Particle(
                        head.x + GRID / 2,
                        head.y + GRID / 2,
                        answer.isCorrect ? '#4CAF50' : '#cc4f4f'
                    )
                );
            }

            answers.splice(i, 1);
            if (answer.isCorrect) {
                const newScore = snake.calculateScore(snake.timeLeft, true);
                snake.maxCells++;
                snake.score += SCORE_INCREMENT;
                scoreElement.textContent = snake.score;
                wrongAnswerElement.textContent = "";

                // Add score effect
                textEffects.push(new TextEffect("+" + SCORE_INCREMENT, head.x + GRID / 2, head.y, 'score'));

                // Add combo effect if streak is notable
                if (snake.currentStreak > 2) {
                    textEffects.push(new TextEffect(
                        `${snake.currentStreak}x COMBO!`,
                        canvas.width / 2,
                        canvas.height / 2,
                        'combo'
                    ));
                }

                mathProblem.generateNewProblem();
                createAnswers();
                return true;
            } else {
                const newScore = snake.calculateScore(snake.timeLeft, false);
                wrongAnswerElement.textContent = "Wrong answer! Try again.";
                snake.score -= 0.25;
                scoreElement.textContent = snake.score;

                // Add negative score effect
                textEffects.push(new TextEffect("-0.25", head.x + GRID / 2, head.y, 'score'));

                setTimeout(() => {
                    wrongAnswerElement.textContent = "";
                }, 2000);
                return false;
            }
        }
    }
    return false;
}

function update() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    context.strokeStyle = '#6e6e6e';
    context.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += GRID) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += GRID) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
    }

    snake.move();
    checkAnswerCollision();

    textEffects = textEffects.filter((effect) => effect.isActive);
    textEffects.forEach((effect) => {
        effect.update();
        effect.draw();
    });

    // Draw timer bar
    const timerWidth = (snake.timeLeft / ROUND_TIME) * canvas.width;
    context.fillStyle = snake.timeLeft < 2000 ? "red" : "#4CAF50";
    context.fillRect(0, 0, timerWidth, 5);

    if (snake.checkCollision()) {
        snake.gameOver();
    }
    answers.forEach((answer) => answer.draw());
    snake.draw();
}

// where you update the score
function updateScore(newScore) {
    const scoreElement = document.getElementById('scoreValue');
    scoreElement.textContent = newScore;
    scoreElement.style.fontSize = '32px';
    scoreElement.classList.add('score-up');
    setTimeout(() => scoreElement.classList.remove('score-up'), 500);
}

// where you update the math question
function updateMathQuestion(newQuestion) {
    const questionElement = document.getElementById('mathQuestion');
    questionElement.classList.add('question-change');
    questionElement.textContent = newQuestion;
    setTimeout(() => questionElement.classList.remove('question-change'), 300);
}

// where you show wrong answers
function showWrongAnswer(message) {
    const wrongAnswer = document.getElementById('wrongAnswer');
    wrongAnswer.textContent = message;
    wrongAnswer.classList.add('show');
    setTimeout(() => wrongAnswer.classList.remove('show'), 2000);
}

function startGame() {
    // Clear any existing intervals
    if (snake.gameLoop) clearInterval(snake.gameLoop);
    if (snake.roundTimer) clearInterval(snake.roundTimer);

    // Reset game state
    snake.reset();
    canvas.style.display = "block";

    // Initialize the first problem and timer
    mathProblem.generateNewProblem();
    createAnswers();

    // Start the game loop
    snake.gameLoop = setInterval(update, GAME_SPEED);
}

////////////////// Function Events //////////////////

// Initialize objects but don't start timers
const snake = new Snake();
const mathProblem = new MathProblem(snake);

let answers = [];

document.addEventListener("keydown", (e) => {
    const key = e.which || e.keyCode;
    const currentDir = snake.currentDirection;

    if ((key === 37 || key === 65) && currentDir !== "right") {
        snake.nextDirection = "left";
    } else if ((key === 38 || key === 87) && currentDir !== "down") {
        snake.nextDirection = "up";
    } else if ((key === 39 || key === 68) && currentDir !== "left") {
        snake.nextDirection = "right";
    } else if ((key === 40 || key === 83) && currentDir !== "up") {
        snake.nextDirection = "down";
    }
});

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const keyMap = {
        'w': '.up-key',
        'a': '.left-key',
        's': '.down-key',
        'd': '.right-key'
    };

    if (keyMap[key]) {
        const keyElement = document.querySelector(keyMap[key]);
        keyElement.classList.add('pressed');
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    const keyMap = {
        'w': '.up-key',
        'a': '.left-key',
        's': '.down-key',
        'd': '.right-key'
    };

    if (keyMap[key]) {
        const keyElement = document.querySelector(keyMap[key]);
        keyElement.classList.remove('pressed');
    }
});

startButton.addEventListener("click", () => {
    startMenu.style.display = "none";
    startGame();
});

restartButton.addEventListener("click", () => {
    deathScreen.style.display = "none";
    startGame();
});

// show the start menu, don't initialize any game components
startMenu.style.display = "block";

////////////////// Mobile Controls //////////////////

// Add touch controls
let touchStartX = 0;
let touchStartY = 0;
const MIN_SWIPE_DISTANCE = 30; // Minimum distance for a swipe to register

canvas.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault(); // Prevent scrolling while playing
});

canvas.addEventListener('touchmove', function(e) {
    if (!touchStartX || !touchStartY) {
        return;
    }

    let touchEndX = e.touches[0].clientX;
    let touchEndY = e.touches[0].clientY;

    let deltaX = touchEndX - touchStartX;
    let deltaY = touchEndY - touchStartY;

    // Only register swipe if it's long enough
    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE) {
        return;
    }

    const currentDir = snake.currentDirection;

    // Determine if horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && currentDir !== "left") {
            snake.nextDirection = "right";
        } else if (deltaX < 0 && currentDir !== "right") {
            snake.nextDirection = "left";
        }
    } else {
        // Vertical swipe
        if (deltaY > 0 && currentDir !== "up") {
            snake.nextDirection = "down";
        } else if (deltaY < 0 && currentDir !== "down") {
            snake.nextDirection = "up";
        }
    }

    // Reset touch start coordinates
    touchStartX = null;
    touchStartY = null;
    e.preventDefault();
});

// Touch control configuration
const TOUCH_CONFIG = {
    minSwipeDistance: 30,
    debounceTime: 100,
    sensitivity: 1.0
};

let lastTouchTime = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
});

canvas.addEventListener('touchmove', (e) => {
    if (!touchStartX || !touchStartY) return;

    const currentTime = Date.now();
    if (currentTime - lastTouchTime < TOUCH_CONFIG.debounceTime) return;

    const deltaX = (e.touches[0].clientX - touchStartX) * TOUCH_CONFIG.sensitivity;
    const deltaY = (e.touches[0].clientY - touchStartY) * TOUCH_CONFIG.sensitivity;
    const currentDir = snake.direction;

    if (Math.abs(deltaX) < TOUCH_CONFIG.minSwipeDistance &&
        Math.abs(deltaY) < TOUCH_CONFIG.minSwipeDistance) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && currentDir !== "left") {
            snake.nextDirection = "right";
        } else if (deltaX < 0 && currentDir !== "right") {
            snake.nextDirection = "left";
        }
    } else {
        if (deltaY > 0 && currentDir !== "up") {
            snake.nextDirection = "down";
        } else if (deltaY < 0 && currentDir !== "down") {
            snake.nextDirection = "up";
        }
    }

    lastTouchTime = currentTime;
    touchStartX = null;
    touchStartY = null;
    e.preventDefault();
});

////////////////// Misc Functions //////////////////

// Function to show the throbber and hide the canvas, score, and question
function showThrobber() {
    const throbber = document.getElementById('throbber');
    const canvas = document.getElementById('game');
    const score = document.querySelector('.score');
    const question = document.getElementById('mathQuestion');

    if (throbber) {
        throbber.style.display = 'flex';
    }
    if (canvas) {
        canvas.style.display = 'none'; // Hide the canvas
    }
    if (score) {
        score.style.display = 'none'; // Hide the score
    }
    if (question) {
        question.style.display = 'none'; // Hide the question
    }
}

// Function to hide the throbber and show the canvas, score, and question
function hideThrobber() {
    const throbber = document.getElementById('throbber');
    const canvas = document.getElementById('game');
    const score = document.querySelector('.score');
    const question = document.getElementById('mathQuestion');

    if (throbber) {
        throbber.style.display = 'none';
    }
    if (canvas) {
        canvas.style.display = 'block'; // Show the canvas
    }
    if (score) {
        score.style.display = 'block'; // Show the score
    }
    if (question) {
        question.style.display = 'block'; // Show the question
    }
}