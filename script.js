const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("bestScore");
const overlay = document.getElementById("overlay");
const overlayLabel = document.getElementById("overlayLabel");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");

const gridSize = 20;
const cellCount = canvas.width / gridSize;
let snake, food, direction, nextDirection, score, timer;
let bestScore = Number(localStorage.getItem("snakeBestScore")) || 0;
let isPaused = false;
let isRunning = false;
bestScoreElement.textContent = bestScore;

function resetGame() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreElement.textContent = "0";
    generateFood();
    draw();
}

function generateFood() {
    do {
        food = {
            x: Math.floor(Math.random() * cellCount),
            y: Math.floor(Math.random() * cellCount)
        };
    } while (snake.some(part => part.x === food.x && part.y === food.y));
}

function drawGrid() {
    ctx.fillStyle = "#0a1728";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(154,190,210,.055)";
    ctx.lineWidth = 1;
    for (let i = 1; i < cellCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

function drawCell(x, y, color, radius) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x * gridSize + 1.5, y * gridSize + 1.5, gridSize - 3, gridSize - 3, radius);
    ctx.fill();
}

function draw() {
    drawGrid();
    drawCell(food.x, food.y, "#ff5e7a", 8);
    ctx.beginPath();
    ctx.arc(food.x * gridSize + 10, food.y * gridSize + 10, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd166";
    ctx.fill();
    snake.forEach((part, index) => drawCell(part.x, part.y, index === 0 ? "#6ee7c1" : "#3ecda6", index === 0 ? 7 : 5));
}

function update() {
    if (!isRunning || isPaused) return;
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const hitWall = head.x < 0 || head.x >= cellCount || head.y < 0 || head.y >= cellCount;
    const hitSelf = snake.some(part => part.x === head.x && part.y === head.y);

    if (hitWall || hitSelf) {
        endGame();
        return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem("snakeBestScore", bestScore);
        }
        generateFood();
    } else {
        snake.pop();
    }
    draw();
}

function startGame() {
    clearInterval(timer);
    resetGame();
    overlay.classList.add("hidden");
    isRunning = true;
    isPaused = false;
    pauseButton.classList.add("is-playing");
    timer = setInterval(update, 130);
}

function endGame() {
    clearInterval(timer);
    isRunning = false;
    pauseButton.classList.remove("is-playing");
    overlayLabel.textContent = "GAME OVER";
    overlayTitle.textContent = `${score} Points`;
    overlayText.textContent = score > 0 && score === bestScore ? "New best score!" : "Try again and beat your best.";
    playButton.textContent = "Play Again";
    overlay.classList.remove("hidden");
}

function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    pauseButton.classList.toggle("is-playing", !isPaused);
    overlayLabel.textContent = "GAME PAUSED";
    overlayTitle.textContent = "Take a break";
    overlayText.textContent = "Your progress is safe.";
    playButton.textContent = "Resume";
    overlay.classList.toggle("hidden", !isPaused);
}

function changeDirection(next) {
    if (!isRunning || isPaused) return;
    const directions = {
        up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
        left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    const proposed = directions[next];
    if (proposed.x !== -direction.x || proposed.y !== -direction.y) nextDirection = proposed;
}

document.addEventListener("keydown", event => {
    const keyMap = {
        ArrowUp: "up", w: "up", W: "up",
        ArrowDown: "down", s: "down", S: "down",
        ArrowLeft: "left", a: "left", A: "left",
        ArrowRight: "right", d: "right", D: "right"
    };
    if (keyMap[event.key]) {
        event.preventDefault();
        changeDirection(keyMap[event.key]);
    } else if (event.key === " " || event.key.toLowerCase() === "p") {
        event.preventDefault();
        togglePause();
    }
});

document.querySelectorAll("[data-direction]").forEach(button => {
    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        button.classList.add("active");
        changeDirection(button.dataset.direction);
    });
    button.addEventListener("pointerup", () => button.classList.remove("active"));
    button.addEventListener("pointercancel", () => button.classList.remove("active"));
    button.addEventListener("pointerleave", () => button.classList.remove("active"));
});

playButton.addEventListener("click", () => isPaused ? togglePause() : startGame());
pauseButton.addEventListener("click", togglePause);

let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener("pointerdown", event => {
    touchStartX = event.clientX;
    touchStartY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener("pointerup", event => {
    const deltaX = event.clientX - touchStartX;
    const deltaY = event.clientY - touchStartY;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 20) return;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        changeDirection(deltaX > 0 ? "right" : "left");
    } else {
        changeDirection(deltaY > 0 ? "down" : "up");
    }
}, { passive: true });

resetGame();