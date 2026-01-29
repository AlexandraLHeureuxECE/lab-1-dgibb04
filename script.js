// --- DOM ---
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

// --- Game state ---
let board = Array(9).fill(""); // indices 0..8
let currentPlayer = "X";
let gameOver = false;

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6]             // diagonals
];

function init() {
  // Create 9 buttons once
  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement("button");
    btn.className = "cell";
    btn.type = "button";
    btn.dataset.index = String(i);
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", `Cell ${i + 1}`);
    btn.addEventListener("click", onCellClick);
    // small bottom-right key label (1..9)
    const keyLabel = document.createElement("span");
    keyLabel.className = "cellKey";
    keyLabel.textContent = String(i + 1);
    btn.appendChild(keyLabel);
    boardEl.appendChild(btn);
  }

  restartBtn.addEventListener("click", resetGame);
  window.addEventListener("keydown", onKeyDown);

  resetGame();
}

function resetGame() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;

  // Clear UI
  const cells = getCells();
  cells.forEach((c) => {
    c.textContent = "";
    c.disabled = false;
  });

  updateStatus(`Turn: ${currentPlayer}`);
}

function onCellClick(e) {
  if (gameOver) return;

  const idx = Number(e.currentTarget.dataset.index);

  // Guard: cell already taken
  if (board[idx] !== "") return;

  // Place mark
  board[idx] = currentPlayer;
  e.currentTarget.textContent = currentPlayer;
  e.currentTarget.disabled = true;

  // Check win/draw
  const winner = getWinner(board);
  if (winner) {
    gameOver = true;
    updateStatus(`${winner} wins!`);
    disableAllCells();
    return;
  }

  if (isDraw(board)) {
    gameOver = true;
    updateStatus("Draw!");
    return;
  }

  // Next turn
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateStatus(`Turn: ${currentPlayer}`);
}
function onKeyDown(e) {
  if (!e.key) return;

  const key = e.key.toLowerCase();

  // R = restart
  if (key === "r") {
    resetGame();
    return;
  }

  // 1..9 = place mark in that cell
  if (key >= "1" && key <= "9") {
    if (gameOver) return;

    const idx = Number(key) - 1; // 1->0, 9->8

    // If cell already taken, ignore
    if (board[idx] !== "") return;

    // Trigger the same logic as a click, without duplicating code
    const cellBtn = boardEl.querySelector(`.cell[data-index="${idx}"]`);
    if (cellBtn) cellBtn.click();
  }
}

function getWinner(b) {
  for (const [a, c, d] of WIN_LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

function isDraw(b) {
  return b.every((cell) => cell !== "");
}

function disableAllCells() {
  getCells().forEach((c) => (c.disabled = true));
}

function getCells() {
  return Array.from(boardEl.querySelectorAll(".cell"));
}

function updateStatus(text) {
  statusEl.textContent = text;
}

// Start
init();