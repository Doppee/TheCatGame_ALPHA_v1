// script.js - LOGICA DI GIOCO COMPLETA

// === RIFERIMENTI DOM ===
const gameContainer = document.getElementById('game-container');
const homepage = document.getElementById('homepage');
const startButton = document.getElementById('start-button');

// 🆕 Riferimenti per la schermata Game Over
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restart-button');
const menuButton = document.getElementById('menu-button');
const finalScoreDisplay = document.getElementById('final-score');

const character = document.getElementById('character');
const obstacle = document.getElementById('obstacle');
const scoreDisplay = document.getElementById('score-display');

// === COSTANTI ===
const GAME_AREA_WIDTH = 1000; 
// 🆕 NUOVO: Aggiungiamo anche l'altezza base per i calcoli di proporzione
const GAME_AREA_HEIGHT = 700;
const GROUND_HEIGHT = 50; 
const OBSTACLE_ANIMATION_NAME = 'slide';

// === COSTANTI SCALABILI PER LA COLLISIONE (BASATE SU 1000x700) ===
const ORIGINAL_GROUND_HEIGHT = 50; 
const ORIGINAL_OBSTACLE_HEIGHT = 60;
const ORIGINAL_TOLERANCE_PX = 10;

// Dimensioni degli elementi (per calcolo collisioni)
const CHARACTER_WIDTH = 60;
const CHARACTER_START_LEFT = 50;
const OBSTACLE_WIDTH = 90;
const OBSTACLE_HEIGHT = 60;

// === STATO DI GIOCO ===
let score = 0;
let displayScore = 0;
let isGameOver = false;
let isGameRunning = false; 

// Configurazione Velocità/Difficoltà
let gameSpeed = 3.0; // Durata iniziale in secondi (più basso = più veloce)
const MIN_SPEED = 1.0; 
const SPEED_DECREMENT = 0.4; 
const SPEED_UPDATE_THRESHOLD = 25; 
let lastSpeedUpdateScore = 0;

// Timer e Intervalli
let gameInterval; // Intervallo per la collisione e l'aumento punteggio
let spawnTimeout; // Timeout per lo spawn dell'ostacolo

// === FUNZIONI DI GIOCO PRINCIPALI ===

/**
 * Avvia il loop di gioco.
 */
function startGame() {
    if (isGameRunning) return;

    // 1. Nasconde la Home Page e mostra gli elementi di gioco
    homepage.classList.add('hidden');
    character.classList.remove('hidden'); 
    obstacle.classList.remove('hidden');
    scoreDisplay.classList.remove('hidden');

    // 2. Resetta lo stato di gioco e le animazioni
    isGameRunning = true;
    character.style.animationPlayState = 'running';
    gameContainer.classList.remove('paused-animations');
    
    // 3. Avvia il primo spawn e il loop di gioco
    spawnObstacle();
    gameInterval = setInterval(gameLoop, 100); // Controlla collisione e aumenta punteggio
}

/**
 * Loop principale del gioco: gestisce punteggio e collisioni.
 */
function gameLoop() {
    if (!isGameRunning || isGameOver) return;

    // Aumenta il punteggio
    score++;
    displayScore = Math.floor(score / 10);
    scoreDisplay.textContent = `SCORE: ${displayScore}`;

    // Aumenta la difficoltà
    if (displayScore > lastSpeedUpdateScore + SPEED_UPDATE_THRESHOLD) {
        increaseDifficulty();
    }

    // Controlla la collisione
    checkCollision();
}

/**
 * Aumenta la velocità di gioco.
 */
function increaseDifficulty() {
    if (gameSpeed > MIN_SPEED) {
        gameSpeed = Math.max(MIN_SPEED, gameSpeed - SPEED_DECREMENT);
        lastSpeedUpdateScore = displayScore;
        console.log(`Velocità aumentata. Nuova durata animazione: ${gameSpeed}s`);
        
        // Applica immediatamente la nuova velocità all'ostacolo corrente
        obstacle.style.animationDuration = `${gameSpeed}s`;
    }
}

/**
 * Controlla se il gatto è in collisione con l'ostacolo.
 */
// script.js

/**
 * Controlla se il gatto è in collisione con l'ostacolo.
 */
function checkCollision() {
    // Ottiene i rect attuali (già scalati)
    const characterRect = character.getBoundingClientRect();
    const obstacleRect = obstacle.getBoundingClientRect();
    const gameContainerRect = gameContainer.getBoundingClientRect();

    // 🛑 1. CALCOLO DEL FATTORE DI SCALA (Correzione)
    // Non usiamo più la larghezza del contenitore (che è 100% dell'area).
    // Usiamo il rapporto tra la larghezza attuale del gatto e la sua larghezza originale (60px).
    // Questo fattore (scaleFactor) è la scala reale che il browser ha applicato a causa delle unità vw/vh.
    const currentScaleFactor = characterRect.width / CHARACTER_WIDTH;
    
    // 🛑 Calcoliamo i valori scalati usando il fattore di scala effettivo del gatto
    const scaledTolerance = ORIGINAL_TOLERANCE_PX * currentScaleFactor;
    
    // Per l'altezza verticale, usiamo il fattore di scala basato sull'altezza (VH),
    // dato che il gioco è "vh-responsive"
    const verticalScaleFactor = characterRect.height / (CHARACTER_WIDTH * (45/60)); // 45/60 è il rapporto originale
    
    // Usiamo il fattore verticale per scalare le altezze di collisione
    const scaledGroundHeight = ORIGINAL_GROUND_HEIGHT * verticalScaleFactor;
    const scaledHalfObstacleHeight = (ORIGINAL_OBSTACLE_HEIGHT / 2) * verticalScaleFactor;

    // Normalizza le posizioni (questo rimane corretto)
    const characterBottom = gameContainerRect.bottom - characterRect.bottom;
    const obstacleLeft = obstacleRect.left - gameContainerRect.left;

    // Condizione Orizzontale: (Usa il fattore di scala basato sulla larghezza)
    const isHorizontalCollision =
        // L'inizio dell'ostacolo deve essere prima della fine del gatto (meno tolleranza)
        obstacleLeft < (CHARACTER_START_LEFT * currentScaleFactor + characterRect.width - scaledTolerance) && 
        // La fine dell'ostacolo deve essere dopo l'inizio del gatto (meno tolleranza)
        (obstacleLeft + obstacleRect.width - scaledTolerance) > (CHARACTER_START_LEFT * currentScaleFactor);

    // Condizione Verticale: (Usa il fattore di scala basato sull'altezza, verticalScaleFactor)
    const isVerticalCollision = characterBottom <= scaledGroundHeight + scaledHalfObstacleHeight;
    
    
    if (isHorizontalCollision && isVerticalCollision) {
        isGameOver = true;
        isGameRunning = false;
        
        // Pulisce tutti gli intervalli e timeout
        clearInterval(gameInterval); 
        clearTimeout(spawnTimeout); 
        
        // Metti in pausa tutte le animazioni
        gameContainer.classList.add('paused-animations'); 
        character.style.animationPlayState = 'paused';

        // Mostra la schermata di Game Over con il punteggio
        finalScoreDisplay.textContent = displayScore;
        gameOverScreen.classList.remove('hidden');
    }
}

/**
 * Gestisce l'animazione dell'ostacolo e il ritardo di spawn.
 */
function spawnObstacle() {
    if (!isGameRunning) return;

    // Applica l'animazione con la velocità attuale
    obstacle.style.animation = `${OBSTACLE_ANIMATION_NAME} ${gameSpeed}s linear`;
    
    // Quando l'animazione finisce, la rimuoviamo e rispawna con un ritardo casuale
    obstacle.onanimationend = () => {
        obstacle.style.animation = 'none'; // Rimuove l'animazione
        
        // Ritorno allo stato iniziale dopo un certo ritardo casuale
        const spawnDelay = Math.random() * (1500 - 500) + 500;
        spawnTimeout = setTimeout(spawnObstacle, spawnDelay);
    };
}


// === FUNZIONI DI CONTROLLO STATO (Restart e Menu) ===

/**
 * 🆕 Reimposta lo stato di gioco e ricomincia. (Pulsante RESTART)
 */
/**
 * 🆕 Reimposta lo stato di gioco e ricomincia. (Pulsante RESTART)
 */
function resetGame() {
    // 1. Nascondi lo schermo di Game Over
    gameOverScreen.classList.add('hidden');
    
    // 🛑 PASSO CRUCIALE: Rimuovi subito la pausa globale
    gameContainer.classList.remove('paused-animations'); 
    
    // 2. Resetta l'ostacolo (Reset Aggressivo)
    
    // A. Rimuovi COMPLETAMENTE tutti gli stili inline (inclusa la posizione bloccata)
    obstacle.removeAttribute('style'); 
    
    // B. Forziamo il browser a ricalcolare il layout (Reflow)
    // Questo è un trucco per garantire che l'elemento sia resettato prima del riavvio.
    void obstacle.offsetWidth; 
    
    // 3. Reimposta variabili di gioco
    score = 0;
    displayScore = 0;
    scoreDisplay.textContent = "SCORE: 0";
    isGameOver = false;
    isGameRunning = false;
    gameSpeed = 3.0; 
    lastSpeedUpdateScore = 0;

    // 4. Resetta il gatto
    character.classList.remove('jump'); 
    
    // 5. Avvia il gioco!
    startGame();
}

/**
 * 🆕 Torna alla schermata iniziale (Homepage). (Pulsante BACK TO MENU)
 */
function backToMenu() {
    // 1. Nascondi Game Over e ripristina la pausa globale
    gameOverScreen.classList.add('hidden');
    gameContainer.classList.remove('paused-animations'); 
    
    // 2. Reimposta tutte le variabili di gioco
    score = 0;
    displayScore = 0;
    scoreDisplay.textContent = "SCORE: 0";
    isGameOver = false;
    isGameRunning = false;
    gameSpeed = 3.0;
    lastSpeedUpdateScore = 0;

    // 3. Resetta l'ostacolo e ferma l'animazione del gatto
    obstacle.style.animation = 'none'; 
    obstacle.style.right = '-90px'; 
    character.style.animationPlayState = 'paused';

    // 4. Mostra la Homepage e nasconde gli elementi di gioco
    homepage.classList.remove('hidden');
    character.classList.add('hidden'); 
    obstacle.classList.add('hidden');
    scoreDisplay.classList.add('hidden');
}


// === GESTIONE EVENTI (Input Utente) ===

/**
 * Gestisce il salto del gatto.
 */
function jump() {
    if (!character.classList.contains('jump') && isGameRunning) {
        character.classList.add('jump');
        
        // Rimuove la classe 'jump' alla fine dell'animazione per poter saltare di nuovo
        character.addEventListener('animationend', () => {
            character.classList.remove('jump');
        }, { once: true });
    }
}

// 🆕 Listeners per i pulsanti di Menu e Game Over
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', resetGame);
menuButton.addEventListener('click', backToMenu);

// Listener per il salto del personaggio (tasto Spazio)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isGameOver) {
        jump();
    }
});


// === INIZIALIZZAZIONE ===

/**
 * Inizializza lo stato iniziale del gioco (nasconde gli elementi di gioco all'avvio).
 */
function init() {
    // Nasconde gli elementi di gioco quando appare la Homepage
    character.classList.add('hidden');
    obstacle.classList.add('hidden');
    scoreDisplay.classList.add('hidden');

    // Assicura che la schermata Game Over sia nascosta
    gameOverScreen.classList.add('hidden'); 
    
    // Inizializza l'animazione del gatto (ma rimane in pausa)
    character.style.animationPlayState = 'paused'; 
}

// Avvia l'inizializzazione quando lo script viene caricato
init();