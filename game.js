let board = null;
let game = new Xiangqi();
let $status = $('#status');
let $fen = $('#fen');
let $pgn = $('#pgn');
let squareToHighlight = null;
let squareClass = 'square-2b8ce';


function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if ((game.turn() === 'r' && piece.search(/^b/) !== -1) ||
        game.turn() === 'b') {
        return false;
    } else {
        let moves = game.moves({
            square: source,
            verbose: true
        });
        moves.forEach((item) => {
            highLight(item.to)
        })
    }
}

function removeHighLight() {
    $('#myBoard .square-2b8ce').removeClass('highlight');
}

function highLight(square) {
    let $square = $('#myBoard .square-' + square);
    $square.addClass('highlight');
}

function onDrop(source, target) {

    removeHighLight()
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });
    if (move != null) {
        let history = $("#move");
        history.val(`${history.val()} \n ${move.color}: ${move.from}=>${move.to}`)
    }
    if (move === null) return 'snapback';
    updateStatus();
    if (game.turn() === 'b') {
        window.setTimeout(makeRandomMove, 200)
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    let status = '';

    let moveColor = 'Red';
    if (game.turn() === 'b') {
        $("#turn").css("background-color", "black");
        moveColor = 'Black';
    }else{
        $("#turn").css("background-color", "red");

    }

    // checkmate?
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
        alert(status);
    }

    // draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position';
        alert(status);
    } else {
        status = moveColor + ' to move';
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    $status.html(status);
    $fen.html(game.fen());
    $pgn.html(game.pgn());
}

let config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};
board = Xiangqiboard('myBoard', config);

updateStatus();

function makeRandomMove() {
    let possibleMoves = game.moves();
    if (possibleMoves.length === 0) return;
    let randomIdx = Math.floor(Math.random() * possibleMoves.length);
    let move = game.move(minimaxRoot(3, game, true));

    if (move != null) {
        let history = $("#move");
        history.val(`${history.val()} \n ${move.color}: ${move.from}=>${move.to}`)
        if (history[0].selectionStart === history[0].selectionEnd) {
            history[0].scrollTop = history[0].scrollHeight;
        }
    }
    board.position(game.fen());
}

function minimaxRoot(depth, game, isMaximisingPlayer) {
    let newGameMoves = game.moves();
    let bestMove = -9999;
    let bestMoveFound;
    for (let i = 0; i < newGameMoves.length; i++) {
        let newGameMove = newGameMoves[i]
        game.move(newGameMove);
        let value = minimax(depth, game,-9999, 9999, !isMaximisingPlayer);
        console.log(1)
        game.undo();
        if (value >= bestMove) {
            bestMove = value;
            bestMoveFound = newGameMove;
        }
    }
    return bestMoveFound;
}

function minimax(depth, game, alpha, beta, isMaximisingPlayer) {
    if (depth === 0) {
        return -evaluateBoard(game.board());
    }
    let newGameMoves = game.moves();
    if (isMaximisingPlayer) {
        let bestMove = -9999;
        for (let i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            bestMove = Math.max(bestMove, minimax(depth - 1,  game,alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    } else {
        let bestMove = 9999;
        for (let i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game,alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {  return bestMove; }

        }
        return bestMove;
    }
}

function evaluateBoard(board) {
    let totalEvaluation = 0;
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 9; j++) {
            totalEvaluation = totalEvaluation + getPieceValue(board[i][j], i, j);
        }
    }
    return totalEvaluation;
}


function getPieceValue(piece, x, y) {
    if (piece === null) {
        return 0;
    }
    let getAbsoluteValue = function (piece, isRed, x, y) {
        if (piece.type === 'p') {
            return 30 + (isRed ? pEvalRed[x][y] : pEvalBlack[x][y]);
        } else if (piece.type === 'r') {
            return 600 + (isRed ? rEvalRed[x][y] : rEvalBlack[x][y]);
        } else if (piece.type === 'c') {
            return 285 + (isRed ? cEvalRed[x][y] : cEvalBlack[x][y]);
        } else if (piece.type === 'n') {
            return 270 + (isRed ? nEvalRed[x][y] : nEvalBlack[x][y]);
        } else if (piece.type === 'b') {
            return 120;
            // return 20 + (isRed ? bEvalRed[x][y] : bEvalBlack[x][y]);
        } else if (piece.type === 'a') {
            return 120;
            // return 20 + (isRed ? aEvalRed[x][y] : aEvalBlack[x][y]);
        } else if (piece.type === 'k') {
            return 6000;
            // return 900 + (isRed ? kEvalRed[x][y] : kEvalBlack[x][y]);
        }
        throw "Unknown piece type: " + piece.type;
    };
    let absoluteValue = getAbsoluteValue(piece, piece.color === 'r', x, y);
    return piece.color === 'r' ? absoluteValue : -absoluteValue;
}

let pEvalRed = [
    [0, 3, 6, 9, 12, 9, 6, 3, 0],
    [18, 36, 56, 80, 120, 80, 56, 36, 18],
    [14, 26, 42, 60, 80, 60, 42, 26, 14],
    [10, 20, 30, 34, 40, 34, 30, 20, 10],
    [6, 12, 18, 18, 20, 18, 18, 12, 6],
    [2, 0, 8, 0, 8, 0, 8, 0, 2],
    [0, 0, -2, 0, 4, 0, -2, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
];
let pEvalBlack = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, -2, 0, 4, 0, -2, 0, 0],
    [2, 0, 8, 0, 8, 0, 8, 0, 2],
    [6, 12, 18, 18, 20, 18, 18, 12, 6],
    [10, 20, 30, 34, 40, 34, 30, 20, 10],
    [14, 26, 42, 60, 80, 60, 42, 26, 14],
    [18, 36, 56, 80, 120, 80, 56, 36, 18],
    [0, 3, 6, 9, 12, 9, 6, 3, 0]
]
let rEvalRed = [
    [14, 14, 12, 18, 16, 18, 12, 14, 14],
    [16, 20, 18, 24, 26, 24, 18, 20, 16],
    [12, 12, 12, 18, 18, 18, 12, 12, 12],
    [12, 18, 16, 22, 22, 22, 16, 18, 12],
    [12, 14, 12, 18, 18, 18, 12, 14, 12],
    [12, 16, 14, 20, 20, 20, 14, 16, 12],
    [6, 10, 8, 14, 14, 14, 8, 10, 6],
    [4, 8, 6, 14, 12, 14, 6, 8, 4],
    [8, 4, 8, 16, 8, 16, 8, 4, 8],
    [-2, 10, 6, 14, 12, 14, 6, 10, -2],
];
let rEvalBlack = [
    [-2, 10, 6, 14, 12, 14, 6, 10, -2],
    [8, 4, 8, 16, 8, 16, 8, 4, 8],
    [4, 8, 6, 14, 12, 14, 6, 8, 4],
    [6, 10, 8, 14, 14, 14, 8, 10, 6],
    [12, 16, 14, 20, 20, 20, 14, 16, 12],
    [12, 14, 12, 18, 18, 18, 12, 14, 12],
    [12, 18, 16, 22, 22, 22, 16, 18, 12],
    [12, 12, 12, 18, 18, 18, 12, 12, 12],
    [16, 20, 18, 24, 26, 24, 18, 20, 16],
    [14, 14, 12, 18, 16, 18, 12, 14, 14],
];
let cEvalBlack = [
    [0, 0, 2, 6, 6, 6, 2, 0, 0],
    [0, 2, 4, 6, 6, 6, 4, 2, 0],
    [4, 0, 8, 6, 10, 6, 8, 0, 4],
    [0, 0, 0, 2, 4, 2, 0, 0, 0],
    [-2, 0, 4, 2, 6, 2, 4, 0, -2],
    [0, 0, 0, 2, 8, 2, 0, 0, 0],
    [0, 0, -2, 4, 10, 4, -2, 0, 0],
    [2, 2, 0, -10, -8, -10, 0, 2, 2],
    [2, 2, 0, -4, -14, -4, 0, 2, 2],
    [6, 4, 0, -10, -12, -10, 0, 4, 6]
];
let cEvalRed = [
    [6, 4, 0, -10, -12, -10, 0, 4, 6],
    [2, 2, 0, -4, -14, -4, 0, 2, 2],
    [2, 2, 0, -10, -8, -10, 0, 2, 2],
    [0, 0, -2, 4, 10, 4, -2, 0, 0],
    [0, 0, 0, 2, 8, 2, 0, 0, 0],
    [-2, 0, 4, 2, 6, 2, 4, 0, -2],
    [0, 0, 0, 2, 4, 2, 0, 0, 0],
    [4, 0, 8, 6, 10, 6, 8, 0, 4],
    [0, 2, 4, 6, 6, 6, 4, 2, 0],
    [0, 0, 2, 6, 6, 6, 2, 0, 0],
];
let nEvalBlack = [
    [0, -4, 0, 0, 0, 0, 0, -4, 0],
    [0, 2, 4, 4, -2, 4, 4, 2, 0],
    [4, 2, 8, 8, 4, 8, 8, 2, 4],
    [2, 6, 8, 6, 10, 6, 8, 6, 2],
    [4, 12, 16, 14, 12, 14, 16, 12, 4],
    [6, 16, 14, 18, 16, 18, 14, 16, 6],
    [8, 24, 18, 24, 20, 24, 18, 24, 8],
    [12, 14, 16, 20, 18, 20, 16, 14, 12],
    [4, 10, 28, 16, 8, 16, 28, 10, 4],
    [4, 8, 16, 12, 4, 12, 16, 8, 4]
];
let nEvalRed = [
    [4, 10, 28, 16, 8, 16, 28, 10, 4],
    [12, 14, 16, 20, 18, 20, 16, 14, 12],
    [8, 24, 18, 24, 20, 24, 18, 24, 8],
    [8, 24, 18, 24, 20, 24, 18, 24, 8],
    [6, 16, 14, 18, 16, 18, 14, 16, 6],
    [4, 12, 16, 14, 12, 14, 16, 12, 4],
    [2, 6, 8, 6, 10, 6, 8, 6, 2],
    [4, 2, 8, 8, 4, 8, 8, 2, 4],
    [0, 2, 4, 4, -2, 4, 4, 2, 0],
    [0, -4, 0, 0, 0, 0, 0, -4, 0],
];