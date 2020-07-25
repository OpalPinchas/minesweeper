'use strict';

var MINE = '💣';
var EMPTY = ' ';
var FLAG = '🚩';
var HAPPY = '😃';
var SAD = '😟';
var WINNER = '😎';

var gBoard = null;
var gMineCount;
var gIsHint = false;
var gHintsCount;
var gLivesCount;
var gSafeClicksCount;
var gMinesPos;
var gEmptyCells;
var gSecInteral;
var gIsFirstClick = true;

var gLevel = {
  SIZE: 0,
  MINES: 0,
};

var gGame = {
  isOn: false,
  shownCell: 0,
  markedCell: 0,
  secsPassed: 0,
};

window.addEventListener(
  'contextmenu',
  function (e) {
    e.preventDefault();
  },
  false
);

function initGame(size = 8, mines = 12) {
  var elRestart = document.querySelector('.restart-game');
  elRestart.innerText = HAPPY;

  clearInterval(gSecInteral);

  gBoard = null;
  gGame.isOn = true;
  gGame.shownCell = 0;
  gGame.markedCell = 0;
  gGame.secsPassed = 0;

  gLevel.SIZE = size;
  gLevel.MINES = mines;

  gIsFirstClick = true;
  gIsHint = false;
  gMinesPos = [];
  gEmptyCells = [];
  gLivesCount = 3;
  gSafeClicksCount = 3;
  document.querySelector('.safe-clicks-count').innerText = gSafeClicksCount;
  document.querySelector('.lives').innerText = gLivesCount;
  document.querySelector('.timer').innerText = '00';

  gBoard = buildBoard();
  renderBoard(gBoard);
  resetHints();
}

function resetHints() {
  var elHints = document.querySelectorAll('.hint');
  for (var i = 0; i < elHints.length; i++) {
    var elHint = elHints[i];
    elHint.style.display = 'inline-block';
  }
  gHintsCount = 0;
}

function resetGame() {
  initGame(gLevel.SIZE, gLevel.MINES);
}

function buildBoard() {
  var board = [];
  var length = gLevel.SIZE;

  for (var i = 0; i < length; i++) {
    board[i] = [];
    var row = board[i];
    for (var j = 0; j < length; j++) {
      row[j] = createCell();
    }
  }
  return board;
}

function renderBoard(board) {
  var length = board.length;

  var strHTML = '<table class="board" ><tbody>';
  for (var i = 0; i < length; i++) {
    var row = board[i];
    strHTML += '<tr>';
    for (var j = 0; j < length; j++) {
      var className = `cell cover pos-${i}-${j}`;
      strHTML += `<td class="${className}"
             onclick="cellClicked(this, ${i}, ${j})"
             oncontextmenu="markCell(this, ${i}, ${j})"
             ></td>`;
    }
    strHTML += '</tr>';
  }
  strHTML += '</tbody></table>';
  var elBoardContainer = document.querySelector('.board-container');
  elBoardContainer.innerHTML = strHTML;
}

function updateSec() {
  gGame.secsPassed++;
  var elTimer = document.querySelector('.timer');
  elTimer.innerText = gGame.secsPassed;
}

function cellClicked(elCell, i, j) {
  if (gIsFirstClick) {
    gBoard[i][j].isFirst = true;
    onFirstClick();
  }

  if (!gGame.isOn) return;
  if (gIsHint) {
    shownCellHint(i, j);
    return;
  }

  var cell = gBoard[i][j];
  if (cell.isShown) return;
  if (cell.isMarked) return;
  var symbol = cell.isMine ? MINE : cell.minesAroundCount;
  cell.symbol = symbol;
  cell.isShown = true;
  gGame.shownCell++;
  renderCell(elCell, cell);
  if (cell.minesAroundCount === 0 && !cell.isMine) {
    expandShown(gBoard, elCell, i, j);
  }
  if (symbol === MINE) {
    gLivesCount--;
    document.querySelector('.lives').innerText = gLivesCount;
  }
  checkGameOver();
}

function shownCellHint(i, j) {
  gIsHint = false;
  var clickedCellPos = { i: i, j: j };
  for (var i = clickedCellPos.i - 1; i <= clickedCellPos.i + 1; i++) {
    if (i < 0) continue;
    if (i > gBoard.length - 1) continue;

    var row = gBoard[i];
    for (var j = clickedCellPos.j - 1; j <= clickedCellPos.j + 1; j++) {
      if (j < 0) continue;
      if (j > gBoard.length - 1) continue;
      var cell = row[j];
      if (cell.isShown || cell.isMarked) continue;

      var elCell = document.querySelector(`.pos-${i}-${j}`);
      elCell.classList.remove('cover');
      elCell.innerText = cell.isMine ? MINE : cell.minesAroundCount;
    }
  }
  setTimeout(function () {
    for (var i = clickedCellPos.i - 1; i <= clickedCellPos.i + 1; i++) {
      var row = gBoard[i];
      if (i < 0 || i > gBoard.length - 1) continue;
      var row = gBoard[i];
      for (var j = clickedCellPos.j - 1; j <= clickedCellPos.j + 1; j++) {
        if (j < 0 || j > gBoard.length - 1) continue;
        var cell = row[j];
        if (cell.isShown || cell.isMarked) continue;

        var elCell = document.querySelector(`.pos-${i}-${j}`);
        elCell.classList.add('cover');
        elCell.innerText = EMPTY;
      }
    }
  }, 1000);
}

function onFirstClick() {
  gIsFirstClick = false;
  setMines(gBoard, gLevel.MINES);
  gSecInteral = setInterval(updateSec, 1000);
}

function markCell(elCell, i, j) {
  if (!gGame.isOn) return;
  if (gIsFirstClick) {
    onFirstClick();
  }
  var cell = gBoard[i][j];
  if (cell.isShown) return;
  cell.isMarked = cell.isMarked ? false : true;
  cell.symbol = cell.isMarked ? FLAG : EMPTY;
  if (cell.isMine && cell.isMarked) {
    gGame.markedCell++;
  } else if (cell.isMine && !cell.isMarked) {
    gGame.markedCell--;
  }
  console.log(gGame.markedCell);
  renderCell(elCell, cell);
  checkGameOver();
}

function renderCell(elCell, cell) {
  if (cell.isShown) {
    elCell.classList.remove('cover');
    elCell.innerText = cell.symbol;
  } else {
    elCell.innerText = cell.symbol;
  }
}

function expandShown(board, elcell, i, j) {
  var emptyCellPos = { i: i, j: j };
  for (var i = emptyCellPos.i - 1; i <= emptyCellPos.i + 1; i++) {
    if (i < 0) continue;
    if (i > board.length - 1) continue;
    for (var j = emptyCellPos.j - 1; j <= emptyCellPos.j + 1; j++) {
      if (j < 0) continue;
      if (j > board.length - 1) continue;
      if (j === emptyCellPos.j && i === emptyCellPos.i) continue;
      elcell = document.querySelector(`.pos-${i}-${j}`);
      cellClicked(elcell, i, j);
    }
  }
}

function hintClicked(elHint) {
  if (!gGame.isOn) return;
  if (gIsHint) return;
  if (gHintsCount < 3) {
    gIsHint = true;
    gHintsCount++;
    elHint.style.display = 'none';
  } else return;
}

function checkGameOver() {
  var elRestart = document.querySelector('.restart-game');
  if (gLivesCount === 0) {
    clearInterval(gSecInteral);
    elRestart.innerText = SAD;
    gGame.isOn = false;
    for (var idx = 0; idx < gMinesPos.length; idx++) {
      var i = gMinesPos[idx].i;
      var j = gMinesPos[idx].j;
      var elCell = document.querySelector(`.pos-${i}-${j}`);
      elCell.classList.remove('cover');
      elCell.innerText = MINE;
    }
  } else if (gGame.markedCell + gGame.shownCell === gBoard.length ** 2) {
    clearInterval(gSecInteral);
    elRestart.innerText = WINNER;
    gGame.isOn = false;
    console.log('game over');
  }
}

function setMinesNegsCount(board, i, j) {
  var board = board;
  var minePos = { i, j };
  for (var i = minePos.i - 1; i <= minePos.i + 1; i++) {
    if (i < 0) continue;
    if (i > board.length - 1) continue;
    var row = board[i];
    for (var j = minePos.j - 1; j <= minePos.j + 1; j++) {
      if (j < 0) continue;
      if (j > board.length - 1) continue;
      if (j === minePos.j && i === minePos.i) continue;

      var cell = row[j];
      cell.minesAroundCount++;
    }
  }
}

function setMines(board, mines) {
  var minesCount = mines;
  var emptyOnBoard = [];
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      if (gBoard[i][j].isFirst) continue;
      emptyOnBoard.push({ i: i, j: j });
    }
  }
  for (var i = 0; i < minesCount; i++) {
    var randomPosIdx = getRandomIntInclusive(0, emptyOnBoard.length - 1);

    var currI = emptyOnBoard[randomPosIdx].i;
    var currJ = emptyOnBoard[randomPosIdx].j;
    emptyOnBoard.splice(randomPosIdx, 1);
    var cell = board[currI][currJ];
    if (!board[currI][currJ].isMine) {
      cell.isMine = true;
      gMinesPos.push({ i: currI, j: currJ });
      setMinesNegsCount(board, currI, currJ);
    } else {
      i--;
    }
  }
  gEmptyCells = emptyOnBoard;
}

function safeClickClicked() {
  if (gIsFirstClick || !gGame.isOn) return;
  if (gSafeClicksCount > 0) {
    gSafeClicksCount--;
    document.querySelector('.safe-clicks-count').innerText = gSafeClicksCount;

    var emptyCells = [];
    for (var i = 0; i < gEmptyCells.length; i++) {
      var cellPos = gEmptyCells[i];
      if (!gBoard[cellPos.i][cellPos.j].isShown) {
        emptyCells.push(cellPos);
      }
    }
    var idx = getRandomIntInclusive(0, emptyCells.length - 1);
    var emptyCell = emptyCells[idx];
    var elEmptyCell = document.querySelector(`.pos-${emptyCell.i}-${emptyCell.j}`);
    elEmptyCell.classList.add('mark');
    setTimeout(function () {
      elEmptyCell.classList.remove('mark');
    }, 1000);
    gEmptyCells = emptyCells;
  }
}

function createCell() {
  var cell = {
    minesAroundCount: 0,
    isShown: false,
    isMine: false,
    isMarked: false,
    symbol: EMPTY,
    isFirst: false,
  };

  return cell;
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
