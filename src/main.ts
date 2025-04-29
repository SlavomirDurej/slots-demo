import * as PIXI from 'pixi.js';
// Import filters and sound directly from pixi.js in v8
import { BlurFilter } from 'pixi.js'; // BlurFilter is in core v8
// GlowFilter not directly available in core v8, removed for now
import { Sound } from '@pixi/sound'; // Use separate package for sound

// --- Constants and Definitions ---

// Enum for Symbol IDs (adjust values as needed)
enum SymbolId {
ARIEL = 'ariel',
BELLE = 'belle',
CINDERELLA = 'cinderella',
RAPUNZEL = 'rapunzel',
CASTLE = 'castle', // Wild?
CROWN = 'crown',
LAMP = 'lamp',
SLIPPER = 'slipper'
}

// Mapping Symbol IDs to Asset Keys
const SYMBOL_MAP: Record<SymbolId, string> = {
[SymbolId.ARIEL]: "symbolAriel",
[SymbolId.BELLE]: "symbolBelle",
[SymbolId.CINDERELLA]: "symbolCinderella",
[SymbolId.RAPUNZEL]: "symbolRapunzel",
[SymbolId.CASTLE]: "symbolCastle",
[SymbolId.CROWN]: "symbolCrown",
[SymbolId.LAMP]: "symbolLamp",
[SymbolId.SLIPPER]: "symbolSlipper",
};

// Basic Interfaces (can be expanded later)
interface ISymbol {
id: SymbolId;
sprite: PIXI.Sprite;
}

interface IReel {
index: number; // Keep track of reel index
symbols: ISymbol[];
container: PIXI.Container;
currentOffset: number; // For tracking visual position during spin
spinSpeed: number;
isSpinning: boolean;
}

const REEL_WIDTH = 200; // Example width, adjust based on frame/symbol size
const SYMBOL_SIZE = 180; // Example size, adjust based on frame/symbol size
const NUM_REELS = 5;
const NUM_ROWS = 3;
const SYMBOLS_PER_REEL = 20; // Number of symbols generated per reel for spinning
const SPIN_SPEED_BASE = 15; // Base speed for spinning (RESTORED)
const SPIN_START_DELAY = 100; // ms delay between starting each reel
const SPIN_STOP_DELAY = 200; // ms delay between stopping each reel
const SPIN_DURATION = 2000; // ms total spin duration before stopping starts (RESTORED)

// Payline definitions (0-indexed grid coordinates [col, row])
// Example: Middle row = [[0,1], [1,1], [2,1], [3,1], [4,1]]
const PAYLINES = [
// Row 1 (Top)
[[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
// Row 2 (Middle)
[[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
// Row 3 (Bottom)
[[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
// Diagonal (Top-Left to Bottom-Right)
[[0, 0], [1, 1], [2, 2], [3, 2], [4, 2]], // Adjusted for 3 rows
// V-Shape (Top-Left, Mid-Center, Top-Right)
[[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]], // Adjusted for 5 reels
];

// Define payouts (example: { symbolId: { 3ofKind: amount, 4ofKind: amount, 5ofKind: amount } })
// Using simple payouts for now
const PAYOUTS: Record<SymbolId, Record<number, number>> = {
[SymbolId.ARIEL]: { 3: 50, 4: 150, 5: 500 },
[SymbolId.BELLE]: { 3: 40, 4: 120, 5: 400 },
[SymbolId.CINDERELLA]: { 3: 30, 4: 100, 5: 300 },
[SymbolId.RAPUNZEL]: { 3: 20, 4: 80, 5: 250 },
[SymbolId.CASTLE]: { 3: 100, 4: 500, 5: 2000 }, // Wild payout (if it forms its own line)
[SymbolId.CROWN]: { 3: 10, 4: 40, 5: 150 },
[SymbolId.LAMP]: { 3: 5, 4: 30, 5: 100 },
[SymbolId.SLIPPER]: { 3: 5, 4: 20, 5: 80 },
};

const WILD_SYMBOL = SymbolId.CASTLE; // Define which symbol is Wild

// --- Predefined Reel Strip ---
const REEL_STRIP: SymbolId[] = [
SymbolId.RAPUNZEL, SymbolId.LAMP,   SymbolId.BELLE,     SymbolId.CASTLE,
SymbolId.CINDERELLA,SymbolId.SLIPPER,SymbolId.ARIEL,     SymbolId.CROWN,
SymbolId.BELLE,     SymbolId.LAMP,   SymbolId.RAPUNZEL,  SymbolId.SLIPPER,
SymbolId.ARIEL,     SymbolId.CASTLE, SymbolId.CINDERELLA,SymbolId.CROWN,
SymbolId.LAMP,      SymbolId.ARIEL,  SymbolId.RAPUNZEL,  SymbolId.BELLE, // Length 20
SymbolId.CASTLE,    SymbolId.SLIPPER,SymbolId.CINDERELLA,SymbolId.LAMP, // Extend if needed
];

if (REEL_STRIP.length < SYMBOLS_PER_REEL) {
//console.warn(REEL_STRIP length (${REEL_STRIP.length}) is less than SYMBOLS_PER_REEL (${SYMBOLS_PER_REEL}). Consider extending the strip.);
}
// Basic check for adjacent duplicates
for (let i = 0; i < REEL_STRIP.length - 1; i++) {
if (REEL_STRIP[i] === REEL_STRIP[i + 1]) {
//console.error(Error: Adjacent duplicate symbols found in REEL_STRIP at index ${i}: ${REEL_STRIP[i]});
}
if (REEL_STRIP[REEL_STRIP.length - 1] === REEL_STRIP[0]) { // Check wrap-around duplicate
//console.error(Error: REEL_STRIP wraps around with duplicate symbols: ${REEL_STRIP[0]});
}
}

const MIN_COIN_SIZE = 0.01;
const MAX_COIN_SIZE = 1.00;
const COIN_SIZE_STEP = 0.01;
const MIN_COINS_PER_LINE = 1;
const MAX_COINS_PER_LINE = 10;
const MIN_LINES = 1;
const MAX_LINES = 25; // Match max defined paylines if applicable, or set limit

// Bet Configuration State
interface BetConfig {
coinSize: number;
coinsPerLine: number;
lines: number;
}

// Get the canvas element first
const canvasElement = document.getElementById('pixi-canvas') as HTMLCanvasElement;

// Define Asset Manifest without audio (we'll load audio separately)
const assetManifest = {
bundles: [
{
name: 'game-assets',
assets: {
// Images only
"background": "assets/images/bg.jpg",
"slotFrame": "assets/images/frame.png",
"symbolAriel": "assets/images/ariel.png",
"symbolBelle": "assets/images/belle.png",
"symbolCinderella": "assets/images/cinderella.png",
"symbolRapunzel": "assets/images/rapunzell.png",
"symbolCastle": "assets/images/castle.png",
"symbolCrown": "assets/images/crown.png",
"symbolLamp": "assets/images/lamp.png",
"symbolSlipper": "assets/images/slipper.png",
}
}
]
};

// Audio paths (to be loaded separately)
const AUDIO_PATHS = {
bgm: "assets/audio/bgm.mp3",
spinSfx: "assets/audio/spin.mp3",
stopSfx: "assets/audio/reel_stop.mp3",
winSfx: "assets/audio/win.mp3",
buttonClickSfx: "assets/audio/click.mp3",
};

// Function to load assets
async function loadAssets() {
// Initialize PIXI Assets
await PIXI.Assets.init({ manifest: assetManifest });
console.log('Loading image assets...');
// Load images via Assets
const loadedAssets = await PIXI.Assets.loadBundle('game-assets');
console.log('Image assets loaded!');
return loadedAssets;
}

// Load sounds separately using Sound.from
async function loadSounds() {
console.log('Loading audio assets...');

// Create an object to store loaded sounds
const sounds: Record<string, Sound> = {};

// Load each sound file
for (const [key, path] of Object.entries(AUDIO_PATHS)) {
    try {
        sounds[key] = Sound.from({
            url: path,
            preload: key === 'bgm', // Preload BGM, load others on demand
            autoPlay: false
        });
        console.log(`Loaded sound: ${key}`);
    } catch (e) {
        console.error(`Failed to load sound: ${key}`, e);
    }
}

console.log('Audio assets loaded!');
return sounds;
}

// Main async function to setup and start the game
async function main() {
// Get canvas element
const canvasElement = document.getElementById('pixi-canvas') as HTMLCanvasElement;
if (!canvasElement) {
console.error("Canvas element not found!");
return;
}

// Basic PixiJS Application Setup
// Use static init method for v8+
const app = new PIXI.Application();
await app.init({
    width: 1280, // Adjust to match background aspect ratio perhaps
    height: 720,
    backgroundColor: 0x000000, // Black background until assets load
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
    canvas: canvasElement, // Use 'canvas' option in init
});
console.log('PixiJS Initialized');

// Show loading state (optional)
// Use new Text format
const loadingText = new PIXI.Text({
    text: 'Loading...',
    style: { fill: 'white', fontSize: 24 }
});
loadingText.anchor.set(0.5);
loadingText.x = app.screen.width / 2;
loadingText.y = app.screen.height / 2;
app.stage.addChild(loadingText);

// Load assets and sounds in parallel
const [assets, sounds] = await Promise.all([loadAssets(), loadSounds()]);

// Remove loading text
app.stage.removeChild(loadingText);
app.renderer.background.color = 0x1099bb; // Set final background color if needed

// --- Game Initialization Logic --- 

// Display Background
const backgroundSprite = new PIXI.Sprite(assets.background);
// Scale background to fit screen (example: cover)
backgroundSprite.width = app.screen.width;
backgroundSprite.height = app.screen.height;
app.stage.addChild(backgroundSprite);

// Display Frame (ensure it's added after background)
const frameSprite = new PIXI.Sprite(assets.slotFrame);
// Center the frame (adjust position as needed)
frameSprite.anchor.set(0.5);
frameSprite.x = app.screen.width / 2;
frameSprite.y = app.screen.height / 2;
// Optional: Scale frame if necessary
// frameSprite.scale.set(0.8); 
app.stage.addChild(frameSprite);

// --- Create Slot Grid --- 
const reelsContainer = new PIXI.Container();
const gridWidth = NUM_REELS * REEL_WIDTH;
const gridHeight = NUM_ROWS * SYMBOL_SIZE;
// Position reelsContainer more accurately within the frame (adjust as needed)
// Assuming frame anchor is 0.5, 0.5
reelsContainer.x = frameSprite.x - gridWidth / 2;
reelsContainer.y = frameSprite.y - gridHeight / 2;
app.stage.addChild(reelsContainer);

// Create mask with separate method calls
const reelsMask = new PIXI.Graphics();
reelsMask.rect(reelsContainer.x, reelsContainer.y, gridWidth, gridHeight); // Define shape
reelsMask.fill(0xffffff); // Fill shape
reelsContainer.mask = reelsMask;

let reels: IReel[] = [];
const allSymbolIds = Object.values(SymbolId);

// Get available textures once
const symbolTextures = allSymbolIds.map(id => assets[SYMBOL_MAP[id]]);
// Log available textures for debugging
console.log("Available symbol textures:", symbolTextures.length, symbolTextures);

// Create reels and populate using the REEL_STRIP
for (let i = 0; i < NUM_REELS; i++) {
    const reelContainer = new PIXI.Container();
    reelContainer.x = i * REEL_WIDTH;
    reelsContainer.addChild(reelContainer);

    const reel: IReel = {
        index: i,
        symbols: [],
        container: reelContainer,
        currentOffset: 0, // This might become obsolete with new stop logic
        spinSpeed: 0,
        isSpinning: false,
    };

    // Define a starting offset for each reel strip for variation
    const reelOffset = i * 3; // Example: offset each reel by 3 positions

    for (let j = 0; j < SYMBOLS_PER_REEL; j++) {
        // Calculate index into the REEL_STRIP, wrapping around
        const stripIndex = (j + reelOffset) % REEL_STRIP.length;
        const symbolId = REEL_STRIP[stripIndex];
        const texture = assets[SYMBOL_MAP[symbolId]];

        // Removed the do...while loop and random selection
        
        const sprite = new PIXI.Sprite(texture);
        
        sprite.width = SYMBOL_SIZE;
        sprite.height = SYMBOL_SIZE;
        // Stack symbols vertically, offsetting to place symbols above the view
        sprite.y = (j - NUM_ROWS) * SYMBOL_SIZE; 
        sprite.x = (REEL_WIDTH - SYMBOL_SIZE) / 2; 

        reelContainer.addChild(sprite);
        // Store the definitive symbol ID from the strip
        reel.symbols.push({ id: symbolId, sprite: sprite }); 
    }
    reels.push(reel);
}

// Game state variable
let isSpinning = false;
let currentWin = 0;
// Store sprites being tinted for cleanup
let activeWinSprites: PIXI.Sprite[] = []; 

// Initial Bet Configuration
const currentBet: BetConfig = {
    coinSize: 0.05,
    coinsPerLine: 4,
    lines: 25, // Default to max lines for demo
};

// --- Update Bet Display --- 
function calculateTotalBet(): number {
    return currentBet.lines * currentBet.coinsPerLine * currentBet.coinSize;
}

function updateTotalBetDisplay() {
    const totalBet = calculateTotalBet();
    // Update Text object's text property
    betText.text = `BET: $${totalBet.toFixed(2)}`;
    // Also update win display (example, reset on bet change?)
    winText.text = `WIN: $${currentWin.toFixed(2)}`;
    // Update balance display (example)
    // balanceText.text = `BALANCE: $${currentBalance.toFixed(2)}`; 
}

// --- Audio Playback Helpers ---
function playSound(soundKey: string) {
    const sound = sounds[soundKey];
    if (sound) {
        sound.play();
    } else {
        console.warn(`Sound not found: ${soundKey}`);
    }
}

// --- Win Animation Logic ---
function playWinAnimation(winningLines: WinningLine[]) {
    console.log("Playing win animation...");
    playSound('winSfx');
    clearWinAnimation(); // Clear previous tints/highlights

    // Use tint for highlighting winning symbols
    const highlightTint = 0xFFFF00; // Yellow tint

    winningLines.forEach(winInfo => {
        winInfo.symbolPositions.forEach(pos => {
            const reel = reels[pos.reel];
            if (reel && reel.symbols[pos.symbolIndex]) {
                const winningSprite = reel.symbols[pos.symbolIndex].sprite;
                winningSprite.tint = highlightTint;
                activeWinSprites.push(winningSprite); // Track tinted sprites
            }
        });
    });

    // Clear the tint after a delay
    setTimeout(clearWinAnimation, 2000);
}

function clearWinAnimation() {
    console.log("Clearing win animation...");
    // Reset tint on previously highlighted sprites
    activeWinSprites.forEach(sprite => {
        sprite.tint = 0xFFFFFF; // Reset to default tint (white)
    });
    activeWinSprites = []; // Clear the tracking array
}

// --- Win Detection Logic ---
interface WinningLine {
    lineIndex: number;
    symbolId: SymbolId;
    count: number;
    payout: number;
    symbolPositions: { reel: number; symbolIndex: number }[]; // Indices within the IReel.symbols array
}

function checkWins(finalReelPositions: IReel[]): WinningLine[] {
    const winners: WinningLine[] = [];
    let totalWin = 0;

    // Get the final visible grid based on reel offsets
    const finalGrid: (SymbolId | null)[][] = Array(NUM_REELS).fill(0).map(() => Array(NUM_ROWS).fill(null));
    finalReelPositions.forEach((reel, reelIndex) => {
        const startSymbolIndex = Math.round(-reel.container.y / SYMBOL_SIZE);
        for (let rowIndex = 0; rowIndex < NUM_ROWS; rowIndex++) {
            const symbolIndexInReel = (startSymbolIndex + rowIndex + SYMBOLS_PER_REEL) % SYMBOLS_PER_REEL;
            if (reel.symbols[symbolIndexInReel]) {
                finalGrid[reelIndex][rowIndex] = reel.symbols[symbolIndexInReel].id;
            } 
        }
    });
    
    console.log("Checking wins on grid:", finalGrid);

    PAYLINES.forEach((line, lineIndex) => {
        let lineMatchCount = 0;
        let firstSymbolId: SymbolId | null = null;
        const winningPositions: { reel: number; symbolIndex: number }[] = [];

        for (let reelIndex = 0; reelIndex < NUM_REELS; reelIndex++) {
            const [col, row] = line[reelIndex];
            const currentSymbolId = finalGrid[col][row];

            if (currentSymbolId === null) break; // Stop if symbol is missing (shouldn't happen)

            if (reelIndex === 0) {
                // First symbol on the line determines the potential match
                firstSymbolId = currentSymbolId;
                lineMatchCount = 1;
                // Find the index in the actual reel symbols array
                const startSymbolIndex = Math.round(-finalReelPositions[col].container.y / SYMBOL_SIZE);
                const symbolIndexInReel = (startSymbolIndex + row + SYMBOLS_PER_REEL) % SYMBOLS_PER_REEL;
                winningPositions.push({ reel: col, symbolIndex: symbolIndexInReel });
            } else {
                // Check subsequent symbols
                if (currentSymbolId === firstSymbolId || currentSymbolId === WILD_SYMBOL || firstSymbolId === WILD_SYMBOL) {
                     // If the first symbol was wild, the line continues with the second non-wild symbol type
                     if (firstSymbolId === WILD_SYMBOL && currentSymbolId !== WILD_SYMBOL) {
                         firstSymbolId = currentSymbolId; 
                     }
                     lineMatchCount++;
                     const startSymbolIndex = Math.round(-finalReelPositions[col].container.y / SYMBOL_SIZE);
                     const symbolIndexInReel = (startSymbolIndex + row + SYMBOLS_PER_REEL) % SYMBOLS_PER_REEL;
                     winningPositions.push({ reel: col, symbolIndex: symbolIndexInReel });
                } else {
                    break; // Sequence broken
                }
            }
        }

        // Check for win (3, 4, or 5 of a kind)
        if (lineMatchCount >= 3) {
            const winningSymbol = firstSymbolId as SymbolId; // Should not be null here
            const payoutInfo = PAYOUTS[winningSymbol];
            if (payoutInfo && payoutInfo[lineMatchCount]) {
                const payout = payoutInfo[lineMatchCount];
                winners.push({
                    lineIndex,
                    symbolId: winningSymbol,
                    count: lineMatchCount,
                    payout,
                    symbolPositions: winningPositions.slice(0, lineMatchCount) // Only include positions part of the win
                });
                totalWin += payout;
                console.log(`WIN! Line ${lineIndex + 1}, Symbol: ${winningSymbol}, Count: ${lineMatchCount}, Payout: ${payout}`);
            }
        }
    });

    currentWin = totalWin;
    // TODO: Update WIN display text
    winText.text = `WIN: $${currentWin.toFixed(2)}`; // Basic update

    if (winners.length > 0) {
        console.log("Total Win:", totalWin);
        playWinAnimation(winners); // Trigger win animation
    }
    return winners;
}

// --- Reel Spinning Logic --- 
async function startSpin() {
    console.log("--- startSpin function entered ---");
    if (isSpinning) {
         console.log("Already spinning, exiting startSpin.");
         return;
    }
    isSpinning = true;
    console.log("Starting spin...");
    spinButton.eventMode = 'none';
    spinButton.alpha = 0.6;
    clearWinAnimation(); // Clear wins before starting spin
    winText.text = `WIN: $0.00`; // Reset win text
    currentWin = 0;

    // TODO: Clear previous win highlights

    // Staggered start - RE-ENABLED FOR ALL REELS
    for (let i = 0; i < NUM_REELS; i++) {
    // const i = 0; // Only process the first reel
        const reel = reels[i];
        reel.isSpinning = true;
        reel.spinSpeed = SPIN_SPEED_BASE + Math.random() * 5;
        
        // Disable blur for debugging
        // const blurFilter = new BlurFilter();
        // blurFilter.blurY = 10;
        // blurFilter.quality = 2;
        // reel.container.filters = [blurFilter];
        
        playSound('spinSfx');
        // Re-enable delay
        await new Promise(resolve => setTimeout(resolve, SPIN_START_DELAY));
    }

    // Set timeout for stopping the spin
    console.log(`Setting timeout to stop spin in ${SPIN_DURATION}ms`);
    setTimeout(stopSpin, SPIN_DURATION);
}

// Function to stop reels - RE-ENABLED FOR ALL REELS
async function stopSpin() {
    // const finalGrid = getFinalSymbols(); // Determine the target symbols - COMMENTED OUT (Needs rewrite)

    for (let i = 0; i < NUM_REELS; i++) {
    // const i = 0; // Only process the first reel
        const reel = reels[i];
        // const targetSymbols = finalGrid[i]; // Get the target symbols for this reel - COMMENTED OUT

        // Calculate the target Y position - ALL RELATED LOGIC COMMENTED OUT UNTIL REWRITE
        /* 
        const firstTargetSymbolIndex = 0; // TEMPORARY Placeholder
        
        if (firstTargetSymbolIndex !== -1) { // This condition is always true with placeholder
            // Calculate the desired final offset based on the target symbol's position
            const targetOffset = -(firstTargetSymbolIndex * SYMBOL_SIZE);
            
            // TODO: Implement smoother stopping (tweening?) instead of instant snap
            // For now, we'll snap after the delay
            await new Promise(resolve => setTimeout(resolve, SPIN_STOP_DELAY));
            
            reel.isSpinning = false;
            reel.spinSpeed = 0;
            // Clear filters by assigning empty array
            reel.container.filters = []; 
            // reel.container.y = targetOffset; // Snap to final position - COMMENTED OUT (Container doesn't move)
            // Adjust sprites to targetOffset relative positions? Needs careful thought for new animation style.
            reel.currentOffset = targetOffset; // Keep track of logical offset for win checking?

            // Update symbol sprites based on final grid (ensure visual consistency) - COMMENTED OUT
            
            // OPTIONAL: Update symbols outside the visible area too for seamless next spin

        } else {
            // Fallback if target symbol not found (shouldn't happen with random generation)
            await new Promise(resolve => setTimeout(resolve, SPIN_STOP_DELAY));
            reel.isSpinning = false;
            reel.spinSpeed = 0;
             // Clear filters by assigning empty array
            reel.container.filters = [];
        }
        */
       // Minimal stop logic for now: Mark as not spinning after delay
        await new Promise(resolve => setTimeout(resolve, SPIN_STOP_DELAY));
        reel.isSpinning = false;
        reel.spinSpeed = 0;
        reel.container.filters = []; // Ensure filters are cleared

        playSound('stopSfx');
    }

    console.log("Spin finished.");
    isSpinning = false;
    spinButton.eventMode = 'static';
    spinButton.alpha = 1.0;

    // Trigger win detection after a short delay to let reels settle visually
    setTimeout(() => checkWins(reels), 100); 
}

// --- Game Loop (Ticker) --- 
app.ticker.add((ticker: PIXI.Ticker) => { 
    const delta = ticker.deltaTime;

    reels.forEach(reel => {
        if (reel.isSpinning) {
            // Move all sprites first
            reel.container.children.forEach(child => {
                const sprite = child as PIXI.Sprite;
                sprite.y += reel.spinSpeed * delta;
            });

            // Now check for wrapping AFTER movement
            const totalReelHeight = SYMBOLS_PER_REEL * SYMBOL_SIZE;
            let currentTopY = Infinity; // Find the actual minimum Y among all sprites
             reel.container.children.forEach(s => {
                currentTopY = Math.min(currentTopY, (s as PIXI.Sprite).y);
             });

            // Wrap any sprite that went off the bottom
            reel.container.children.forEach(child => {
                const sprite = child as PIXI.Sprite;
                // Check if sprite's top edge has gone off the effective bottom
                if (sprite.y >= totalReelHeight) {
                    // Position this sprite exactly one symbol height ABOVE the current topmost sprite
                    sprite.y = currentTopY - SYMBOL_SIZE;
                }
            });
        }
    });
});

// --- Create UI Elements --- 
const uiContainer = new PIXI.Container();
app.stage.addChild(uiContainer);
// TODO: Position UI elements appropriately (e.g., bottom bar)

// Corrected Text Styles
const textStyle = new PIXI.TextStyle({
    fill: "white",
    fontSize: 24,
    fontWeight: "bold",
    stroke: { color: "#000000", width: 4 } // Combine stroke color and width
});

// Balance Display
const balanceText = new PIXI.Text({ text: "BALANCE: $1000.00", style: textStyle });
balanceText.x = 50; // Example position
balanceText.y = app.screen.height - 50; // Example position (bottom left)
uiContainer.addChild(balanceText);

// Bet Display
const betText = new PIXI.Text({ text: "BET: $1.00", style: textStyle });
betText.x = 350; // Example position
betText.y = app.screen.height - 50; // Example position
betText.eventMode = 'static';
betText.cursor = 'pointer';
uiContainer.addChild(betText);

// Win Display
const winText = new PIXI.Text({ text: "WIN: $0.00", style: textStyle });
winText.x = 650; // Example position
winText.y = app.screen.height - 50; // Example position
uiContainer.addChild(winText);

// Spin Button - separate method calls
const spinButton = new PIXI.Graphics();
spinButton.circle(0, 0, 50); // Define shape
spinButton.fill({ color: 0x00AA00 }); // Fill shape
spinButton.x = app.screen.width - 100; 
spinButton.y = app.screen.height - 80;
spinButton.eventMode = 'static';
spinButton.cursor = 'pointer';
uiContainer.addChild(spinButton);

const spinButtonText = new PIXI.Text({
    text: "SPIN",
    style: {
        fill: "white",
        fontSize: 28, 
        fontWeight: "bold"
    }
});
spinButtonText.anchor.set(0.5);
spinButtonText.x = spinButton.x;
spinButtonText.y = spinButton.y;
spinButtonText.eventMode = 'none'; // Make text non-interactive
uiContainer.addChild(spinButtonText);

spinButton.on('pointertap', () => {
    console.log("--- Spin button pointertap listener fired ---");
    startSpin();
});

// --- Settings Overlay Logic --- 
const settingsOverlay = document.getElementById('settings-overlay');
const closeOverlayButton = document.getElementById('close-overlay-button');
const coinSizeValueSpan = document.getElementById('coin-size-value');
const coinsLineValueSpan = document.getElementById('coins-line-value');
const linesValueSpan = document.getElementById('lines-value');

// Function to update overlay display
function updateOverlayDisplay() {
    if (coinSizeValueSpan) coinSizeValueSpan.textContent = currentBet.coinSize.toFixed(2);
    if (coinsLineValueSpan) coinsLineValueSpan.textContent = currentBet.coinsPerLine.toString();
    if (linesValueSpan) linesValueSpan.textContent = currentBet.lines.toString();
}

if (settingsOverlay && closeOverlayButton && coinSizeValueSpan && coinsLineValueSpan && linesValueSpan) {
    // Initial display update
    updateOverlayDisplay();
    updateTotalBetDisplay(); // Update main bet display initially

    // Open overlay when Bet Text is clicked
    betText.on('pointertap', () => {
        console.log("Bet text clicked, opening overlay");
        updateOverlayDisplay(); // Ensure overlay shows current values
        settingsOverlay.style.display = 'flex';
        playSound('buttonClickSfx');
    });

    // Close overlay button
    closeOverlayButton.addEventListener('click', () => {
        playSound('buttonClickSfx');
        settingsOverlay.style.display = 'none';
    });

    // Add listeners to +/- buttons
    const overlayButtons = settingsOverlay.querySelectorAll('button');
    overlayButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            const parentP = target.parentElement;
            if (!parentP) return;

            let changed = false;
            if (parentP.textContent?.includes('Coin Size')) {
                const increment = target.textContent === '+';
                const currentVal = currentBet.coinSize;
                let newVal = increment ? currentVal + COIN_SIZE_STEP : currentVal - COIN_SIZE_STEP;
                newVal = Math.max(MIN_COIN_SIZE, Math.min(MAX_COIN_SIZE, newVal));
                // Round to avoid floating point issues
                newVal = Math.round(newVal * 100) / 100; 
                if (newVal !== currentVal) {
                     currentBet.coinSize = newVal;
                     changed = true;
                }
            } else if (parentP.textContent?.includes('Coins/Line')) {
                const increment = target.textContent === '+';
                const currentVal = currentBet.coinsPerLine;
                let newVal = increment ? currentVal + 1 : currentVal - 1;
                newVal = Math.max(MIN_COINS_PER_LINE, Math.min(MAX_COINS_PER_LINE, newVal));
                if (newVal !== currentVal) {
                     currentBet.coinsPerLine = newVal;
                     changed = true;
                }
            } else if (parentP.textContent?.includes('Lines')) {
                const increment = target.textContent === '+';
                const currentVal = currentBet.lines;
                let newVal = increment ? currentVal + 1 : currentVal - 1;
                newVal = Math.max(MIN_LINES, Math.min(MAX_LINES, newVal));
                if (newVal !== currentVal) {
                     currentBet.lines = newVal;
                     changed = true;
                     // NOTE: Win checking logic currently uses all defined PAYLINES
                     // Doesn't dynamically adjust based on this 'lines' setting yet.
                }
            }

            if (changed) {
                playSound('buttonClickSfx');
                updateOverlayDisplay();
                updateTotalBetDisplay();
            }
        });
    });

    // Remove old settings button logic if it exists
    // (Assuming the graphic button created earlier is no longer needed)
    // Find and remove the old button and text if necessary
    // app.stage.removeChild(openSettingsButton);
    // app.stage.removeChild(settingsButtonText);
}

// Start background music
const startBgm = () => {
    console.log("--- startBgm function entered ---");
    // Use the bgm key to access the sound
    if (sounds.bgm && !sounds.bgm.isPlaying) { 
        console.log("Playing BGM...");
        sounds.bgm.play({ 
            loop: true, 
            volume: 0.5 
        });
        app.stage.off('pointertap', startBgm);
        // spinButton.off('pointertap', startBgm); // Remove this too, stage listener is enough
    }
};
app.stage.eventMode = 'static'; 
app.stage.on('pointertap', startBgm); // Keep stage listener for first interaction

}

// Start the main async function
main();