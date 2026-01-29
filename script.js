// --- DOM ---
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const winLineEl = document.getElementById("winLine");
const starterModeEl = document.getElementById("starterMode");
const tieModeEl = document.getElementById("tieMode");
// --- Game state ---
let board = Array(9).fill(""); // indices 0..8
let currentPlayer = "X";
let gameOver = false;
let starterThisGame = "X";   // who started the current game
let lastStarter = "X";       // who started the previous completed/aborted game
let lastResult = null;       // "X", "O", "draw", "reset"

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6]             // diagonals
];

function init() {
  // Remove only existing cells (keep winLine overlay in the board)
  boardEl.querySelectorAll(".cell").forEach(c => c.remove());

  // Create 9 buttons once
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement("button");
    btn.className = "cell";
    btn.type = "button";
    btn.dataset.index = String(i);
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", `Cell ${i + 1}`);
    btn.setAttribute("data-key", String(i + 1));
    btn.addEventListener("click", onCellClick);

    

    boardEl.appendChild(btn);
  }

  restartBtn.addEventListener("click", () => requestRestart(true));
  window.addEventListener("keydown", onKeyDown);

  resetGame();
}
function resetGame() {
  board = Array(9).fill("");
  gameOver = false;
  clearWinningEffects();

  // Clear UI
  const cells = getCells();
  cells.forEach((c) => {
    c.textContent = "";
    c.disabled = false;
    c.classList.remove("win", "xMark", "oMark");
  });
  currentPlayer = computeNextStarter();
  starterThisGame = currentPlayer;
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
  e.currentTarget.classList.add(currentPlayer === "X" ? "xMark" : "oMark");

  // Check win/draw
  const winLine = getWinningLine(board);
  if (winLine) {
  const winner = board[winLine[0]];
  recordGameOutcome(winner);
  gameOver = true;

  updateStatus(`${winner} wins!`);
  highlightWinningCells(winLine);
  setWinLineColor(winner);
  drawWinLine(winLine);
  disableAllCells();

  // Let the UI update before the blocking alert shows
  setTimeout(() => alert(`${winner} wins!`), 50);
  return;
  }

  if (isDraw(board)) {
    recordGameOutcome("draw");
    gameOver = true;
    updateStatus("Draw!");
    setTimeout(() => alert("Draw!"), 50);
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
  requestRestart(true);
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

function getWinningLine(b) {
  for (const line of WIN_LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return line;
  }
  return null;
}
function highlightWinningCells(indices) {
  indices.forEach((i) => {
    const cellBtn = boardEl.querySelector(`.cell[data-index="${i}"]`);
    if (cellBtn) cellBtn.classList.add("win");
  });
}

function clearWinningEffects() {
  // remove cell highlights
  boardEl.querySelectorAll(".cell.win").forEach((c) => c.classList.remove("win"));

  // hide line
  if (winLineEl) {
    winLineEl.classList.add("hidden");
    winLineEl.classList.remove("xWin", "oWin");
    winLineEl.style.width = "0px";
    winLineEl.style.left = "0px";
    winLineEl.style.top = "0px";
    winLineEl.style.transform = "translateY(-50%) rotate(0deg)";
    
  }
}

function drawWinLine(indices) {
  if (!winLineEl) return;

  const startIdx = indices[0];
  const endIdx = indices[2];

  const startCell = boardEl.querySelector(`.cell[data-index="${startIdx}"]`);
  const endCell = boardEl.querySelector(`.cell[data-index="${endIdx}"]`);
  if (!startCell || !endCell) return;

  const boardRect = boardEl.getBoundingClientRect();
  const sRect = startCell.getBoundingClientRect();
  const eRect = endCell.getBoundingClientRect();

  // center points relative to the board
  const sx = (sRect.left + sRect.right) / 2 - boardRect.left;
  const sy = (sRect.top + sRect.bottom) / 2 - boardRect.top;
  const ex = (eRect.left + eRect.right) / 2 - boardRect.left;
  const ey = (eRect.top + eRect.bottom) / 2 - boardRect.top;

  const dx = ex - sx;
  const dy = ey - sy;
  const length = Math.hypot(dx, dy);
  const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

  winLineEl.classList.remove("hidden");
  winLineEl.style.left = `${sx}px`;
  winLineEl.style.top = `${sy}px`;
  winLineEl.style.width = `${length}px`;
  winLineEl.style.transform = `translateY(-50%) rotate(${angleDeg}deg)`;
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
function setWinLineColor(winner) {
  if (!winLineEl) return;
  winLineEl.classList.remove("xWin", "oWin");
  winLineEl.classList.add(winner === "O" ? "oWin" : "xWin");
}
function opposite(p) {
  return p === "X" ? "O" : "X";
}

function tieBreakStarter() {
  const t = tieModeEl.value;
  if (t === "x") return "X";
  if (t === "o") return "O";
  if (t === "switch") return opposite(lastStarter || "X");
  // "same"
  return lastStarter || "X";
}

function computeNextStarter() {
  const mode = starterModeEl.value;
  if (lastResult === null) return "X";
  if (mode === "x") return "X";
  if (mode === "o") return "O";

  if (mode === "alt") {
    return opposite(lastStarter || "X");
  }

  // winner/loser depend on lastResult; ties/resets use tie-break rules
  const lastWasWin = lastResult === "X" || lastResult === "O";
  if (!lastWasWin) return tieBreakStarter();

  if (mode === "winner") return lastResult;           // winner starts next
  if (mode === "loser") return opposite(lastResult);  // loser starts next

  return "X";
}

function recordGameOutcome(outcome) {
  // outcome: "X" | "O" | "draw" | "reset"
  lastStarter = starterThisGame;
  lastResult = outcome;
}
// Start
init();

function requestRestart(userInitiated = true) {
  const anyMoves = board.some(v => v !== "");

  // If user restarts mid-game, record it as "reset"
  if (!gameOver && anyMoves && userInitiated) {
    recordGameOutcome("reset");
  }

  resetGame();
}