"use strict";

const CONFIG = {
  gridSize: 20,
  storageKeys: {
    highScore: "little-arcade-snake-high-score",
    difficulty: "little-arcade-snake-difficulty",
    sound: "little-arcade-snake-sound",
    stats: "little-arcade-snake-stats",
  },
  defaultDifficulty: "normal",
  startingSpeedMs: {
    easy: 170,
    normal: 125,
    hard: 90,
  },
  scorePerFood: 10,
  foodsPerSpeedIncrease: 5,
  speedIncreaseMs: 8,
  minimumSpeedMs: 55,
  swipeThreshold: 22,
  sounds: {
    foodFrequency: 660,
    gameOverFrequency: 180,
    durationSeconds: 0.12,
  },
  colors: {
    board: "#131d27",
    grid: "rgb(169 198 191 / 5%)",
    food: "#ff8a77",
    foodHighlight: "#ffd0a6",
    snakeHead: "#a3f0c2",
    snakeBody: "#65ce98",
    snakeHeadGlow: "rgb(121 225 170 / 36%)",
    snakeEye: "#18352b",
  },
};
const DIRECTIONS = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};
const KEY_DIRECTIONS = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowRight: "right",
  KeyD: "right",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
};

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const board = document.querySelector(".board");
const scoreElement = document.querySelector("#score");
const highScoreElement = document.querySelector("#high-score");
const gamesPlayedElement = document.querySelector("#games-played");
const foodEatenElement = document.querySelector("#food-eaten");
const gamesWonElement = document.querySelector("#games-won");
const statusElement = document.querySelector("#game-status");
const difficultySelect = document.querySelector("#difficulty");
const soundButton = document.querySelector("#sound-button");
const pauseButton = document.querySelector("#pause-button");
const pauseButtonLabel = document.querySelector("#pause-button-label");
const overlay = document.querySelector("#game-overlay");
const overlayIcon = document.querySelector("#overlay-icon");
const overlayEyebrow = document.querySelector("#overlay-eyebrow");
const overlayTitle = document.querySelector("#overlay-title");
const overlayMessage = document.querySelector("#overlay-message");
const overlayButton = document.querySelector("#overlay-button");
const directionButtons = document.querySelectorAll("[data-direction]");

let snake = [];
let food = null;
let direction = DIRECTIONS.right;
let nextDirection = DIRECTIONS.right;
let turnQueued = false;
let score = 0;
let storageAvailable = true;
let highScore = readHighScore();
let stats = readStats();
let soundEnabled = readSoundPreference();
let audioContext = null;
let gameState = "ready";
let accumulator = 0;
let previousFrame = 0;
let pointerStart = null;

function readPreference(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    storageAvailable = false;
    return null;
  }
}

function readHighScore() {
  try {
    const savedScore = Number(localStorage.getItem(CONFIG.storageKeys.highScore));
    return Number.isFinite(savedScore) && savedScore > 0 ? savedScore : 0;
  } catch {
    storageAvailable = false;
    return 0;
  }
}

function saveHighScore() {
  try {
    localStorage.setItem(CONFIG.storageKeys.highScore, String(highScore));
  } catch {
    storageAvailable = false;
  }
}

function readStats() {
  try {
    const savedStats = JSON.parse(
      localStorage.getItem(CONFIG.storageKeys.stats) || "{}",
    );
    return {
      gamesPlayed: validStat(savedStats.gamesPlayed),
      foodEaten: validStat(savedStats.foodEaten),
      gamesWon: validStat(savedStats.gamesWon),
    };
  } catch {
    storageAvailable = false;
    return { gamesPlayed: 0, foodEaten: 0, gamesWon: 0 };
  }
}

function validStat(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function saveStats() {
  try {
    localStorage.setItem(CONFIG.storageKeys.stats, JSON.stringify(stats));
  } catch {
    storageAvailable = false;
  }
}

function readSoundPreference() {
  return readPreference(CONFIG.storageKeys.sound) === "on";
}

function updateStatsDisplay() {
  gamesPlayedElement.textContent = String(stats.gamesPlayed);
  foodEatenElement.textContent = String(stats.foodEaten);
  gamesWonElement.textContent = String(stats.gamesWon);
}

function updateSoundButton() {
  soundButton.textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
}

function toggleSound() {
  if (!("AudioContext" in window)) {
    setStatus("Sound effects are not supported in this browser.");
    return;
  }

  soundEnabled = !soundEnabled;
  updateSoundButton();
  if (soundEnabled) {
    if (!audioContext) {
      audioContext = new window.AudioContext();
    }
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }
  }
  try {
    localStorage.setItem(CONFIG.storageKeys.sound, soundEnabled ? "on" : "off");
  } catch {
    storageAvailable = false;
  }
  setStatus(`Sound effects ${soundEnabled ? "on" : "off"}.`);
}

function playSound(type) {
  if (!soundEnabled || !("AudioContext" in window)) {
    return;
  }

  if (!audioContext) {
    audioContext = new window.AudioContext();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  const startTime = audioContext.currentTime;
  const frequency =
    type === "food"
      ? CONFIG.sounds.foodFrequency
      : CONFIG.sounds.gameOverFrequency;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  volume.gain.setValueAtTime(0.0001, startTime);
  volume.gain.exponentialRampToValueAtTime(0.12, startTime + 0.015);
  volume.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + CONFIG.sounds.durationSeconds,
  );
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + CONFIG.sounds.durationSeconds);
}

function setStatus(message) {
  statusElement.textContent = storageAvailable
    ? message
    : `${message} High score saving is unavailable in this browser.`;
}

function updateScoreboard() {
  scoreElement.textContent = String(score);
  highScoreElement.textContent = String(highScore);
}

function initGame() {
  const middle = Math.floor(CONFIG.gridSize / 2);
  snake = [
    { x: middle + 1, y: middle },
    { x: middle, y: middle },
    { x: middle - 1, y: middle },
  ];
  direction = DIRECTIONS.right;
  nextDirection = DIRECTIONS.right;
  turnQueued = false;
  score = 0;
  food = spawnFood();
  updateScoreboard();
  draw();
}

function startGame() {
  initGame();
  gameState = "playing";
  accumulator = 0;
  previousFrame = 0;
  renderOverlay();
  updatePauseButton();
  setStatus("Game on. Collect the glowing dots.");
}

function pauseGame() {
  if (gameState !== "playing") {
    return;
  }
  gameState = "paused";
  accumulator = 0;
  renderOverlay();
  updatePauseButton();
  setStatus("Game paused. Press Space or Resume when you're ready.");
}

function resumeGame() {
  if (gameState !== "paused") {
    return;
  }
  gameState = "playing";
  accumulator = 0;
  previousFrame = 0;
  renderOverlay();
  updatePauseButton();
  setStatus("Game resumed.");
}

function finishGame(won = false) {
  if (gameState !== "playing") {
    return;
  }

  gameState = won ? "won" : "over";
  stats.gamesPlayed += 1;
  if (won) {
    stats.gamesWon += 1;
  }
  saveStats();
  updateStatsDisplay();
  if (!won) {
    playSound("gameOver");
  }
  accumulator = 0;
  renderOverlay();
  updatePauseButton();
  setStatus(
    won
      ? `Board cleared! Final score: ${score}. High score: ${highScore}.`
      : `Game over. Final score: ${score}. High score: ${highScore}.`,
  );
}

function spawnFood() {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const emptyCells = [];

  for (let y = 0; y < CONFIG.gridSize; y += 1) {
    for (let x = 0; x < CONFIG.gridSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        emptyCells.push({ x, y });
      }
    }
  }

  if (emptyCells.length === 0) {
    return null;
  }
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function getTickDuration() {
  const baseSpeed =
    CONFIG.startingSpeedMs[difficultySelect.value] ?? CONFIG.startingSpeedMs.normal;
  const foodsEaten = Math.floor(score / CONFIG.scorePerFood);
  const speedIncrease =
    Math.floor(foodsEaten / CONFIG.foodsPerSpeedIncrease) * CONFIG.speedIncreaseMs;
  return Math.max(CONFIG.minimumSpeedMs, baseSpeed - speedIncrease);
}

function update() {
  direction = nextDirection;
  turnQueued = false;

  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };
  const eating = food !== null && newHead.x === food.x && newHead.y === food.y;

  if (checkCollision(newHead, eating)) {
    finishGame();
    return;
  }

  snake.unshift(newHead);
  if (eating) {
    score += CONFIG.scorePerFood;
    stats.foodEaten += 1;
    saveStats();
    updateStatsDisplay();
    playSound("food");
    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }
    food = spawnFood();
    updateScoreboard();
    if (food === null) {
      draw();
      finishGame(true);
      return;
    }
    setStatus(`Score ${score}. Nice catch!`);
  } else {
    snake.pop();
  }

  draw();
}

function checkCollision(head, eating) {
  if (
    head.x < 0
    || head.x >= CONFIG.gridSize
    || head.y < 0
    || head.y >= CONFIG.gridSize
  ) {
    return true;
  }

  const bodyToCheck = eating ? snake : snake.slice(0, -1);
  return bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y);
}

function queueDirection(name) {
  if (gameState !== "playing" || turnQueued) {
    return;
  }

  const candidate = DIRECTIONS[name];
  if (!candidate || (candidate.x === -direction.x && candidate.y === -direction.y)) {
    return;
  }

  nextDirection = candidate;
  turnQueued = true;
}

function togglePause() {
  if (gameState === "playing") {
    pauseGame();
  } else if (gameState === "paused") {
    resumeGame();
  }
}

function updatePauseButton() {
  const isActive = gameState === "playing" || gameState === "paused";
  pauseButton.disabled = !isActive;
  pauseButtonLabel.textContent = gameState === "paused" ? "Resume" : "Pause";
  pauseButton.querySelector("[aria-hidden='true']").textContent =
    gameState === "paused" ? "▶" : "Ⅱ";
}

function renderOverlay() {
  const overlayContent = {
    ready: {
      icon: "✳",
      eyebrow: "READY WHEN YOU ARE",
      title: "A little snack?",
      message: "Collect the glowing dots. Try not to bump into yourself.",
      button: "Play",
    },
    paused: {
      icon: "Ⅱ",
      eyebrow: "TAKE YOUR TIME",
      title: "On pause",
      message: "Your snake is taking a breather. Pick up where you left off?",
      button: "Resume",
    },
    over: {
      icon: "↻",
      eyebrow: "THAT WAS A GOOD RUN",
      title: "Oops, snake!",
      message: `Final score: ${score}. High score: ${highScore}.`,
      button: "Play again",
    },
    won: {
      icon: "✦",
      eyebrow: "INCREDIBLE",
      title: "Board cleared!",
      message: `Final score: ${score}. High score: ${highScore}.`,
      button: "Play again",
    },
  };
  const content = overlayContent[gameState];
  const isPlaying = gameState === "playing";

  overlay.classList.toggle("is-hidden", isPlaying);
  if (isPlaying) {
    return;
  }

  overlayIcon.textContent = content.icon;
  overlayEyebrow.textContent = content.eyebrow;
  overlayTitle.textContent = content.title;
  overlayMessage.textContent = content.message;
  overlayButton.innerHTML = `${content.button}<span aria-hidden="true">→</span>`;
}

function draw() {
  if (!context) {
    return;
  }

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const cellSize = width / CONFIG.gridSize;

  context.clearRect(0, 0, width, height);
  context.fillStyle = CONFIG.colors.board;
  context.fillRect(0, 0, width, height);
  drawGrid(width, height, cellSize);
  if (food) {
    drawFood(food, cellSize);
  }
  snake.forEach((segment, index) => drawSegment(segment, index, cellSize));
}

function drawGrid(width, height, cellSize) {
  context.beginPath();
  context.strokeStyle = CONFIG.colors.grid;
  context.lineWidth = 1;
  for (let index = 1; index < CONFIG.gridSize; index += 1) {
    const position = Math.round(index * cellSize) + 0.5;
    context.moveTo(position, 0);
    context.lineTo(position, height);
    context.moveTo(0, position);
    context.lineTo(width, position);
  }
  context.stroke();
}

function drawFood(position, cellSize) {
  const centerX = (position.x + 0.5) * cellSize;
  const centerY = (position.y + 0.5) * cellSize;
  const radius = cellSize * 0.27;

  context.save();
  context.shadowColor = CONFIG.colors.food;
  context.shadowBlur = cellSize * 0.55;
  context.fillStyle = CONFIG.colors.food;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = CONFIG.colors.foodHighlight;
  context.beginPath();
  context.arc(centerX - radius * 0.26, centerY - radius * 0.28, radius * 0.24, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawSegment(segment, index, cellSize) {
  const inset = cellSize * (index === 0 ? 0.1 : 0.13);
  const size = cellSize - inset * 2;
  const x = segment.x * cellSize + inset;
  const y = segment.y * cellSize + inset;

  context.fillStyle = index === 0 ? CONFIG.colors.snakeHead : CONFIG.colors.snakeBody;
  context.shadowColor = index === 0 ? CONFIG.colors.snakeHeadGlow : "transparent";
  context.shadowBlur = index === 0 ? cellSize * 0.22 : 0;
  fillRoundedRect(x, y, size, size, cellSize * 0.24);
  context.shadowBlur = 0;

  if (index === 0) {
    drawEyes(x, y, size, cellSize);
  }
}

function fillRoundedRect(x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
  context.fill();
}

function drawEyes(x, y, size, cellSize) {
  const eyeRadius = cellSize * 0.055;
  const forwardX = direction.x * size * 0.2;
  const forwardY = direction.y * size * 0.2;
  const sideX = direction.y * size * 0.2;
  const sideY = -direction.x * size * 0.2;
  const centerX = x + size / 2 + forwardX;
  const centerY = y + size / 2 + forwardY;

  context.fillStyle = CONFIG.colors.snakeEye;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.arc(
      centerX + sideX * side,
      centerY + sideY * side,
      eyeRadius,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  draw();
}

function gameLoop(timestamp) {
  if (previousFrame === 0) {
    previousFrame = timestamp;
  }
  const elapsed = Math.min(timestamp - previousFrame, 250);
  previousFrame = timestamp;

  if (gameState === "playing") {
    accumulator += elapsed;
    while (accumulator >= getTickDuration() && gameState === "playing") {
      accumulator -= getTickDuration();
      update();
    }
  }

  window.requestAnimationFrame(gameLoop);
}

function handleKeydown(event) {
  if (event.target instanceof HTMLSelectElement) {
    return;
  }

  if (event.code === "Space" && (gameState === "playing" || gameState === "paused")) {
    event.preventDefault();
    togglePause();
    return;
  }

  if (event.code === "Enter" && gameState !== "playing") {
    event.preventDefault();
    if (gameState === "paused") {
      resumeGame();
    } else {
      startGame();
    }
    return;
  }

  const directionName = KEY_DIRECTIONS[event.code];
  if (directionName) {
    event.preventDefault();
    queueDirection(directionName);
    return;
  }

  if (event.code === "Space") {
    return;
  } else if (event.code === "Escape" && gameState === "playing") {
    pauseGame();
  }
}

function handleSwipe(start, end) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < CONFIG.swipeThreshold) {
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    queueDirection(deltaX > 0 ? "right" : "left");
  } else {
    queueDirection(deltaY > 0 ? "down" : "up");
  }
}

if (!context) {
  setStatus("This browser does not support the canvas needed to play Snake.");
  pauseButton.disabled = true;
  overlayButton.disabled = true;
  directionButtons.forEach((button) => {
    button.disabled = true;
  });
} else {
  const savedDifficulty = readPreference(CONFIG.storageKeys.difficulty);
  if (Object.hasOwn(CONFIG.startingSpeedMs, savedDifficulty)) {
    difficultySelect.value = savedDifficulty;
  } else {
    difficultySelect.value = CONFIG.defaultDifficulty;
  }

  highScoreElement.textContent = String(highScore);
  updateStatsDisplay();
  updateSoundButton();
  if (!("AudioContext" in window)) {
    soundButton.disabled = true;
    soundButton.title = "Sound effects are not supported in this browser.";
  }
  initGame();
  renderOverlay();
  updatePauseButton();
  resizeCanvas();

  overlayButton.addEventListener("click", () => {
    if (gameState === "paused") {
      resumeGame();
    } else {
      startGame();
    }
  });
  pauseButton.addEventListener("click", togglePause);
  soundButton.addEventListener("click", toggleSound);
  difficultySelect.addEventListener("change", () => {
    try {
      localStorage.setItem(
        CONFIG.storageKeys.difficulty,
        difficultySelect.value,
      );
    } catch {
      storageAvailable = false;
      setStatus("Difficulty changed. This preference cannot be saved.");
    }
  });
  directionButtons.forEach((button) => {
    button.addEventListener("click", () => queueDirection(button.dataset.direction));
  });
  document.addEventListener("keydown", handleKeydown);
  board.addEventListener("pointerdown", (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  board.addEventListener("pointerup", (event) => {
    if (pointerStart) {
      handleSwipe(pointerStart, { x: event.clientX, y: event.clientY });
      pointerStart = null;
    }
  });
  board.addEventListener("pointercancel", () => {
    pointerStart = null;
  });
  window.addEventListener("resize", resizeCanvas);
  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeCanvas).observe(board);
  }
  window.requestAnimationFrame(gameLoop);

  setStatus("Choose a difficulty and press Play to start.");
}
