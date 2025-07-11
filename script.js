const board = document.getElementById('board');
const turnIndicator = document.getElementById('turnIndicator');
const capturedBlack = document.getElementById('capturedBlack');
const capturedWhite = document.getElementById('capturedWhite');
const promotionModal = document.getElementById('promotionModal');
const playerWins = document.getElementById('playerWins');
const aiWins = document.getElementById('aiWins');
const toggleAIButton = document.getElementById('toggleAI');
const resetGameButton = document.getElementById('resetGame');
const saveGameButton = document.getElementById('saveGame');
const loadGameButton = document.getElementById('loadGame');

let selectedPiece = null;
let isWhiteTurn = true;
let capturedPieces = { white: [], black: [] };
let hasKingMoved = { white: false, black: false };
let hasRookMoved = { white: [false, false], black: [false, false] };
let isAIActive = false;
let playerScore = 0;
let aiScore = 0;

// Posición inicial del tablero
const initialBoard = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

// Tablas de valores posicionales para cada pieza
const pieceSquareTables = {
    '♙': [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5, 5, -5, -10, 0, 0, -10, -5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, 5, 10, 25, 25, 10, 5, 5, 10, 10, 20, 30, 30, 20, 10, 10, 50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0],
    '♘': [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    '♗': [-20, -10, -10, -10, -10, -10, -10, -20, -10, 5, 0, 0, 0, 0, 5, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    '♖': [0, 0, 0, 5, 5, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    '♕': [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 5, 0, 0, 0, 0, -10, -10, 5, 5, 5, 5, 5, 0, -10, 0, 0, 5, 5, 5, 5, 0, -5, -5, 0, 5, 5, 5, 5, 0, -5, -10, 0, 5, 5, 5, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    '♔': [20, 30, 10, 0, 0, 10, 30, 20, 20, 20, 0, 0, 0, 0, 20, 20, -10, -20, -20, -20, -20, -20, -20, -10, -20, -30, -30, -40, -40, -30, -30, -20, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30]
};

// Cache de transposición
const transpositionTable = {};

// Función para crear el tablero
function createBoard() {
    board.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            square.textContent = initialBoard[row][col];
            square.addEventListener('click', handleSquareClick);
            board.appendChild(square);
        }
    }
}

// Función para manejar clics en el tablero
function handleSquareClick(event) {
    if (isAIActive && !isWhiteTurn) return; // No permitir movimientos del jugador durante el turno de la IA

    const square = event.target;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = square.textContent;

    // Si ya hay una pieza seleccionada y se hace clic en una casilla válida
    if (selectedPiece && square.classList.contains('possible-move')) {
        movePiece(selectedPiece, square);
        if (isAIActive && !isWhiteTurn) {
            setTimeout(makeAIMove, 500); // La IA hace su movimiento después de un breve retraso
        }
        return;
    }

    // Verificar si es el turno correcto
    if (piece && isPieceWhite(piece) !== isWhiteTurn) {
        return;
    }

    // Deseleccionar pieza actual
    if (selectedPiece === square) {
        square.classList.remove('selected');
        selectedPiece = null;
        clearPossibleMoves();
        return;
    }

    // Limpiar selección anterior
    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
        clearPossibleMoves();
    }

    // Seleccionar nueva pieza
    if (piece) {
        square.classList.add('selected');
        selectedPiece = square;
        showValidMoves(row, col, piece);
    }
}

// Función para verificar si una pieza es blanca
function isPieceWhite(piece) {
    return '♔♕♖♗♘♙'.includes(piece);
}

// Función para mostrar movimientos válidos
function showValidMoves(row, col, piece) {
    clearPossibleMoves();
    switch (piece) {
        case '♙': // Peón blanco
            if (row > 0 && !getSquare(row - 1, col).textContent) {
                getSquare(row - 1, col).classList.add('possible-move');
                if (row === 6 && !getSquare(row - 2, col).textContent) {
                    getSquare(row - 2, col).classList.add('possible-move');
                }
            }
            if (row > 0 && col > 0 && getSquare(row - 1, col - 1).textContent && !isPieceWhite(getSquare(row - 1, col - 1).textContent)) {
                getSquare(row - 1, col - 1).classList.add('possible-move');
            }
            if (row > 0 && col < 7 && getSquare(row - 1, col + 1).textContent && !isPieceWhite(getSquare(row - 1, col + 1).textContent)) {
                getSquare(row - 1, col + 1).classList.add('possible-move');
            }
            break;
        case '♟': // Peón negro
            if (row < 7 && !getSquare(row + 1, col).textContent) {
                getSquare(row + 1, col).classList.add('possible-move');
                if (row === 1 && !getSquare(row + 2, col).textContent) {
                    getSquare(row + 2, col).classList.add('possible-move');
                }
            }
            if (row < 7 && col > 0 && getSquare(row + 1, col - 1).textContent && isPieceWhite(getSquare(row + 1, col - 1).textContent)) {
                getSquare(row + 1, col - 1).classList.add('possible-move');
            }
            if (row < 7 && col < 7 && getSquare(row + 1, col + 1).textContent && isPieceWhite(getSquare(row + 1, col + 1).textContent)) {
                getSquare(row + 1, col + 1).classList.add('possible-move');
            }
            break;
        case '♖': // Torre blanca
        case '♜': // Torre negra
            for (let i = row - 1; i >= 0; i--) {
                if (!addPossibleMove(i, col, piece)) break;
            }
            for (let i = row + 1; i < 8; i++) {
                if (!addPossibleMove(i, col, piece)) break;
            }
            for (let j = col - 1; j >= 0; j--) {
                if (!addPossibleMove(row, j, piece)) break;
            }
            for (let j = col + 1; j < 8; j++) {
                if (!addPossibleMove(row, j, piece)) break;
            }
            break;
        case '♘': // Caballo blanco
        case '♞': // Caballo negro
            const knightMoves = [
                [row - 2, col - 1], [row - 2, col + 1],
                [row - 1, col - 2], [row - 1, col + 2],
                [row + 1, col - 2], [row + 1, col + 2],
                [row + 2, col - 1], [row + 2, col + 1]
            ];
            knightMoves.forEach(([r, c]) => {
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    addPossibleMove(r, c, piece);
                }
            });
            break;
        case '♗': // Alfil blanco
        case '♝': // Alfil negro
            for (let i = 1; i < 8; i++) {
                if (!addPossibleMove(row - i, col - i, piece)) break;
            }
            for (let i = 1; i < 8; i++) {
                if (!addPossibleMove(row - i, col + i, piece)) break;
            }
            for (let i = 1; i < 8; i++) {
                if (!addPossibleMove(row + i, col - i, piece)) break;
            }
            for (let i = 1; i < 8; i++) {
                if (!addPossibleMove(row + i, col + i, piece)) break;
            }
            break;
        case '♕': // Reina blanca
        case '♛': // Reina negra
            for (let i = row - 1; i >= 0; i--) {
                if (!addPossibleMove(i, col, piece)) break;
            }
            for (let i = row + 1; i < 8; i++) {
                if (!addPossibleMove(i, col, piece)) break;
            }
            for (let j = col - 1; j >= 0; j--) {
                if (!addPossibleMove(row, j, piece)) break;
            }
            for (let j = col + 1; j < 8; j++) {
                if (!addPossibleMove(row, j, piece)) break;
            }
            for (let i = 1; i < 8; i++) {
                if (!addPossibleMove(row - i, col - i, piece)) break;
            }
            for (let i = 1; i < 8; i++) {
                if (!addPossibleMove(row - i, col + i, piece)) break;
            }
            for (let i = 1; i < 8; i++) {
                if (!addPossibleMove(row + i, col - i, piece)) break;
            }
            for (let i = 1; i < 8; i++) {
                if (!addPossibleMove(row + i, col + i, piece)) break;
            }
            break;
        case '♔': // Rey blanco
        case '♚': // Rey negro
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    addPossibleMove(row + i, col + j, piece);
                }
            }
            // Enroque
            if (!hasKingMoved[isWhiteTurn ? 'white' : 'black']) {
                if (!hasRookMoved[isWhiteTurn ? 'white' : 'black'][0] && !getSquare(row, col - 1).textContent && !getSquare(row, col - 2).textContent && !getSquare(row, col - 3).textContent) {
                    getSquare(row, col - 2).classList.add('possible-move');
                }
                if (!hasRookMoved[isWhiteTurn ? 'white' : 'black'][1] && !getSquare(row, col + 1).textContent && !getSquare(row, col + 2).textContent) {
                    getSquare(row, col + 2).classList.add('possible-move');
                }
            }
            break;
    }
}

// Función para añadir un movimiento válido
function addPossibleMove(row, col, piece) {
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return false;
    const targetSquare = getSquare(row, col);
    const targetPiece = targetSquare.textContent;
    if (!targetPiece || (isPieceWhite(targetPiece) !== isPieceWhite(piece))) {
        targetSquare.classList.add('possible-move');
    }
    return !targetPiece;
}

// Función para limpiar movimientos válidos
function clearPossibleMoves() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.classList.remove('possible-move');
    });
}

// Función para mover una pieza
function movePiece(from, to) {
    const fromRow = parseInt(from.dataset.row);
    const fromCol = parseInt(from.dataset.col);
    const toRow = parseInt(to.dataset.row);
    const toCol = parseInt(to.dataset.col);
    const piece = from.textContent;

    // Enroque
    if (piece === '♔' || piece === '♚') {
        if (Math.abs(toCol - fromCol) === 2) {
            const rookCol = toCol > fromCol ? 7 : 0;
            const rook = getSquare(fromRow, rookCol);
            const newRookCol = toCol > fromCol ? toCol - 1 : toCol + 1;
            getSquare(fromRow, newRookCol).textContent = rook.textContent;
            rook.textContent = '';
            hasKingMoved[isWhiteTurn ? 'white' : 'black'] = true;
            hasRookMoved[isWhiteTurn ? 'white' : 'black'][rookCol === 7 ? 1 : 0] = true;
        } else {
            hasKingMoved[isWhiteTurn ? 'white' : 'black'] = true;
        }
    }

    // Capturar pieza si existe
    if (to.textContent) {
        const capturedPiece = to.textContent;
        if (isPieceWhite(capturedPiece)) {
            capturedPieces.white.push(capturedPiece);
        } else {
            capturedPieces.black.push(capturedPiece);
        }
        updateCapturedPieces();
    }

    // Mover pieza
    to.textContent = from.textContent;
    from.textContent = '';

    // Promoción de peón
    if ((piece === '♙' && toRow === 0) || (piece === '♟' && toRow === 7)) {
        showPromotionModal(to);
        return; // Retrasar el cambio de turno hasta que se seleccione la promoción
    }

    // Limpiar selección
    from.classList.remove('selected');
    clearPossibleMoves();
    selectedPiece = null;

    // Cambiar turno
    isWhiteTurn = !isWhiteTurn;
    turnIndicator.textContent = `Turno: ${isWhiteTurn ? 'Blancas' : 'Negras'}`;

    // Verificar jaque mate o ahogado
    if (isCheckmate()) {
        alert(isWhiteTurn ? 'Negras ganan!' : 'Blancas ganan!');
        updateScore(isWhiteTurn ? 'ai' : 'player');
        resetGame();
    }
}

// Función para mostrar el modal de promoción
function showPromotionModal(square) {
    const piece = square.textContent;
    const isWhitePawn = piece === '♙';

    // Configurar las opciones de promoción según el color del peón
    const promotionPieces = {
        white: {
            queen: '♕',
            rook: '♖',
            bishop: '♗',
            knight: '♘'
        },
        black: {
            queen: '♛',
            rook: '♜',
            bishop: '♝',
            knight: '♞'
        }
    };

    const pieces = isWhitePawn ? promotionPieces.white : promotionPieces.black;

    // Actualizar el contenido del modal con las piezas correctas
    const options = document.querySelectorAll('.promotion-option');
    options.forEach((option, index) => {
        const pieceType = Object.keys(pieces)[index];
        const pieceSymbol = pieces[pieceType];
        option.textContent = pieceSymbol;
        option.dataset.piece = pieceSymbol;
    });

    // Mostrar el modal
    promotionModal.style.display = 'block';

    // Limpiar eventos anteriores
    options.forEach(option => {
        option.replaceWith(option.cloneNode(true));
    });

    // Añadir nuevos event listeners
    document.querySelectorAll('.promotion-option').forEach(option => {
        option.addEventListener('click', () => {
            square.textContent = option.dataset.piece;
            promotionModal.style.display = 'none';
        }, { once: true }); // Asegura que el evento solo se ejecute una vez
    });
}

// Función para obtener una casilla del tablero
function getSquare(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

// Función para actualizar las piezas capturadas
function updateCapturedPieces() {
    capturedWhite.textContent = capturedPieces.white.join(' ');
    capturedBlack.textContent = capturedPieces.black.join(' ');
}

// Función para evaluar el valor de una pieza
function getPieceValue(piece) {
    const values = {
        '♟': 1, '♙': 1,     // Peones
        '♞': 3, '♘': 3,     // Caballos
        '♝': 3, '♗': 3,     // Alfiles
        '♜': 5, '♖': 5,     // Torres
        '♛': 9, '♕': 9,     // Reinas
        '♚': 100, '♔': 100  // Reyes
    };
    return values[piece] || 0;
}

// Función para evaluar la posición
function evaluatePosition() {
    let score = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = getSquare(row, col).textContent;
            if (piece) {
                const value = getPieceValue(piece);
                const squareIndex = row * 8 + col;
                const positionalBonus = pieceSquareTables[piece] ? pieceSquareTables[piece][squareIndex] : 0;

                if (isPieceWhite(piece)) {
                    score += value + positionalBonus;
                } else {
                    score -= value + positionalBonus;
                }
            }
        }
    }

    // Añade movilidad
    const whiteMobility = getAllPossibleMoves(true).length;
    const blackMobility = getAllPossibleMoves(false).length;
    score += (whiteMobility - blackMobility) * 0.1;

    return score;
}

// Función para obtener todos los movimientos posibles
function getAllPossibleMoves(isWhite) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = getSquare(row, col);
            const piece = square.textContent;
            if (piece && isPieceWhite(piece) === isWhite) {
                showValidMoves(row, col, piece);
                const possibleMoves = document.querySelectorAll('.possible-move');
                possibleMoves.forEach(moveSquare => {
                    const move = {
                        from: square,
                        to: moveSquare,
                        piece: piece,
                        score: getPieceValue(moveSquare.textContent) // Prioriza capturas
                    };
                    moves.push(move);
                });
                clearPossibleMoves();
            }
        }
    }
    // Ordena los movimientos por puntuación (capturas primero)
    moves.sort((a, b) => b.score - a.score);
    return moves;
}

// Función minimax para la IA
function minimax(depth, alpha, beta, isMaximizing) {
    const boardKey = JSON.stringify(board); // Usa una representación única del tablero como clave
    if (transpositionTable[boardKey]) {
        return transpositionTable[boardKey];
    }

    if (depth === 0) {
        const score = evaluatePosition();
        transpositionTable[boardKey] = score;
        return score;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        const moves = getAllPossibleMoves(true);
        for (const move of moves) {
            // Guardar estado
            const fromPiece = move.from.textContent;
            const toPiece = move.to.textContent;
            
            // Hacer movimiento
            move.to.textContent = fromPiece;
            move.from.textContent = '';
            
            const eval = minimax(depth - 1, alpha, beta, false);
            
            // Deshacer movimiento
            move.from.textContent = fromPiece;
            move.to.textContent = toPiece;
            
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        transpositionTable[boardKey] = maxEval;
        return maxEval;
    } else {
        let minEval = Infinity;
        const moves = getAllPossibleMoves(false);
        for (const move of moves) {
            // Guardar estado
            const fromPiece = move.from.textContent;
            const toPiece = move.to.textContent;
            
            // Hacer movimiento
            move.to.textContent = fromPiece;
            move.from.textContent = '';
            
            const eval = minimax(depth - 1, alpha, beta, true);
            
            // Deshacer movimiento
            move.from.textContent = fromPiece;
            move.to.textContent = toPiece;
            
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        transpositionTable[boardKey] = minEval;
        return minEval;
    }
}

// Función mejorada para que la IA haga un movimiento
function makeAIMove() {
    const moves = getAllPossibleMoves(false);
    let bestMove = null;
    let bestScore = Infinity;
    
    for (const move of moves) {
        // Guardar estado
        const fromPiece = move.from.textContent;
        const toPiece = move.to.textContent;
        
        // Hacer movimiento
        move.to.textContent = fromPiece;
        move.from.textContent = '';
        
        const score = minimax(3, -Infinity, Infinity, true);
        
        // Deshacer movimiento
        move.from.textContent = fromPiece;
        move.to.textContent = toPiece;
        
        if (score < bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    if (bestMove) {
        movePiece(bestMove.from, bestMove.to);
    }
}

// Función para verificar jaque mate
function isCheckmate() {
    const currentColor = isWhiteTurn;
    const king = currentColor ? '♔' : '♚';
    let kingSquare = null;
    
    // Encontrar el rey
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (getSquare(row, col).textContent === king) {
                kingSquare = getSquare(row, col);
                break;
            }
        }
        if (kingSquare) break;
    }
    
    if (!kingSquare) return true; // Si no hay rey, es jaque mate
    
    // Verificar si hay movimientos legales disponibles
    const moves = getAllPossibleMoves(currentColor);
    return moves.length === 0;
}

// Función para actualizar el marcador
function updateScore(winner) {
    if (winner === 'player') {
        playerScore++;
        playerWins.textContent = playerScore;
    } else {
        aiScore++;
        aiWins.textContent = aiScore;
    }
}

// Función para reiniciar el juego
function resetGame() {
    createBoard();
    isWhiteTurn = true;
    turnIndicator.textContent = 'Turno: Blancas';
    capturedPieces = { white: [], black: [] };
    updateCapturedPieces();
    hasKingMoved = { white: false, black: false };
    hasRookMoved = { white: [false, false], black: [false, false] };
}

// Función para guardar la partida
function saveGame() {
    const gameState = {
        board: [],
        isWhiteTurn,
        capturedPieces,
        hasKingMoved,
        hasRookMoved
    };

    for (let row = 0; row < 8; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < 8; col++) {
            gameState.board[row][col] = getSquare(row, col).textContent;
        }
    }

    localStorage.setItem('chessGame', JSON.stringify(gameState));
    alert('Partida guardada!');
}

// Función para cargar la partida
function loadGame() {
    const gameState = JSON.parse(localStorage.getItem('chessGame'));
    if (!gameState) {
        alert('No hay partida guardada.');
        return;
    }

    isWhiteTurn = gameState.isWhiteTurn;
    capturedPieces = gameState.capturedPieces;
    hasKingMoved = gameState.hasKingMoved;
    hasRookMoved = gameState.hasRookMoved;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            getSquare(row, col).textContent = gameState.board[row][col];
        }
    }

    updateCapturedPieces();
    turnIndicator.textContent = `Turno: ${isWhiteTurn ? 'Blancas' : 'Negras'}`;
    alert('Partida cargada!');
}

// Evento para activar/desactivar la IA
toggleAIButton.addEventListener('click', () => {
    isAIActive = !isAIActive;
    toggleAIButton.textContent = isAIActive ? 'Desactivar IA' : 'Activar IA';
});

// Evento para reiniciar el juego
resetGameButton.addEventListener('click', resetGame);

// Evento para guardar la partida
saveGameButton.addEventListener('click', saveGame);

// Evento para cargar la partida
loadGameButton.addEventListener('click', loadGame);

// Iniciar el juego
createBoard();
const whiteColorPicker = document.getElementById('whiteColor');
const blackColorPicker = document.getElementById('blackColor');

// Aplica los colores elegidos
function applyPieceColors() {
    const whiteColor = whiteColorPicker.value;
    const blackColor = blackColorPicker.value;

    document.querySelectorAll('.square').forEach(square => {
        const piece = square.textContent;
        if (!piece) return;

        if ('♔♕♖♗♘♙'.includes(piece)) {
            square.style.color = whiteColor;
        } else {
            square.style.color = blackColor;
        }
    });

    localStorage.setItem('whiteColor', whiteColor);
    localStorage.setItem('blackColor', blackColor);
}

// Evento al cambiar color
whiteColorPicker.addEventListener('input', applyPieceColors);
blackColorPicker.addEventListener('input', applyPieceColors);

// Aplicar colores guardados al cargar
window.addEventListener('DOMContentLoaded', () => {
    const storedWhite = localStorage.getItem('whiteColor');
    const storedBlack = localStorage.getItem('blackColor');
    if (storedWhite) whiteColorPicker.value = storedWhite;
    if (storedBlack) blackColorPicker.value = storedBlack;
    applyPieceColors();
});
