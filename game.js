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
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    let status = '';

    let moveColor = 'Red';
    if (game.turn() === 'b') {
        makeRandomMove()
        moveColor = 'Black';
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
    let move = game.move(possibleMoves[randomIdx]);
    if (move != null) {
        let history = $("#move");
        history.val(`${history.val()} \n ${move.color}: ${move.from}=>${move.to}`)
        if(history[0].selectionStart === history[0].selectionEnd) {
            history[0].scrollTop = history[0].scrollHeight;
        }
    }
    board.position(game.fen());
}
