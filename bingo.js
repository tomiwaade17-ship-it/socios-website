// Socios Human Bingo - Application Logic

// Bingo prompts (5 columns x 5 rows = 25, center is free)
const BINGO_PROMPTS = [
    "Has started planning their Halloween costume.",
    "Has already tasted a pumpkin spice latte this season.",
    "Is planning a fall hike or nature walk.",
    "Is planning a solo trip somewhere this fall.",
    "Has a fall birthday (September, October, or November).",
    "Has already started their Christmas or holiday shopping.",
    "Came to Socios wearing a sweater.",
    "Is taking a class or learning a new skill this season.",
    "Is planning to volunteer for a cause this fall.",
    "Has a favorite book to read when it's cold outside.",
    "Is planning to host a dinner party this fall.",
    "Feels more productive and creative in the autumn.",
    null, // Center - free space
    "Hates the smell of cinnamon.",
    "Has never been to a farmers market.",
    "Is not directly related to a Libra or Scorpio.",
    "Has never been camping.",
    "Has never tasted a pumpkin.",
    "Is planning to go to a wine region this fall.",
    "Believes that soup is a perfectly acceptable meal 3x a day.",
    "Would like to have coffee with you sometime.",
    "Has tried more than five different kinds of squash.",
    "Has a specific goal they want to accomplish before winter arrives.",
    "Knows how to build a proper fire.",
    "Can knit or crochet a scarf."
];

// Google Sheets configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwp1P5br0cwxLUVwELiCf3qKY3lV3Vwp1hEP4M-IjgrTIviEVM_a3dYcyG9L7k0F0pX/exec';

// Total squares to fill (excluding center free space)
const TOTAL_SQUARES = 24;

// Application State
let state = {
    player: null,
    grid: [],
    matches: {},
    nameUsage: {},
    startTime: null,
    hasBingo: false
};

// DOM Elements
const elements = {
    registrationScreen: document.getElementById('registration-screen'),
    gameScreen: document.getElementById('game-screen'),
    completionScreen: document.getElementById('completion-screen'),
    registrationForm: document.getElementById('registration-form'),
    bingoGrid: document.getElementById('bingo-grid'),
    matchModal: document.getElementById('match-modal'),
    matchForm: document.getElementById('match-form'),
    modalPrompt: document.getElementById('modal-prompt'),
    matchNameInput: document.getElementById('match-name'),
    modalClose: document.getElementById('modal-close'),
    modalCancel: document.getElementById('modal-cancel'),
    playerDisplay: document.getElementById('player-display'),
    matchCount: document.getElementById('match-count'),
    bingoStatus: document.getElementById('bingo-status'),
    claimBingoBtn: document.getElementById('claim-bingo-btn'),
    endGameBtn: document.getElementById('end-game-btn'),
    finalMatches: document.getElementById('final-matches'),
    uniquePeople: document.getElementById('unique-people'),
    completionMessage: document.getElementById('completion-message')
};

let currentCellIndex = null;

// Initialize application
function initBingo() {
    setupBingoEventListeners();
    loadSavedBingoState();
}

function setupBingoEventListeners() {
    elements.registrationForm.addEventListener('submit', handleBingoRegistration);
    elements.matchForm.addEventListener('submit', handleBingoMatchSubmit);
    elements.modalClose.addEventListener('click', closeBingoModal);
    elements.modalCancel.addEventListener('click', closeBingoModal);
    elements.claimBingoBtn.addEventListener('click', handleClaimBingo);
    elements.endGameBtn.addEventListener('click', handleEndBingoGame);

    elements.matchModal.addEventListener('click', (e) => {
        if (e.target === elements.matchModal) closeBingoModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeBingoModal();
    });
}

function loadSavedBingoState() {
    const saved = localStorage.getItem('socios_bingo_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.player && parsed.grid) {
                state = parsed;
                showBingoScreen('game');
                renderBingoGrid();
                updateBingoUI();
            }
        } catch (e) {
            localStorage.removeItem('socios_bingo_state');
        }
    }
}

function saveBingoState() {
    localStorage.setItem('socios_bingo_state', JSON.stringify(state));
}

function clearBingoState() {
    localStorage.removeItem('socios_bingo_state');
}

// Screen Navigation
function showBingoScreen(screenName) {
    document.querySelectorAll('.bingo-screen').forEach(s => s.classList.remove('active'));

    switch(screenName) {
        case 'registration':
            elements.registrationScreen.classList.add('active');
            break;
        case 'game':
            elements.gameScreen.classList.add('active');
            break;
        case 'completion':
            elements.completionScreen.classList.add('active');
            break;
    }
}

// Registration
async function handleBingoRegistration(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const profession = document.getElementById('profession').value.trim();

    if (!name || !email || !profession) return;

    state.player = { name, email, profession };
    state.grid = shuffleBingoArray([...BINGO_PROMPTS]);
    state.matches = {};
    state.nameUsage = {};
    state.startTime = new Date().toISOString();
    state.hasBingo = false;

    await submitToSheets('register', {
        name,
        email,
        profession,
        timestamp: state.startTime
    });

    saveBingoState();
    showBingoScreen('game');
    renderBingoGrid();
    updateBingoUI();
}

// Grid Rendering
function renderBingoGrid() {
    elements.bingoGrid.innerHTML = '';

    state.grid.forEach((prompt, index) => {
        const cell = document.createElement('button');
        cell.className = 'bingo-cell';
        cell.dataset.index = index;

        if (prompt === null) {
            cell.classList.add('center', 'matched');
            cell.innerHTML = '<span style="font-size: 1.5rem;">S</span>';
            state.matches[index] = { name: 'FREE', prompt: null };
        } else if (state.matches[index]) {
            cell.classList.add('matched');
            cell.innerHTML = `
                <span class="cell-prompt">${truncateBingoText(prompt, 30)}</span>
                <span class="cell-match">${state.matches[index].name}</span>
            `;
        } else {
            cell.innerHTML = `<span class="cell-prompt">${truncateBingoText(prompt, 50)}</span>`;
            cell.addEventListener('click', () => openBingoModal(index, prompt));
        }

        elements.bingoGrid.appendChild(cell);
    });
}

function truncateBingoText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// Modal
function openBingoModal(index, prompt) {
    currentCellIndex = index;
    elements.modalPrompt.textContent = prompt;
    elements.matchNameInput.value = '';
    elements.matchModal.classList.add('active');
    elements.matchNameInput.focus();

    const errorEl = elements.matchForm.querySelector('.error-message');
    if (errorEl) errorEl.remove();
}

function closeBingoModal() {
    elements.matchModal.classList.remove('active');
    currentCellIndex = null;
}

// Match Submission
async function handleBingoMatchSubmit(e) {
    e.preventDefault();

    const matchName = elements.matchNameInput.value.trim();

    if (!matchName || currentCellIndex === null) return;

    const normalizedName = matchName.toLowerCase();

    const currentUsage = state.nameUsage[normalizedName] || 0;
    if (currentUsage >= 2) {
        showBingoFormError('This person has already been entered twice. Find someone new!');
        return;
    }

    const prompt = state.grid[currentCellIndex];
    state.matches[currentCellIndex] = {
        name: matchName,
        prompt
    };
    state.nameUsage[normalizedName] = currentUsage + 1;

    await submitToSheets('match', {
        playerName: state.player.name,
        playerEmail: state.player.email,
        cellIndex: currentCellIndex,
        prompt: prompt,
        matchName: matchName,
        timestamp: new Date().toISOString()
    });

    saveBingoState();
    closeBingoModal();
    renderBingoGrid();
    updateBingoUI();
    checkForBingo();
}

function showBingoFormError(message) {
    const existing = elements.matchForm.querySelector('.error-message');
    if (existing) existing.remove();

    const errorEl = document.createElement('p');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    elements.matchForm.querySelector('.bingo-form-group').appendChild(errorEl);
}

// UI Updates
function updateBingoUI() {
    elements.playerDisplay.textContent = state.player?.name || '';

    const matchCount = Object.keys(state.matches).filter(k => state.grid[k] !== null).length;
    elements.matchCount.textContent = matchCount;

    elements.claimBingoBtn.disabled = !state.hasBingo;
}

// Bingo Detection - All boxes must be filled
function checkForBingo() {
    const matchedIndices = Object.keys(state.matches).map(Number);

    const actualMatches = matchedIndices.filter(index => state.grid[index] !== null).length;

    if (actualMatches >= TOTAL_SQUARES) {
        state.hasBingo = true;
        elements.bingoStatus.textContent = 'BINGO! You filled the entire grid!';
        elements.bingoStatus.classList.add('has-bingo');
        elements.claimBingoBtn.disabled = false;
        saveBingoState();
        return true;
    }

    return false;
}

// Claim Bingo
async function handleClaimBingo() {
    if (!state.hasBingo) return;

    await submitToSheets('bingo', {
        playerName: state.player.name,
        playerEmail: state.player.email,
        playerProfession: state.player.profession,
        matchCount: Object.keys(state.matches).filter(k => state.grid[k] !== null).length,
        uniquePeople: Object.keys(state.nameUsage).length,
        timestamp: new Date().toISOString()
    });

    finishBingoGame(true);
}

// End Game
async function handleEndBingoGame() {
    const confirmed = confirm('Are you sure you want to end your game?');
    if (!confirmed) return;

    await submitToSheets('end', {
        playerName: state.player.name,
        playerEmail: state.player.email,
        playerProfession: state.player.profession,
        matchCount: Object.keys(state.matches).filter(k => state.grid[k] !== null).length,
        uniquePeople: Object.keys(state.nameUsage).length,
        hasBingo: state.hasBingo,
        timestamp: new Date().toISOString()
    });

    finishBingoGame(false);
}

function finishBingoGame(gotBingo) {
    const matchCount = Object.keys(state.matches).filter(k => state.grid[k] !== null).length;
    const uniquePeople = Object.keys(state.nameUsage).length;

    elements.finalMatches.textContent = matchCount;
    elements.uniquePeople.textContent = uniquePeople;

    if (gotBingo) {
        elements.completionMessage.textContent = 'Congratulations on completing your Bingo!';
    } else {
        elements.completionMessage.textContent = `You made ${matchCount} matches with ${uniquePeople} people.`;
    }

    clearBingoState();
    showBingoScreen('completion');
}

// Google Sheets Integration
async function submitToSheets(action, data) {
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
        console.log('Sheets submission (demo mode):', action, data);
        return;
    }

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, ...data })
        });
        console.log('Submitted to sheets:', action);
    } catch (error) {
        console.error('Failed to submit to sheets:', error);
    }
}

// Utilities
function shuffleBingoArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const nullIndex = shuffled.indexOf(null);
    if (nullIndex !== 12) {
        [shuffled[nullIndex], shuffled[12]] = [shuffled[12], shuffled[nullIndex]];
    }

    return shuffled;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initBingo);
