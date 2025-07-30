// Game state variables
let gameBoard = [];
let pacmanPosition = { x: 9, y: 15 };
let ghost1Position = { x: 9, y: 9 };
let ghost2Position = { x: 9, y: 11 };
let score = 0;
let lives = 3;
let totalDots = 0;
let gameRunning = true;
let pacmanDirection = 'right';

// Audio context for sound effects
let audioContext;

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

// Play collision sound
function playCollisionSound() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a dramatic collision sound
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.type = 'triangle';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Play dot eating sound
function playDotSound() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.type = 'square';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Maze layout (1 = wall, 0 = dot, 2 = empty path)
const mazeLayout = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,2,1,1,0,1,0,1,1,1,1],
    [0,0,0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0,0],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Initialize the game
function initGame() {
    const gameBoardElement = document.getElementById('game-board');
    gameBoardElement.innerHTML = '';
    gameBoard = [];
    totalDots = 0;
    
    // Create the maze
    for (let y = 0; y < mazeLayout.length; y++) {
        gameBoard[y] = [];
        for (let x = 0; x < mazeLayout[y].length; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${x}-${y}`;
            
            if (mazeLayout[y][x] === 1) {
                cell.classList.add('wall');
                gameBoard[y][x] = 'wall';
            } else if (mazeLayout[y][x] === 0) {
                cell.classList.add('dot');
                gameBoard[y][x] = 'dot';
                totalDots++;
            } else {
                cell.classList.add('path');
                gameBoard[y][x] = 'path';
            }
            
            gameBoardElement.appendChild(cell);
        }
    }
    
    // Place Pac-Man
    updatePacmanPosition();
    
    // Place ghost
    updateGhostPosition();
    
    // Update UI
    updateScore();
    updateLives();
    
    // Start ghost movement
    if (gameRunning) {
        startGhostMovement();
    }
}

function updatePacmanPosition() {
    // Remove Pac-Man from previous position
    document.querySelectorAll('.pacman').forEach(el => {
        el.classList.remove('pacman', 'up', 'down', 'left', 'right');
        // Remove existing eye
        el.querySelectorAll('.eye').forEach(eye => eye.remove());
    });
    
    // Add Pac-Man to new position
    const pacmanCell = document.getElementById(`cell-${pacmanPosition.x}-${pacmanPosition.y}`);
    pacmanCell.classList.add('pacman', pacmanDirection);
    
    // Create eye for Pac-Man
    const eye = document.createElement('div');
    eye.className = 'eye';
    pacmanCell.appendChild(eye);
    
    // Check if Pac-Man is on a dot
    if (gameBoard[pacmanPosition.y][pacmanPosition.x] === 'dot') {
        playDotSound(); // Play dot eating sound
        gameBoard[pacmanPosition.y][pacmanPosition.x] = 'path';
        pacmanCell.classList.remove('dot');
        score += 10;
        totalDots--;
        updateScore();
        
        // Check win condition
        if (totalDots === 0) {
            gameWin();
        }
    }
}

function updateGhostPosition() {
    // Remove ghosts from previous positions
    document.querySelectorAll('.ghost, .ghost2').forEach(el => {
        el.classList.remove('ghost', 'ghost2');
        // Remove existing eye elements
        el.querySelectorAll('.eye-left, .eye-right, .pupil-left, .pupil-right').forEach(eye => eye.remove());
    });
    
    // Add ghost1 to new position (red ghost)
    const ghost1Cell = document.getElementById(`cell-${ghost1Position.x}-${ghost1Position.y}`);
    ghost1Cell.classList.add('ghost');
    createGhostEyes(ghost1Cell);
    
    // Add ghost2 to new position (blue ghost)
    const ghost2Cell = document.getElementById(`cell-${ghost2Position.x}-${ghost2Position.y}`);
    ghost2Cell.classList.add('ghost2');
    createGhostEyes(ghost2Cell);
}

function createGhostEyes(ghostCell) {
    // Create eyes
    const eyeLeft = document.createElement('div');
    const eyeRight = document.createElement('div');
    const pupilLeft = document.createElement('div');
    const pupilRight = document.createElement('div');
    
    eyeLeft.className = 'eye-left';
    eyeRight.className = 'eye-right';
    pupilLeft.className = 'pupil-left';
    pupilRight.className = 'pupil-right';
    
    ghostCell.appendChild(eyeLeft);
    ghostCell.appendChild(eyeRight);
    ghostCell.appendChild(pupilLeft);
    ghostCell.appendChild(pupilRight);
}

function movePacman(direction) {
    if (!gameRunning) return;
    
    let newX = pacmanPosition.x;
    let newY = pacmanPosition.y;
    
    switch (direction) {
        case 'up':
            newY--;
            break;
        case 'down':
            newY++;
            break;
        case 'left':
            newX--;
            break;
        case 'right':
            newX++;
            break;
    }
    
    // Check tunnel effect (left-right wrap around)
    if (newX < 0) newX = 18;
    if (newX > 18) newX = 0;
    
    // Check boundaries and walls
    if (newY >= 0 && newY < mazeLayout.length && 
        gameBoard[newY] && gameBoard[newY][newX] !== 'wall') {
        pacmanPosition.x = newX;
        pacmanPosition.y = newY;
        pacmanDirection = direction;
        updatePacmanPosition();
        
        // Trigger chomping animation
        triggerChompAnimation();
        
        // Check collision with ghost
        checkCollision();
    }
}

function triggerChompAnimation() {
    const pacmanCell = document.getElementById(`cell-${pacmanPosition.x}-${pacmanPosition.y}`);
    pacmanCell.classList.add('chomping');
    
    // Remove chomping class after animation
    setTimeout(() => {
        if (pacmanCell.classList.contains('chomping')) {
            pacmanCell.classList.remove('chomping');
        }
    }, 200);
}

function moveGhost() {
    if (!gameRunning) return;
    
    // Move Ghost 1 (aggressive - chases Pac-Man)
    moveGhost1();
    
    // Move Ghost 2 (defensive - tries to stay away from Pac-Man)
    moveGhost2();
    
    updateGhostPosition();
    checkCollision();
}

function moveGhost1() {
    const directions = ['up', 'down', 'left', 'right'];
    const possibleMoves = [];
    
    for (let direction of directions) {
        let newX = ghost1Position.x;
        let newY = ghost1Position.y;
        
        switch (direction) {
            case 'up':
                newY--;
                break;
            case 'down':
                newY++;
                break;
            case 'left':
                newX--;
                break;
            case 'right':
                newX++;
                break;
        }
        
        // Check tunnel effect
        if (newX < 0) newX = 18;
        if (newX > 18) newX = 0;
        
        // Check if move is valid
        if (newY >= 0 && newY < mazeLayout.length && 
            gameBoard[newY] && gameBoard[newY][newX] !== 'wall') {
            possibleMoves.push({ x: newX, y: newY, direction });
        }
    }
    
    if (possibleMoves.length > 0) {
        // Aggressive AI: move towards Pac-Man
        let bestMove = possibleMoves[0];
        let minDistance = Infinity;
        
        for (let move of possibleMoves) {
            const distance = Math.abs(move.x - pacmanPosition.x) + Math.abs(move.y - pacmanPosition.y);
            if (distance < minDistance) {
                minDistance = distance;
                bestMove = move;
            }
        }
        
        ghost1Position.x = bestMove.x;
        ghost1Position.y = bestMove.y;
    }
}

function moveGhost2() {
    const directions = ['up', 'down', 'left', 'right'];
    const possibleMoves = [];
    
    for (let direction of directions) {
        let newX = ghost2Position.x;
        let newY = ghost2Position.y;
        
        switch (direction) {
            case 'up':
                newY--;
                break;
            case 'down':
                newY++;
                break;
            case 'left':
                newX--;
                break;
            case 'right':
                newX++;
                break;
        }
        
        // Check tunnel effect
        if (newX < 0) newX = 18;
        if (newX > 18) newX = 0;
        
        // Check if move is valid
        if (newY >= 0 && newY < mazeLayout.length && 
            gameBoard[newY] && gameBoard[newY][newX] !== 'wall') {
            possibleMoves.push({ x: newX, y: newY, direction });
        }
    }
    
    if (possibleMoves.length > 0) {
        // Defensive AI: move away from Pac-Man (opposite behavior)
        let bestMove = possibleMoves[0];
        let maxDistance = -1;
        
        for (let move of possibleMoves) {
            const distance = Math.abs(move.x - pacmanPosition.x) + Math.abs(move.y - pacmanPosition.y);
            if (distance > maxDistance) {
                maxDistance = distance;
                bestMove = move;
            }
        }
        
        ghost2Position.x = bestMove.x;
        ghost2Position.y = bestMove.y;
    }
}

function checkCollision() {
    // Check collision with ghost1
    if (pacmanPosition.x === ghost1Position.x && pacmanPosition.y === ghost1Position.y) {
        playCollisionSound(); // Play collision sound
        lives--;
        updateLives();
        
        if (lives > 0) {
            // Reset positions
            pacmanPosition = { x: 9, y: 15 };
            ghost1Position = { x: 9, y: 9 };
            ghost2Position = { x: 9, y: 11 };
            updatePacmanPosition();
            updateGhostPosition();
        } else {
            gameOver();
        }
        return;
    }
    
    // Check collision with ghost2
    if (pacmanPosition.x === ghost2Position.x && pacmanPosition.y === ghost2Position.y) {
        playCollisionSound(); // Play collision sound
        lives--;
        updateLives();
        
        if (lives > 0) {
            // Reset positions
            pacmanPosition = { x: 9, y: 15 };
            ghost1Position = { x: 9, y: 9 };
            ghost2Position = { x: 9, y: 11 };
            updatePacmanPosition();
            updateGhostPosition();
        } else {
            gameOver();
        }
    }
}

function startGhostMovement() {
    setInterval(() => {
        if (gameRunning) {
            moveGhost();
        }
    }, 300); // Ghost moves every 300ms
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLives() {
    // Update visual life indicators
    const lifeIcons = document.querySelectorAll('.life-icon');
    
    // Show/hide life icons based on current lives
    lifeIcons.forEach((icon, index) => {
        if (index < lives) {
            icon.style.opacity = '1';
            icon.style.transform = 'scale(1)';
        } else {
            icon.style.opacity = '0.3';
            icon.style.transform = 'scale(0.7)';
        }
    });
    
    // Add animation when losing a life
    if (lives < 3) {
        const lostLifeIcon = lifeIcons[lives];
        if (lostLifeIcon) {
            lostLifeIcon.style.animation = 'loseLife 0.5s ease-out';
            setTimeout(() => {
                lostLifeIcon.style.animation = '';
            }, 500);
        }
    }
}

function gameOver() {
    gameRunning = false;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

function gameWin() {
    gameRunning = false;
    document.getElementById('level-score').textContent = score;
    document.getElementById('level-complete').classList.remove('hidden');
}

function restartGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    pacmanPosition = { x: 9, y: 15 };
    ghost1Position = { x: 9, y: 9 };
    ghost2Position = { x: 9, y: 11 };
    pacmanDirection = 'right';
    
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('level-complete').classList.add('hidden');
    
    initGame();
}

function nextLevel() {
    gameRunning = true;
    pacmanPosition = { x: 9, y: 15 };
    ghost1Position = { x: 9, y: 9 };
    ghost2Position = { x: 9, y: 11 };
    pacmanDirection = 'right';
    
    document.getElementById('level-complete').classList.add('hidden');
    
    initGame();
}

// Keyboard controls
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            event.preventDefault();
            movePacman('up');
            break;
        case 'ArrowDown':
            event.preventDefault();
            movePacman('down');
            break;
        case 'ArrowLeft':
            event.preventDefault();
            movePacman('left');
            break;
        case 'ArrowRight':
            event.preventDefault();
            movePacman('right');
            break;
    }
});

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    initGame();
});
