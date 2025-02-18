const canvas = document.getElementById("game"),
  context = canvas.getContext("2d"),
  scoreElement = document.getElementById("scoreValue"),
  questionElement = document.getElementById("mathQuestion"),
  wrongAnswerElement = document.getElementById("wrongAnswer"),
  startMenu = document.getElementById("startMenu");
startMenu.style.display = "block";
const deathScreen = document.getElementById("deathScreen"),
  finalScoreElement = document.getElementById("finalScore"),
  startButton = document.getElementById("startButton"),
  restartButton = document.getElementById("restartButton"),
  GRID = 24,
  GAME_SPEED = 120,
  SCORE_INCREMENT = 1,
  ROUND_TIME = 7e3;
(canvas.width = 576), (canvas.height = 576);
class MathProblem {
  constructor(t) {
    (this.snake = t),
      (this.operators = ["+", "-", "*"]),
      (this.responseTimes = []);
  }
  generateNewProblem() {
    this.snake.roundTimer && clearInterval(this.snake.roundTimer),
      (this.startTime = Date.now());
    const t = parseInt(scoreElement.textContent),
      e = Math.min(12, Math.max(5, Math.floor(t / 50) + 5));
    switch (
      ((this.num1 = Math.floor(Math.random() * e) + 1),
      (this.num2 = Math.floor(Math.random() * e) + 1),
      (this.operator =
        this.operators[Math.floor(Math.random() * this.operators.length)]),
      this.operator)
    ) {
      case "+":
        this.answer = this.num1 + this.num2;
        break;
      case "-":
        this.answer = this.num1 - this.num2;
        break;
      case "*":
        this.answer = this.num1 * this.num2;
    }
    (this.wrongAnswers = this.generateWrongAnswers()),
      (this.allAnswers = [...this.wrongAnswers, this.answer]),
      this.shuffleAnswers(),
      (questionElement.textContent = `${this.num1} ${this.operator} ${this.num2} = ?`),
      (questionElement.style.fontSize = "36px"),
      (this.snake.timeLeft = ROUND_TIME),
      (this.snake.roundTimer = setInterval(() => {
        (this.snake.timeLeft -= 100),
          this.snake.timeLeft <= 0 &&
            (clearInterval(this.snake.roundTimer),
            showThrobber(),
            this.snake.gameOver("Time's up!"));
      }, 100));
  }
  generateWrongAnswers() {
    const t = new Set();
    for (; t.size < 2; ) {
      let e =
        this.answer +
        (Math.random() < 0.5 ? 1 : -1) * (Math.floor(5 * Math.random()) + 1);
      e !== this.answer && e >= 0 && t.add(e);
    }
    return Array.from(t);
  }
  shuffleAnswers() {
    for (let t = this.allAnswers.length - 1; t > 0; t--) {
      const e = Math.floor(Math.random() * (t + 1));
      [this.allAnswers[t], this.allAnswers[e]] = [
        this.allAnswers[e],
        this.allAnswers[t],
      ];
    }
  }
  getCurrentProblem() {
    return {
      num1: this.num1,
      num2: this.num2,
      operator: this.operator,
      answer: this.answer,
    };
  }
  handleAnswer(t) {
    const e = Date.now() - this.startTime;
    this.responseTimes.push(e);
    this.responseTimes.reduce((t, e) => t + e, 0), this.responseTimes.length;
  }
}
class Answer {
  constructor(t, e, s, n) {
    (this.value = t), (this.x = e), (this.y = s), (this.isCorrect = n);
  }
  draw() {
    (context.fillStyle = "#cc4f4f"),
      context.fillRect(this.x, this.y, GRID, GRID),
      (context.fillStyle = "white"),
      (context.font = "20px Times New Roman"),
      (context.textAlign = "center"),
      (context.textBaseline = "middle"),
      context.fillText(this.value, this.x + GRID / 2, this.y + GRID / 2);
  }
}
class Particle {
  constructor(t, e, s) {
    (this.x = t),
      (this.y = e),
      (this.color = s),
      (this.size = 3 * Math.random() + 2),
      (this.speedX = 4 * (Math.random() - 0.5)),
      (this.speedY = 4 * (Math.random() - 0.5)),
      (this.alpha = 1);
  }
  update() {
    (this.x += this.speedX),
      (this.y += this.speedY),
      (this.alpha -= 0.02),
      (this.size = Math.max(0, this.size - 0.1));
  }
  draw() {
    this.size > 0 &&
      (context.save(),
      (context.globalAlpha = this.alpha),
      (context.fillStyle = this.color),
      context.beginPath(),
      context.arc(this.x, this.y, this.size, 0, 2 * Math.PI),
      context.fill(),
      context.restore());
  }
}
class Snake {
  constructor() {
    this.reset(),
      (this.averageResponseTime = []),
      (this.currentStreak = 0),
      (this.totalCorrect = 0),
      (this.totalWrong = 0),
      (this.gameStats = {
        totalProblems: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        averageResponseTime: 0,
        longestStreak: 0,
        accuracyRate: 0,
        timeEfficiency: 0,
        problemDifficulty: [],
        responseTimesByDifficulty: {},
        scoresByOperator: { "+": [], "-": [], "*": [] },
      }),
      (this.particles = []),
      (this.glowIntensity = 0),
      (this.glowIncreasing = !0),
      (this.gameOverCalled = !1);
  }
  reset() {
    (this.x = 12 * GRID),
      (this.y = 12 * GRID),
      (this.cells = []),
      (this.maxCells = 4),
      (this.score = 0),
      (this.currentDirection = "right"),
      (this.nextDirection = "right"),
      (this.dx = GRID),
      (this.dy = 0),
      (scoreElement.textContent = this.score),
      (this.averageResponseTime = []),
      (this.currentStreak = 0),
      (this.totalCorrect = 0),
      (this.totalWrong = 0),
      (this.gameStats = {
        totalProblems: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        averageResponseTime: 0,
        longestStreak: 0,
        accuracyRate: 0,
        timeEfficiency: 0,
        problemDifficulty: [],
        responseTimesByDifficulty: {},
        scoresByOperator: { "+": [], "-": [], "*": [] },
      }),
      (this.gameLoop = null),
      (this.roundTimer = null),
      (this.timeLeft = ROUND_TIME),
      (this.gameOverCalled = !1);
  }
  updateDirection() {
    switch (this.nextDirection) {
      case "left":
        (this.dx = -GRID), (this.dy = 0);
        break;
      case "up":
        (this.dx = 0), (this.dy = -GRID);
        break;
      case "right":
        (this.dx = GRID), (this.dy = 0);
        break;
      case "down":
        (this.dx = 0), (this.dy = GRID);
    }
    this.currentDirection = this.nextDirection;
  }
  move() {
    this.updateDirection(),
      (this.x += this.dx),
      (this.y += this.dy),
      this.x < 0 ||
      this.x >= canvas.width ||
      this.y < 0 ||
      this.y >= canvas.height
        ? this.gameOver("Wall Collision")
        : (this.cells.unshift({ x: this.x, y: this.y }),
          this.cells.length > this.maxCells && this.cells.pop());
  }
  checkCollision() {
    for (let t = 1; t < this.cells.length; t++)
      if (
        this.cells[t].x === this.cells[0].x &&
        this.cells[t].y === this.cells[0].y
      )
        return !0;
    return !1;
  }
  draw() {
    const t = context.createRadialGradient(
      this.x + GRID / 2,
      this.y + GRID / 2,
      0,
      this.x + GRID / 2,
      this.y + GRID / 2,
      GRID
    );
    this.glowIncreasing
      ? ((this.glowIntensity += 0.05),
        this.glowIntensity >= 1 && (this.glowIncreasing = !1))
      : ((this.glowIntensity -= 0.05),
        this.glowIntensity <= 0.3 && (this.glowIncreasing = !0)),
      t.addColorStop(0, `rgba(76, 175, 80, ${0.5 * this.glowIntensity})`),
      t.addColorStop(1, "rgba(76, 175, 80, 0)"),
      this.particles.forEach((t, e) => {
        t.update(),
          t.draw(),
          (t.alpha <= 0 || t.size <= 0) && this.particles.splice(e, 1);
      }),
      this.cells.forEach((t, e) => {
        if (0 === e) context.fillStyle = "#2E7D32";
        else {
          const t = 1 - e / this.cells.length;
          context.fillStyle = `rgb(${46 + 30 * t}, ${125 + 30 * t}, ${
            50 + 30 * t
          })`;
        }
        context.beginPath(),
          context.roundRect(t.x, t.y, GRID - 1, GRID - 1, 4),
          context.fill();
      });
  }
  async gameOver(t) {
    if (this.gameOverCalled) return void showThrobber();
    (this.gameOverCalled = !0), (textEffects = []), (this.particles = []);
    const e = this.getGameStats(),
      s = new DataTracker();
    try {
      await s.sendGameStats(e);
    } catch (t) {
      console.error("Failed to send game statistics:", t);
    } finally {
      hideThrobber();
    }
    const n = (t, e) => {
      const s = document.getElementById(t);
      s && (s.textContent = e);
    };
    n("finalScore", this.score.toFixed(2)),
      n("accuracyRate", e.accuracyRate.toFixed(1)),
      n("longestStreak", e.longestStreak),
      n("totalProblems", e.totalProblems),
      n("correctAnswers", e.correctAnswers),
      n("wrongAnswers", e.wrongAnswers),
      n("avgResponseTime", (e.averageResponseTime / 1e3).toFixed(2));
    const o = document.getElementById("operatorStats");
    o &&
      ((o.innerHTML = ""),
      Object.entries(e.operatorPerformance).forEach(([t, e]) => {
        const s = document.createElement("div");
        (s.className = "operator-card"),
          (s.innerHTML = `\n                <div class="operator">${t}</div>\n                <div class="stat-value">${e.toFixed(
            2
          )}</div>\n            `),
          o.appendChild(s);
      })),
      deathScreen && (deathScreen.style.display = "block"),
      canvas && (canvas.style.display = "none"),
      n("gameOverReason", `Game Over: ${t}`),
      this.gameLoop && clearInterval(this.gameLoop),
      this.roundTimer && clearInterval(this.roundTimer);
  }
  calculateScore(t, e) {
    let s = 0;
    const n = t / ROUND_TIME,
      o = 0.1 * this.currentStreak;
    return (
      e
        ? ((s = 1 * (1 + n + o)),
          this.currentStreak++,
          this.totalCorrect++,
          this.averageResponseTime.push(ROUND_TIME - t))
        : ((s = -0.25), (this.currentStreak = 0), this.totalWrong++),
      this.updateStats({ timeRemaining: t, isCorrect: e, finalScore: s }),
      s
    );
  }
  updateStats(t) {
    this.gameStats ||
      (this.gameStats = {
        totalProblems: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        averageResponseTime: 0,
        longestStreak: 0,
        accuracyRate: 0,
        timeEfficiency: 0,
        problemDifficulty: [],
        responseTimesByDifficulty: {},
        scoresByOperator: { "+": [], "-": [], "*": [] },
      }),
      this.gameStats.totalProblems++,
      t.isCorrect
        ? (this.gameStats.correctAnswers++,
          (this.gameStats.longestStreak = Math.max(
            this.currentStreak,
            this.gameStats.longestStreak
          )))
        : this.gameStats.wrongAnswers++,
      (this.gameStats.accuracyRate =
        (this.gameStats.correctAnswers / this.gameStats.totalProblems) * 100),
      (this.gameStats.averageResponseTime =
        this.averageResponseTime.reduce((t, e) => t + e, 0) /
        this.averageResponseTime.length),
      (this.gameStats.timeEfficiency =
        (this.gameStats.averageResponseTime / ROUND_TIME) * 100);
    const e = mathProblem.getCurrentProblem();
    this.gameStats.problemDifficulty.push({
      difficulty: this.calculateProblemDifficulty(e),
      responseTime: ROUND_TIME - t.timeRemaining,
      isCorrect: t.isCorrect,
    }),
      this.gameStats.scoresByOperator[e.operator].push(t.finalScore);
  }
  calculateProblemDifficulty(t) {
    let e = 1;
    switch (((e += (t.num1 + t.num2) / 20), t.operator)) {
      case "+":
        e *= 1;
        break;
      case "-":
        e *= 1.2;
        break;
      case "*":
        e *= 1.5;
    }
    return e;
  }
  getGameStats() {
    return {
      ...this.gameStats,
      finalScore: this.score,
      operatorPerformance: {
        "+": this.calculateOperatorAverage("+"),
        "-": this.calculateOperatorAverage("-"),
        "×": this.calculateOperatorAverage("*"),
      },
      difficultyAnalysis: this.analyzeDifficultyLevels(),
      speedProgression: this.analyzeSpeedProgression(),
    };
  }
  calculateOperatorAverage(t) {
    const e = this.gameStats.scoresByOperator[t];
    return e.length ? e.reduce((t, e) => t + e, 0) / e.length : 0;
  }
  analyzeDifficultyLevels() {
    const t = {};
    return (
      this.gameStats.problemDifficulty.forEach((e) => {
        const s = Math.floor(e.difficulty);
        t[s] || (t[s] = { total: 0, correct: 0, avgResponseTime: 0 }),
          t[s].total++,
          e.isCorrect && t[s].correct++,
          (t[s].avgResponseTime += e.responseTime);
      }),
      Object.keys(t).forEach((e) => {
        const s = t[e];
        (s.accuracyRate = (s.correct / s.total) * 100),
          (s.avgResponseTime /= s.total);
      }),
      t
    );
  }
  analyzeSpeedProgression() {
    const t = [];
    for (let e = 0; e < this.averageResponseTime.length; e += 5) {
      const s = this.averageResponseTime.slice(e, e + 5);
      t.push({
        problemRange: `${e + 1}-${Math.min(
          e + 5,
          this.averageResponseTime.length
        )}`,
        avgResponseTime: s.reduce((t, e) => t + e, 0) / s.length,
      });
    }
    return t;
  }
}
class Game {
  constructor() {
    (this.combo = 0),
      (this.comboTimer = null),
      (this.comboTimeout = 5e3),
      (this.maxCombo = 10);
  }
  handleCorrectAnswer() {
    this.increaseCombo(), this.calculateComboScore(), this.showComboEffect();
  }
  handleWrongAnswer() {
    this.resetCombo();
  }
  increaseCombo() {
    clearTimeout(this.comboTimer),
      (this.combo = Math.min(this.combo + 1, this.maxCombo)),
      this.startComboTimer();
  }
  resetCombo() {
    clearTimeout(this.comboTimer), (this.combo = 0), this.updateComboDisplay();
  }
  startComboTimer() {
    (this.comboTimer = setTimeout(() => {
      this.resetCombo();
    }, this.comboTimeout)),
      this.updateComboDisplay();
  }
  calculateComboScore() {
    return 10 + 5 * this.combo;
  }
  showComboEffect() {
    if (this.combo > 1) {
      const t = document.createElement("div");
      (t.className = "combo-text"),
        (t.textContent = `${this.combo}x Combo!`),
        Object.assign(t.style, {
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          color: "#FFD700",
          fontSize: "24px",
          fontWeight: "bold",
          opacity: "1",
          transition: "all 0.5s",
          pointerEvents: "none",
          zIndex: "1000",
        }),
        document.body.appendChild(t),
        requestAnimationFrame(() => {
          (t.style.transform = "translate(-50%, -100px)"),
            (t.style.opacity = "0");
        }),
        setTimeout(() => {
          document.body.removeChild(t);
        }, 500);
    }
  }
  updateComboDisplay() {
    const t = document.getElementById("combo-display");
    this.combo > 1
      ? ((t.textContent = `Combo: x${this.combo}`), (t.style.display = "block"))
      : (t.style.display = "none");
  }
}
class GameStatsFormatter {
  constructor(t) {
    this.stats = t;
  }
  formatDate(t) {
    return new Date(t).toLocaleString();
  }
  toJSON() {
    return {
      "Game Summary": {
        Date: this.formatDate(new Date()),
        "Total Score": this.stats.score,
        "Highest Combo": this.stats.maxCombo,
        "Questions Answered": this.stats.totalQuestions,
        Accuracy: `${Math.round(
          (this.stats.correctAnswers / this.stats.totalQuestions) * 100
        )}%`,
      },
      Performance: {
        "Correct Answers": this.stats.correctAnswers,
        "Wrong Answers": this.stats.wrongAnswers,
        "Average Response Time": `${Math.round(this.stats.avgResponseTime)}ms`,
        "Best Response Time": `${Math.round(this.stats.bestResponseTime)}ms`,
      },
      "Snake Stats": {
        "Final Length": this.stats.snakeLength,
        "Food Eaten": this.stats.foodEaten,
        "Time Played": `${Math.round(this.stats.timePlayed / 1e3)}s`,
      },
    };
  }
  toCSV() {
    const t = this.toJSON();
    let e = [];
    return (
      Object.entries(t).forEach(([t, s]) => {
        e.push(`\n${t}`),
          Object.entries(s).forEach(([t, s]) => {
            e.push(`${t},${s}`);
          });
      }),
      e.join("\n")
    );
  }
}
class DataTracker {
  constructor() {
    (this.SHEETS_API_URL =
      "https://script.google.com/macros/s/AKfycbzWFsdVVpa-NFEw2EBucUpwMGcXnafT0kxVzf8u5EYLLwFf4bnOdAgmdwIuIJ6Q2XwGZQ/exec"),
      (this.isSubmitting = !1),
      (this.lastSubmitTime = 0),
      (this.minSubmitInterval = 2e3);
  }
  async sendGameStats(t) {
    const e = Date.now();
    if (this.isSubmitting || e - this.lastSubmitTime < this.minSubmitInterval)
      return !1;
    try {
      this.isSubmitting = !0;
      const e = {
        timestamp: new Date().toISOString(),
        playerName: snake.playerInfo.name,
        playerSection: snake.playerInfo.section,
        finalScore: parseFloat(t.finalScore.toFixed(2)),
        accuracy: `${parseFloat(t.accuracyRate.toFixed(1))}%`,
        longestStreak: t.longestStreak,
        avgResponseTime: parseFloat((t.averageResponseTime / 1e3).toFixed(2)),
        totalProblems: t.totalProblems,
        correctAnswers: t.correctAnswers,
        wrongAnswers: t.wrongAnswers,
      };
      await fetch(this.SHEETS_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e),
      });
      return (this.lastSubmitTime = Date.now()), !0;
    } catch (t) {
      throw (console.error("Error sending data:", t), t);
    } finally {
      this.isSubmitting = !1;
    }
  }
}
function showStatusMessage(t, e = "info") {
  const s = document.createElement("div");
  (s.className = `status-message ${e}`),
    (s.textContent = t),
    document.body.appendChild(s),
    setTimeout(() => {
      s.remove();
    }, 3e3);
}
function getRandomPosition() {
  return { x: getRandomInt(0, 24) * GRID, y: getRandomInt(0, 24) * GRID };
}
function getRandomInt(t, e) {
  return Math.floor(Math.random() * (e - t)) + t;
}
function createAnswers() {
  answers = [];
  let t = [];
  for (; t.length < 50; ) {
    let e = getRandomPosition();
    t.some((t) => t.x === e.x && t.y === e.y) || t.push(e);
  }
  mathProblem.allAnswers.forEach((e, s) => {
    answers.push(new Answer(e, t[s].x, t[s].y, e === mathProblem.answer));
  });
}
class TextEffect {
  constructor(t, e, s, n = "score") {
    (this.text = t),
      (this.x = e),
      (this.y = s - GRID),
      (this.alpha = 1),
      (this.scale = 1),
      (this.type = n),
      (this.dy = -1.5),
      (this.color = t.includes("+") ? "#4CAF50" : "#cc4f4f"),
      (this.fontSize = 20),
      (this.startTime = performance.now()),
      (this.duration = 1e3),
      (this.isActive = !0);
  }
  update() {
    const t = performance.now() - this.startTime,
      e = Math.min(t / this.duration, 1);
    var s;
    (this.y += this.dy * (1 - e)),
      (this.alpha = 1 - ((s = e), 1 - Math.pow(1 - s, 3))),
      (this.scale = 1 + 0.2 * e),
      e >= 1 && (this.isActive = !1);
  }
  draw() {
    this.isActive &&
      (context.save(),
      (context.globalAlpha = this.alpha),
      (context.fillStyle = this.color),
      (context.font = `bold ${this.fontSize * this.scale}px Arial`),
      (context.textAlign = "center"),
      (context.shadowColor = "rgba(0, 0, 0, 0.5)"),
      (context.shadowBlur = 4),
      (context.shadowOffsetX = 2),
      (context.shadowOffsetY = 2),
      context.fillText(this.text, this.x, this.y),
      context.restore());
  }
}
let textEffects = [];
function checkAnswerCollision() {
  const t = snake.cells[0];
  if (!t) return !1;
  for (let e = 0; e < answers.length; e++) {
    const s = answers[e];
    if (t.x === s.x && t.y === s.y) {
      for (let e = 0; e < 15; e++)
        snake.particles.push(
          new Particle(
            t.x + GRID / 2,
            t.y + GRID / 2,
            s.isCorrect ? "#4CAF50" : "#cc4f4f"
          )
        );
      if ((answers.splice(e, 1), s.isCorrect)) {
        snake.calculateScore(snake.timeLeft, !0);
        return (
          snake.maxCells++,
          (snake.score += SCORE_INCREMENT),
          (scoreElement.textContent = snake.score),
          (wrongAnswerElement.textContent = ""),
          textEffects.push(
            new TextEffect("+" + SCORE_INCREMENT, t.x + GRID / 2, t.y, "score")
          ),
          snake.currentStreak > 2 &&
            textEffects.push(
              new TextEffect(
                `${snake.currentStreak}x COMBO!`,
                canvas.width / 2,
                canvas.height / 2,
                "combo"
              )
            ),
          mathProblem.generateNewProblem(),
          createAnswers(),
          !0
        );
      }
      snake.calculateScore(snake.timeLeft, !1);
      return (
        (wrongAnswerElement.textContent = "Wrong answer! Try again."),
        (snake.score -= 0.25),
        (scoreElement.textContent = snake.score),
        textEffects.push(new TextEffect("-0.25", t.x + GRID / 2, t.y, "score")),
        setTimeout(() => {
          wrongAnswerElement.textContent = "";
        }, 2e3),
        !1
      );
    }
  }
  return !1;
}
function update() {
  context.clearRect(0, 0, canvas.width, canvas.height),
    (context.strokeStyle = "#6e6e6e"),
    (context.lineWidth = 0.5);
  for (let t = 0; t <= canvas.width; t += GRID)
    context.beginPath(),
      context.moveTo(t, 0),
      context.lineTo(t, canvas.height),
      context.stroke();
  for (let t = 0; t <= canvas.height; t += GRID)
    context.beginPath(),
      context.moveTo(0, t),
      context.lineTo(canvas.width, t),
      context.stroke();
  snake.move(),
    checkAnswerCollision(),
    (textEffects = textEffects.filter((t) => t.isActive)),
    textEffects.forEach((t) => {
      t.update(), t.draw();
    });
  const t = (snake.timeLeft / ROUND_TIME) * canvas.width;
  (context.fillStyle = snake.timeLeft < 2e3 ? "red" : "#4CAF50"),
    context.fillRect(0, 0, t, 5),
    snake.checkCollision() && snake.gameOver(),
    answers.forEach((t) => t.draw()),
    snake.draw();
}
function updateScore(t) {
  const e = document.getElementById("scoreValue");
  (e.textContent = t),
    (e.style.fontSize = "32px"),
    e.classList.add("score-up"),
    setTimeout(() => e.classList.remove("score-up"), 500);
}
function updateMathQuestion(t) {
  const e = document.getElementById("mathQuestion");
  e.classList.add("question-change"),
    (e.textContent = t),
    setTimeout(() => e.classList.remove("question-change"), 300);
}
function showWrongAnswer(t) {
  const e = document.getElementById("wrongAnswer");
  (e.textContent = t),
    e.classList.add("show"),
    setTimeout(() => e.classList.remove("show"), 2e3);
}
function startGame() {
  snake.gameLoop && clearInterval(snake.gameLoop),
    snake.roundTimer && clearInterval(snake.roundTimer),
    snake.reset(),
    (canvas.style.display = "block"),
    mathProblem.generateNewProblem(),
    createAnswers(),
    (snake.gameLoop = setInterval(update, 120));
}
const snake = new Snake(),
  mathProblem = new MathProblem(snake);
let answers = [];
document.addEventListener("keydown", (t) => {
  const e = t.which || t.keyCode,
    s = snake.currentDirection;
  (37 !== e && 65 !== e) || "right" === s
    ? (38 !== e && 87 !== e) || "down" === s
      ? (39 !== e && 68 !== e) || "left" === s
        ? (40 !== e && 83 !== e) || "up" === s || (snake.nextDirection = "down")
        : (snake.nextDirection = "right")
      : (snake.nextDirection = "up")
    : (snake.nextDirection = "left");
}),
  document.addEventListener("keydown", (t) => {
    const e = t.key.toLowerCase(),
      s = { w: ".up-key", a: ".left-key", s: ".down-key", d: ".right-key" };
    if (s[e]) {
      document.querySelector(s[e]).classList.add("pressed");
    }
  }),
  document.addEventListener("keyup", (t) => {
    const e = t.key.toLowerCase(),
      s = { w: ".up-key", a: ".left-key", s: ".down-key", d: ".right-key" };
    if (s[e]) {
      document.querySelector(s[e]).classList.remove("pressed");
    }
  }),
  startButton.addEventListener("click", () => {
    const t = document.getElementById("playerName").value.trim(),
      e = document.getElementById("playerSection").value.trim(),
      s = document.getElementById("inputError");
    t && e
      ? ((snake.playerInfo = {
          name: t,
          section: e,
          timestamp: new Date().toISOString(),
        }),
        (startMenu.style.display = "none"),
        (s.style.display = "none"),
        startGame())
      : (s.style.display = "block");
  }),
  restartButton.addEventListener("click", () => {
    (deathScreen.style.display = "none"), startGame();
  }),
  (startMenu.style.display = "block");
let touchStartX = 0,
  touchStartY = 0;
const MIN_SWIPE_DISTANCE = 30;
canvas.addEventListener("touchstart", function (t) {
  (touchStartX = t.touches[0].clientX),
    (touchStartY = t.touches[0].clientY),
    t.preventDefault();
}),
  canvas.addEventListener("touchmove", function (t) {
    if (!touchStartX || !touchStartY) return;
    let e = t.touches[0].clientX,
      s = t.touches[0].clientY,
      n = e - touchStartX,
      o = s - touchStartY;
    if (Math.abs(n) < 30 && Math.abs(o) < 30) return;
    const a = snake.currentDirection;
    Math.abs(n) > Math.abs(o)
      ? n > 0 && "left" !== a
        ? (snake.nextDirection = "right")
        : n < 0 && "right" !== a && (snake.nextDirection = "left")
      : o > 0 && "up" !== a
      ? (snake.nextDirection = "down")
      : o < 0 && "down" !== a && (snake.nextDirection = "up"),
      (touchStartX = null),
      (touchStartY = null),
      t.preventDefault();
  });
const TOUCH_CONFIG = {
  minSwipeDistance: 30,
  debounceTime: 100,
  sensitivity: 1,
};
let lastTouchTime = 0;
function showThrobber() {
  const t = document.getElementById("throbber"),
    e = document.getElementById("game"),
    s = document.querySelector(".score"),
    n = document.getElementById("mathQuestion");
  t && (t.style.display = "flex"),
    e && (e.style.display = "none"),
    s && (s.style.display = "none"),
    n && (n.style.display = "none");
}
function hideThrobber() {
  const t = document.getElementById("throbber"),
    e = document.getElementById("game"),
    s = document.querySelector(".score"),
    n = document.getElementById("mathQuestion");
  t && (t.style.display = "none"),
    e && (e.style.display = "block"),
    s && (s.style.display = "block"),
    n && (n.style.display = "block");
}
canvas.addEventListener("touchstart", (t) => {
  (touchStartX = t.touches[0].clientX),
    (touchStartY = t.touches[0].clientY),
    t.preventDefault();
}),
  canvas.addEventListener("touchmove", (t) => {
    if (!touchStartX || !touchStartY) return;
    const e = Date.now();
    if (e - lastTouchTime < TOUCH_CONFIG.debounceTime) return;
    const s = (t.touches[0].clientX - touchStartX) * TOUCH_CONFIG.sensitivity,
      n = (t.touches[0].clientY - touchStartY) * TOUCH_CONFIG.sensitivity,
      o = snake.direction;
    (Math.abs(s) < TOUCH_CONFIG.minSwipeDistance &&
      Math.abs(n) < TOUCH_CONFIG.minSwipeDistance) ||
      (Math.abs(s) > Math.abs(n)
        ? s > 0 && "left" !== o
          ? (snake.nextDirection = "right")
          : s < 0 && "right" !== o && (snake.nextDirection = "left")
        : n > 0 && "up" !== o
        ? (snake.nextDirection = "down")
        : n < 0 && "down" !== o && (snake.nextDirection = "up"),
      (lastTouchTime = e),
      (touchStartX = null),
      (touchStartY = null),
      t.preventDefault());
  });

const swipeArea = document.querySelector('.swipe-area');
let activeArrow = null;

function activateArrow(direction) {
    // Remove active class from all arrows
    document.querySelectorAll('.swipe-indicator').forEach(arrow => {
        arrow.classList.remove('active');
    });
    
    // Add active class to the current direction
    const arrowClass = `${direction}-arrow`;
    const arrow = document.querySelector(`.${arrowClass}`);
    if (arrow) {
        arrow.classList.add('active');
        activeArrow = arrow;
    }
}

swipeArea.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
});

swipeArea.addEventListener('touchmove', (e) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE) return;

    const currentDirection = snake.currentDirection;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && currentDirection !== 'left') {
            snake.nextDirection = 'right';
            activateArrow('right');
        } else if (deltaX < 0 && currentDirection !== 'right') {
            snake.nextDirection = 'left';
            activateArrow('left');
        }
    } else {
        if (deltaY > 0 && currentDirection !== 'up') {
            snake.nextDirection = 'down';
            activateArrow('down');
        } else if (deltaY < 0 && currentDirection !== 'down') {
            snake.nextDirection = 'up';
            activateArrow('up');
        }
    }

    touchStartX = null;
    touchStartY = null;
    e.preventDefault();
});

swipeArea.addEventListener('touchend', () => {
    if (activeArrow) {
        setTimeout(() => {
            activeArrow.classList.remove('active');
            activeArrow = null;
        }, 200);
    }
});
