import * as PIXI from 'pixi.js';
// Import specific Pixi types
import type { AssetsManifest, Texture } from 'pixi.js';
import { BlurFilter } from 'pixi.js';
import { Sound } from '@pixi/sound';

// --- Constants and Definitions ---

enum SymbolId {
    ARIEL = 'ariel', BELLE = 'belle', CINDERELLA = 'cinderella', RAPUNZEL = 'rapunzel',
    CASTLE = 'castle', CROWN = 'crown', LAMP = 'lamp', SLIPPER = 'slipper'
}

const SYMBOL_MAP: Record<SymbolId, string> = {
    [SymbolId.ARIEL]: "symbolAriel", [SymbolId.BELLE]: "symbolBelle",
    [SymbolId.CINDERELLA]: "symbolCinderella", [SymbolId.RAPUNZEL]: "symbolRapunzel",
    [SymbolId.CASTLE]: "symbolCastle", [SymbolId.CROWN]: "symbolCrown",
    [SymbolId.LAMP]: "symbolLamp", [SymbolId.SLIPPER]: "symbolSlipper",
};

// --- Interfaces ---
interface ISymbol {
    id: SymbolId;
    sprite: PIXI.Sprite | PIXI.Graphics;
    originalIndex: number; // The index this symbol had in the original REEL_STRIP definition
}

interface IReel {
    index: number; symbols: ISymbol[]; container: PIXI.Container;
    isSpinning: boolean; isStopping: boolean; spinSpeed: number;
    blurFilter: BlurFilter; stopTweenDuration: number; stopTweenElapsed: number;
    symbolStopData: Array<{ sprite: PIXI.Sprite | PIXI.Graphics; startY: number; targetY: number }>;
    targetSymbolArrayIndex: number; // Store the index decided for the stop
}

interface BetConfig { coinSize: number; coinsPerLine: number; lines: number; }

interface WinningLine {
    lineIndex: number; symbolId: SymbolId; count: number; payout: number;
    symbolPositions: { reel: number; symbolIndex: number }[]; // Index within the specific reel's symbols array
}

// --- Game Dimensions and Timing ---
const REEL_WIDTH = 200; const SYMBOL_SIZE = 180; const NUM_REELS = 5; const NUM_ROWS = 3;
const SYMBOLS_PER_REEL = 20; const SPIN_SPEED_BASE = 25; const SPIN_START_DELAY = 100;
const SPIN_STOP_DELAY = 200; const SPIN_DURATION = 1500; const REEL_STOP_DURATION = 500; // Duration for smooth stop

// --- Win Animation --- 
const WIN_MESSAGE_DURATION = 400; // ms for the scale tween (Faster: 0.4s)
const WIN_MESSAGE_OVERSHOOT = 1.70158; // Constant for easeInBack/easeOutBack

// --- Paylines and Payouts ---
const PAYLINES: number[][][] = [
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // Top Row
    [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], // Middle Row
    [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]], // Bottom Row
    [[0, 0], [1, 1], [2, 2], [3, 2], [4, 2]], // Diagonal TL-BR (Adjusted for 3 rows)
    [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]], // V-Shape
];
const WILD_SYMBOL = SymbolId.CASTLE;
const PAYOUTS: Record<SymbolId, Record<number, number>> = {
    [SymbolId.ARIEL]: { 3: 50, 4: 150, 5: 500 }, [SymbolId.BELLE]: { 3: 40, 4: 120, 5: 400 },
    [SymbolId.CINDERELLA]: { 3: 30, 4: 100, 5: 300 }, [SymbolId.RAPUNZEL]: { 3: 20, 4: 80, 5: 250 },
    [SymbolId.CASTLE]: { 3: 100, 4: 500, 5: 2000 }, [SymbolId.CROWN]: { 3: 10, 4: 40, 5: 150 },
    [SymbolId.LAMP]: { 3: 5, 4: 30, 5: 100 }, [SymbolId.SLIPPER]: { 3: 5, 4: 20, 5: 80 },
};

// --- Reel Strip Definition ---
const REEL_STRIP: SymbolId[] = [ // Length 20
    SymbolId.RAPUNZEL, SymbolId.LAMP, SymbolId.BELLE, SymbolId.CASTLE, SymbolId.CINDERELLA, // 0-4
    SymbolId.SLIPPER, SymbolId.ARIEL, SymbolId.CROWN, SymbolId.BELLE, SymbolId.LAMP,       // 5-9
    SymbolId.RAPUNZEL, SymbolId.SLIPPER, SymbolId.ARIEL, SymbolId.CASTLE, SymbolId.CINDERELLA, // 10-14
    SymbolId.CROWN, SymbolId.LAMP, SymbolId.ARIEL, SymbolId.RAPUNZEL, SymbolId.BELLE        // 15-19
];
if (REEL_STRIP.length < SYMBOLS_PER_REEL) { console.warn(`REEL_STRIP length issue.`); }

// Find indices in REEL_STRIP for forced wins (top row target)
const CINDERELLA_INDEX = REEL_STRIP.indexOf(SymbolId.CINDERELLA); // 4
const CASTLE_INDEX = REEL_STRIP.indexOf(SymbolId.CASTLE);       // 3
const BELLE_INDEX = REEL_STRIP.indexOf(SymbolId.BELLE);         // 2
const ARIEL_INDEX = REEL_STRIP.indexOf(SymbolId.ARIEL);         // 6
const LAMP_INDEX = REEL_STRIP.indexOf(SymbolId.LAMP);           // 1

// --- Bet Configuration Limits ---
const MIN_COIN_SIZE = 0.01; const MAX_COIN_SIZE = 1.00; const COIN_SIZE_STEP = 0.01;
const MIN_COINS_PER_LINE = 1; const MAX_COINS_PER_LINE = 10;
const MIN_LINES = 1; const MAX_LINES = PAYLINES.length;

// --- Asset Loading ---
const assetManifest: AssetsManifest = {
    bundles: [ {
            name: 'game-assets',
            assets: {
                "background": "assets/images/bg.jpg", "slotFrame": "assets/images/frame.png",
                "symbolAriel": "assets/images/ariel.png", "symbolBelle": "assets/images/belle.png",
                "symbolCinderella": "assets/images/cinderella.png", "symbolRapunzel": "assets/images/rapunzell.png",
                "symbolCastle": "assets/images/castle.png", "symbolCrown": "assets/images/crown.png",
                "symbolLamp": "assets/images/lamp.png", "symbolSlipper": "assets/images/slipper.png",
                "spinButton": "assets/images/spin-btn.png", // Make sure this exists
                "youwon": "assets/images/youwon.png" // Add the win image
            } } ]
};
type AudioKey = "bgm" | "spinSfx" | "stopSfx" | "winSfx" | "buttonClickSfx";
const AUDIO_PATHS: Record<AudioKey, string> = {
    bgm: "assets/audio/bgm.mp3", spinSfx: "assets/audio/spin.mp3",
    stopSfx: "assets/audio/reel_stop.mp3", winSfx: "assets/audio/win.mp3",
    buttonClickSfx: "assets/audio/click.mp3",
};

async function loadAssets(): Promise<Record<string, Texture>> {
    await PIXI.Assets.init({ manifest: assetManifest });
    const loadedAssets = await PIXI.Assets.loadBundle('game-assets') as Record<string, Texture>;
    return loadedAssets;
}
async function loadSounds(): Promise<Record<AudioKey, Sound>> {
    const sounds: Record<AudioKey, Sound> = {} as Record<AudioKey, Sound>;
    for (const key of Object.keys(AUDIO_PATHS) as AudioKey[]) {
        const path = AUDIO_PATHS[key];
        try { sounds[key] = Sound.from({ url: path as string, preload: key === 'bgm', autoPlay: false }); }
        catch (e) { console.error(`Failed to load sound: ${key}`, e); }
    } return sounds;
}

// --- Easing Function ---
// Removed easeInBack
/*
function easeInBack(t: number): number {
    const c1 = WIN_MESSAGE_OVERSHOOT;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
}
*/

// Reinstate easeOutBack
function easeOutBack(t: number): number {
    const c1 = WIN_MESSAGE_OVERSHOOT;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// --- Main Game Function ---
async function main() {
    // --- App Setup ---
    const canvasElement = document.getElementById('pixi-canvas') as HTMLCanvasElement;
    if (!canvasElement) { console.error("Canvas element not found!"); return; }
    const app = new PIXI.Application();
    // Use logical dimensions for design, renderer will resize
    const designWidth = 1280;
    const designHeight = 720;
    await app.init({
        // width: 1280, height: 720, // Remove fixed size
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
        canvas: canvasElement,
        resizeTo: window // Automatically resize renderer to window
    });

    // --- Resize Handler ---
    const resizeHandler = () => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Calculate scale factor, maintaining aspect ratio (letterboxing/pillarboxing)
        const scaleX = screenWidth / designWidth;
        const scaleY = screenHeight / designHeight;
        const scale = Math.min(scaleX, scaleY);

        // Calculate the new dimensions of the stage
        const stageWidth = designWidth * scale;
        const stageHeight = designHeight * scale;

        // Set the scale and position of the stage to center it
        app.stage.scale.set(scale);
        app.stage.x = (screenWidth - stageWidth) / 2;
        app.stage.y = (screenHeight - stageHeight) / 2;

        // Renderer automatically resizes due to 'resizeTo: window',
        // but you might need this if not using resizeTo
        // app.renderer.resize(screenWidth, screenHeight);
    };

    // --- Loading ---
    const loadingText = new PIXI.Text({ text: 'Loading...', style: { fill: 'white', fontSize: 24 } });
    loadingText.anchor.set(0.5);
    // Position loading text relative to design center, will be scaled/positioned by resize handler
    loadingText.position.set(designWidth / 2, designHeight / 2);
    app.stage.addChild(loadingText);

    // Initial resize call to set up layout
    resizeHandler();
    window.addEventListener('resize', resizeHandler); // Add resize listener

    const [assets, sounds] = await Promise.all([loadAssets(), loadSounds()]);
    app.stage.removeChild(loadingText);

    // --- Game Initialization (Position relative to DESIGN dimensions) ---
    const frameSprite = new PIXI.Sprite(assets.slotFrame);
    frameSprite.anchor.set(0.5);
    // Position relative to the DESIGN center
    frameSprite.position.set(designWidth / 2, designHeight / 2);
    frameSprite.scale.set(0.95); // Keep original asset scaling if needed

    const reelsContainer = new PIXI.Container();
    const gridWidth = NUM_REELS * REEL_WIDTH;
    const gridHeight = NUM_ROWS * SYMBOL_SIZE;
    // Position relative to the scaled FRAME position
    reelsContainer.x = frameSprite.x - gridWidth / 2;
    reelsContainer.y = frameSprite.y + 8 - gridHeight / 2; // Adjust Y offset if needed
    app.stage.addChild(reelsContainer); // Add reels container first
    // Mask needs to be relative to the reelsContainer's *parent* (the stage)
    // We'll create it but update its position/size in the resize handler or position it within the stage
    // For simplicity now, let's position it relative to the stage origin (0,0) initially
    // and rely on the stage transform to place it correctly.
    // The MASK coordinates are in the PARENT's coordinate system (the stage)
    // BEFORE the stage scaling/translation. So we use design coordinates.
    const reelsMask = new PIXI.Graphics()
        .rect(reelsContainer.x, reelsContainer.y, gridWidth, gridHeight)
        .fill(0xffffff);
    reelsContainer.mask = reelsMask;
    // IMPORTANT: Add the mask to the stage IF the mask should scale/move with the stage.
    // If the mask should stay fixed relative to the container, this setup is okay,
    // but it's often easier if the mask is also part of the stage hierarchy.
    // Let's add it to the stage for consistency with scaling.
    app.stage.addChild(reelsMask);


    app.stage.addChild(frameSprite); // Add frame on top of reels

    const spinButton = new PIXI.Sprite(assets.spinButton);
    spinButton.anchor.set(0.5);
    // Position relative to the scaled FRAME position
    spinButton.x = frameSprite.x + frameSprite.width * 0.48; // Position relative to frame
    spinButton.y = frameSprite.y + frameSprite.height * 0.28;
    spinButton.scale.set(0.55); // Keep original asset scaling
    spinButton.eventMode = 'static';
    spinButton.cursor = 'pointer';
    app.stage.addChild(spinButton); // Add spin button last

    // --- Reel Setup ---
    let reels: IReel[] = []; const totalReelHeight = SYMBOLS_PER_REEL * SYMBOL_SIZE;
    for (let i = 0; i < NUM_REELS; i++) {
        const reelContainer = new PIXI.Container(); reelContainer.x = i * REEL_WIDTH; reelsContainer.addChild(reelContainer);
        const blurFilter = new BlurFilter(); blurFilter.blurX = 0; blurFilter.blurY = 0; blurFilter.quality = 2; reelContainer.filters = [blurFilter];
        const reel: IReel = { index: i, symbols: [], container: reelContainer, isSpinning: false, isStopping: false, spinSpeed: 0, blurFilter: blurFilter, stopTweenDuration: 0, stopTweenElapsed: 0, symbolStopData: [], targetSymbolArrayIndex: -1 }; // Initialize target index
        const reelOffset = i * 3; // Stagger starting strip position
        for (let j = 0; j < SYMBOLS_PER_REEL; j++) {
            const stripIndex = (j + reelOffset) % REEL_STRIP.length; const symbolId = REEL_STRIP[stripIndex]; const texture = assets[SYMBOL_MAP[symbolId]];
            let displayObject: PIXI.Sprite | PIXI.Graphics;
            if (!texture) { displayObject = new PIXI.Graphics().rect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE).fill(0xff0000); }
            else { displayObject = new PIXI.Sprite(texture); displayObject.width = SYMBOL_SIZE; displayObject.height = SYMBOL_SIZE; }
            displayObject.y = j * SYMBOL_SIZE; displayObject.x = (REEL_WIDTH - SYMBOL_SIZE) / 2;
            reelContainer.addChild(displayObject);
            reel.symbols.push({ id: symbolId, sprite: displayObject, originalIndex: stripIndex }); // Store original strip index
        }
        // Initial position so roughly middle appears
        reel.container.y = -Math.floor(SYMBOLS_PER_REEL / 2) * SYMBOL_SIZE + Math.floor(NUM_ROWS / 2) * SYMBOL_SIZE;
        reels.push(reel);
    }

    // --- HTML UI References ---
    const balanceValueSpan = document.getElementById('balance-value') as HTMLSpanElement | null;
    const betValueSpan = document.getElementById('bet-value') as HTMLSpanElement | null;
    const winValueSpan = document.getElementById('win-value') as HTMLSpanElement | null;
    const betTextContainer = document.getElementById('bet-container'); // Assuming parent div has this ID

    // --- Game State ---
    let isMachineSpinning = false; let currentWin = 0; let activeWinSprites: (PIXI.Sprite | PIXI.Graphics)[] = [];
    // Initial balance
    let currentBalance = 1000;
    const currentBet: BetConfig = {
        coinSize: 0.50,       // Set coin size to 0.50
        coinsPerLine: 10,      // Set coins per line to 10
        lines: MAX_LINES,       // Use max lines (20)
    };
    // Initial Bet = 0.50 * 10 * 20 = 100
    let spinCount = 0; // Counter for predetermined wins

    // --- Win Message Elements & State ---
    // Remove old text styles and text objects
    /*
    const winMessageStyle = new PIXI.TextStyle({ ... });
    const winAmountStyle = winMessageStyle.clone();
    winAmountStyle.fontSize = 70;
    winAmountStyle.stroke = { color: '#4a148c', width: 6 };

    const winMessageText = new PIXI.Text({ text: "YOU WON!", style: winMessageStyle });
    winMessageText.anchor.set(0.5);
    winMessageText.position.set(designWidth / 2, designHeight / 2 - 50);
    winMessageText.scale.set(0);
    winMessageText.visible = false;
    app.stage.addChild(winMessageText);

    const winAmountText = new PIXI.Text({ text: "", style: winAmountStyle });
    winAmountText.anchor.set(0.5);
    winAmountText.position.set(designWidth / 2, designHeight / 2 + 50);
    winAmountText.scale.set(0);
    winAmountText.visible = false;
    app.stage.addChild(winAmountText);
    */

    // Create Win Image Sprite
    const winImageSprite = new PIXI.Sprite(assets.youwon);
    winImageSprite.anchor.set(0.5);
    winImageSprite.position.set(designWidth / 2, designHeight / 2); // Center it
    winImageSprite.scale.set(0); // Start scaled down
    winImageSprite.visible = false; // Start hidden
    app.stage.addChild(winImageSprite); // Add to stage

    // Renamed animation state variables
    let isWinImageAnimating = false;
    let winImageAnimElapsed = 0;
    const winImageAnimStartScale = 0;
    const winImageAnimTargetScale = 0.8; // Adjusted target scale for the image

    // --- Helper Functions ---
    function calculateTotalBet(): number { return currentBet.lines * currentBet.coinsPerLine * currentBet.coinSize; }
    function updateTotalBetDisplay() {
        if (betValueSpan) betValueSpan.textContent = calculateTotalBet().toFixed(2);
        if (winValueSpan) winValueSpan.textContent = currentWin.toFixed(2);
        if (balanceValueSpan) balanceValueSpan.textContent = currentBalance.toFixed(2); // Update balance display
    }
    function playSound(soundKey: AudioKey) { const sound = sounds[soundKey]; if (sound) sound.play(); else console.warn(`Sound not found: ${soundKey}`); }

    // --- Win Animation ---
    function clearWinAnimation() { activeWinSprites.forEach(sprite => { sprite.tint = 0xFFFFFF; }); activeWinSprites = []; }
    function playWinAnimation(winningLines: WinningLine[]) {
        console.log("Playing win animation for wins:", winningLines);
        playSound('winSfx'); clearWinAnimation(); const highlightTint = 0xFFFF00;
        winningLines.forEach(winInfo => {
            winInfo.symbolPositions.forEach(pos => {
                const reel = reels[pos.reel];
                if (reel && reel.symbols[pos.symbolIndex]) {
                    const winningSprite = reel.symbols[pos.symbolIndex].sprite;
                    if (winningSprite instanceof PIXI.Sprite) { winningSprite.tint = highlightTint; activeWinSprites.push(winningSprite); }
                } else { console.warn(`Could not find sprite for win anim: reel ${pos.reel}, symbol ${pos.symbolIndex}`); }
            });
        }); setTimeout(clearWinAnimation, 2000);
    }

    // --- Big Win Message Tween ---
    // Removed old showWinMessage function
    /*
    function showWinMessage(amount: number) { ... }
    */
    // Removed old hideWinMessage function
    /*
    function hideWinMessage() { ... }
    */

    // New functions for the image animation
    function showWinImage() {
        if (!winImageSprite) return;
        console.log("Showing win image.");
        winImageSprite.visible = true;
        winImageSprite.scale.set(winImageAnimStartScale); // Reset scale
        isWinImageAnimating = true;
        winImageAnimElapsed = 0; // Reset animation time
    }

    function hideWinImage() {
        if (!winImageSprite) return;
        isWinImageAnimating = false; // Stop animation if running
        winImageSprite.visible = false;
        winImageSprite.scale.set(winImageAnimStartScale); // Reset scale for next time
        console.log("Hiding win image.");
    }

    // --- Win Detection Logic (Using final target indices) ---
    function checkWins(): WinningLine[] {
        console.log("--- checkWins function ---");
        const winners: WinningLine[] = []; let totalWin = 0;
        const finalGrid: (SymbolId | null)[][] = Array(NUM_REELS).fill(0).map(() => Array(NUM_ROWS).fill(null));
        const finalSymbolIndices: number[][] = Array(NUM_REELS).fill(0).map(() => Array(NUM_ROWS).fill(-1)); // Index within reel.symbols

        // Determine the grid based on the targetSymbolArrayIndex which landed at Y=0
        reels.forEach((reel, reelIndex) => {
            if (reel.targetSymbolArrayIndex === -1) {
                console.error(`Reel ${reelIndex} stopped without a valid target index.`);
                return; // Skip this reel if target is invalid
            }
            for (let rowIndex = 0; rowIndex < NUM_ROWS; rowIndex++) {
                // Calculate the index in the reel.symbols array for the current row
                const symbolIndexInReel = (reel.targetSymbolArrayIndex + rowIndex + SYMBOLS_PER_REEL) % SYMBOLS_PER_REEL; // Wrap around
                if (reel.symbols[symbolIndexInReel]) {
                    finalGrid[reelIndex][rowIndex] = reel.symbols[symbolIndexInReel].id;
                    finalSymbolIndices[reelIndex][rowIndex] = symbolIndexInReel;
                } else {
                    console.warn(`Symbol not found at calculated index ${symbolIndexInReel} for reel ${reelIndex}, row ${rowIndex}`);
                    finalGrid[reelIndex][rowIndex] = null;
                    finalSymbolIndices[reelIndex][rowIndex] = -1;
                }
            }
        });

        console.log("Final Grid for Win Check:", finalGrid);
        const linesToCheck = PAYLINES.slice(0, currentBet.lines);

        linesToCheck.forEach((line, lineIndex) => { // Check wins on lines...
            let lineMatchCount = 0; let firstSymbolId: SymbolId | null = null;
            let effectiveFirstSymbolId: SymbolId | null = null; const winningPositionsOnLine: { reel: number; symbolIndex: number }[] = [];
            for (let step = 0; step < line.length; step++) {
                 if (!line[step]) { console.warn(`Payline ${lineIndex} short at step ${step}.`); break; }
                 const [col, row] = line[step];
                 if (col < 0 || col >= NUM_REELS || row < 0 || row >= NUM_ROWS) { console.error(`Invalid coord [${col}, ${row}] in Payline ${lineIndex}.`); winningPositionsOnLine.length = 0; break; }
                 const currentSymbolId = finalGrid[col][row];
                 const currentSymbolIndex = finalSymbolIndices[col][row];
                 if (currentSymbolId === null || currentSymbolIndex === -1) { break; } // Missing symbol
                 if (step === 0) { /* Handle first symbol */ firstSymbolId = currentSymbolId; effectiveFirstSymbolId = currentSymbolId; lineMatchCount = 1; winningPositionsOnLine.push({ reel: col, symbolIndex: currentSymbolIndex }); }
                 else { /* Handle subsequent symbols + Wild logic */
                    if (currentSymbolId === firstSymbolId || currentSymbolId === WILD_SYMBOL) { lineMatchCount++; winningPositionsOnLine.push({ reel: col, symbolIndex: currentSymbolIndex }); }
                    else if (firstSymbolId === WILD_SYMBOL) { firstSymbolId = currentSymbolId; effectiveFirstSymbolId = currentSymbolId; lineMatchCount++; winningPositionsOnLine.push({ reel: col, symbolIndex: currentSymbolIndex }); }
                    else { break; } // Sequence broken
                 }
            }
            if (lineMatchCount >= 3 && effectiveFirstSymbolId) { /* Calculate Payout */
                 const payoutSymbol = effectiveFirstSymbolId; const payoutInfo = PAYOUTS[payoutSymbol];
                 if (payoutInfo && payoutInfo[lineMatchCount]) {
                    const linePayout = payoutInfo[lineMatchCount] * currentBet.coinSize * currentBet.coinsPerLine;
                    winners.push({ lineIndex, symbolId: payoutSymbol, count: lineMatchCount, payout: linePayout, symbolPositions: winningPositionsOnLine.slice(0, lineMatchCount) });
                    totalWin += linePayout; console.log(`WIN! Line ${lineIndex + 1}, Symbol: ${payoutSymbol}, Count: ${lineMatchCount}, Payout: ${linePayout.toFixed(2)}`);
                 } else { console.warn(`No payout defined for ${payoutSymbol} x${lineMatchCount}`); }
            }
        });

        // Add the total win to the balance
        currentWin = totalWin;
        currentBalance += currentWin;
        updateTotalBetDisplay(); // Update HTML text including balance

        if (winners.length > 0) {
            console.log("Total Win:", totalWin.toFixed(2));
            playWinAnimation(winners); // Show symbol highlights
            // showWinMessage(totalWin);  // Remove call to old text function
            showWinImage(); // Show the win image instead
        }
        else { console.log("No wins detected."); }

        // Re-enable PixiJS spin button AFTER checks and potential animation start
        if (!isMachineSpinning) { spinButton.eventMode = 'static'; spinButton.alpha = 1.0; console.log("Spin button re-enabled."); }
        return winners;
    }

    // --- Reel Spinning Logic ---

    // Determines the final stopping position (strip index for top row) for each reel
    function determineFinalSymbols(): number[] {
        spinCount++;
        console.log(`--- Spin #${spinCount} ---`);

        // Check for predetermined wins
        let forcedIndices: number[] | null = null;
        if (spinCount === 3) { // 3 CIND on Top: Indices [4, 14, 4, random, random]
            console.log("Forcing win: Spin 3 (3x CIND)");
            forcedIndices = [CINDERELLA_INDEX, REEL_STRIP.lastIndexOf(SymbolId.CINDERELLA), CINDERELLA_INDEX, -1, -1]; // -1 for random
        } else if (spinCount === 5) { // 4 CASTLE on Top: Indices [3, 13, 3, 13, random]
            console.log("Forcing win: Spin 5 (4x CASTLE)");
            forcedIndices = [CASTLE_INDEX, REEL_STRIP.lastIndexOf(SymbolId.CASTLE), CASTLE_INDEX, REEL_STRIP.lastIndexOf(SymbolId.CASTLE), -1];
        } else if (spinCount === 8) { // 5 BELLE on Top: Indices [2, 8, 19, 2, 8]
            console.log("Forcing win: Spin 8 (5x BELLE)");
            const belleIndices = REEL_STRIP.map((id, idx) => id === SymbolId.BELLE ? idx : -1).filter(idx => idx !== -1);
            if (belleIndices.length >= 5) {
                 forcedIndices = [belleIndices[0], belleIndices[1], belleIndices[2], belleIndices[0], belleIndices[1]]; // Example assignment
            } else { console.warn("Not enough BELLE symbols on strip for forced win 8"); }
        } else if (spinCount === 10) { // 5 ARIEL on Top: Indices [6, 12, 17, 6, 12]
            console.log("Forcing win: Spin 10 (5x ARIEL)");
             const arielIndices = REEL_STRIP.map((id, idx) => id === SymbolId.ARIEL ? idx : -1).filter(idx => idx !== -1);
             if (arielIndices.length >= 5) {
                 forcedIndices = [arielIndices[0], arielIndices[1], arielIndices[2], arielIndices[0], arielIndices[1]]; // Example assignment
             } else { console.warn("Not enough ARIEL symbols on strip for forced win 10"); }
        }

        // Generate final indices: use forced if available, otherwise random
        const finalIndices: number[] = [];
        for (let i = 0; i < NUM_REELS; i++) {
            let indexToUse: number;
            if (forcedIndices && forcedIndices[i] !== -1) {
                indexToUse = forcedIndices[i];
            } else {
                // Randomly pick an index from the REEL_STRIP
                indexToUse = Math.floor(Math.random() * REEL_STRIP.length);
            }
            finalIndices.push(indexToUse);
        }

        console.log("Final target symbol indices (top row strip index):", finalIndices);
        return finalIndices;
    }

    async function startSpin() {
        if (isMachineSpinning) { console.log("Machine already spinning."); return; }

        // --- Balance Check & Bet Subtraction ---
        const totalBet = calculateTotalBet();
        if (currentBalance < totalBet) {
            console.warn("Insufficient balance to spin.");
            // TODO: Optionally display a message to the user here (e.g., using a simple text overlay)
            return; // Stop the spin if not enough balance
        }
        currentBalance -= totalBet; // Subtract the bet FIRST
        currentWin = 0;           // Reset win amount for the new spin
        updateTotalBetDisplay(); // Update UI immediately to show new balance and reset win
        // -------------------------------------

        isMachineSpinning = true; console.log("Starting machine spin...");
        spinButton.eventMode = 'none'; spinButton.alpha = 0.6; // Disable PixiJS spin button
        clearWinAnimation(); // Clear previous symbol highlights
        // hideWinMessage();    // Remove call to old text function
        hideWinImage(); // Hide the win image instead

        // Determine results *before* visual spin
        const finalTargetStripIndices = determineFinalSymbols();

        // Staggered reel start animation
        for (let i = 0; i < NUM_REELS; i++) {
            const reel = reels[i];
            reel.targetSymbolArrayIndex = -1; // Reset target index
            reel.isSpinning = true; reel.isStopping = false;
            reel.spinSpeed = SPIN_SPEED_BASE + Math.random() * 10;
            reel.blurFilter.blurY = 15; // Apply blur
            playSound('spinSfx');
            if (i < NUM_REELS - 1) await new Promise(resolve => setTimeout(resolve, SPIN_START_DELAY));
        }

        // Schedule the stopping sequence
        console.log(`Setting timeout to start stopping sequence in ${SPIN_DURATION}ms`);
        setTimeout(() => stopSpinSequence(finalTargetStripIndices), SPIN_DURATION);
    }

    async function stopSpinSequence(finalTargetStripIndices: number[]) {
        console.log("--- stopSpinSequence called with targets:", finalTargetStripIndices);
        for (let i = 0; i < NUM_REELS; i++) {
            const reel = reels[i];
            console.log(`Stopping Reel ${i}. Current state: isSpinning=${reel.isSpinning}, isStopping=${reel.isStopping}`);
            if (!reel.isSpinning) { console.log(`Reel ${i} not spinning, skipping stop.`); continue; }

            const targetStripIndex = finalTargetStripIndices[i];
            reel.isSpinning = false; // Mark as no longer free-spinning *immediately*

            // Find the corresponding symbol index within this specific reel's 'symbols' array
            // This maps the desired strip symbol to the symbol object within the reel instance
            let targetSymbolArrayIndex = -1;
            for (let j = 0; j < reel.symbols.length; j++) {
                // We stored the original strip index when creating the symbol
                if (reel.symbols[j].originalIndex === targetStripIndex) {
                    targetSymbolArrayIndex = j;
                    break;
                }
            }
            console.log(`Reel ${i}: Target strip index ${targetStripIndex} mapped to local array index ${targetSymbolArrayIndex}`);
            reel.targetSymbolArrayIndex = targetSymbolArrayIndex; // Store the determined index for win checking

             if (targetSymbolArrayIndex === -1) {
                  console.error(`Could not map strip index ${targetStripIndex} to local symbol in reel ${i}. Stopping abruptly.`);
                  reel.isStopping = false; // Ensure it doesn't try to tween
                  reel.blurFilter.blurY = 0;
             } else {
                 console.log(`Reel ${i} initiating stop tween for target array index ${targetSymbolArrayIndex}.`);
                 initiateReelStopTween(reel); // Start the smooth stop using the stored target index
             }

            playSound('stopSfx');
            if (i < NUM_REELS - 1) await new Promise(resolve => setTimeout(resolve, SPIN_STOP_DELAY));
        }
    }

    // Initiates the smooth stop tween for a single reel
    // Uses the reel.targetSymbolArrayIndex which was set in stopSpinSequence
    function initiateReelStopTween(reel: IReel) {
        if (reel.targetSymbolArrayIndex === -1) {
             console.error(`Cannot initiate tween for Reel ${reel.index}: Invalid targetSymbolArrayIndex.`);
             reel.isSpinning = false; reel.isStopping = false; reel.blurFilter.blurY = 0;
             return;
        }
        console.log(`Initiating tween for Reel ${reel.index}, targetSymbolArrayIndex: ${reel.targetSymbolArrayIndex}`);

        reel.isStopping = true; // Start stopping tween phase
        reel.stopTweenElapsed = 0;
        reel.stopTweenDuration = REEL_STOP_DURATION;
        reel.symbolStopData = []; // Clear previous stop data

        // Calculate definitive target Y positions for ALL symbols based on the target index landing at Y=0
        reel.symbols.forEach((symbol, j) => {
            const currentY = symbol.sprite.y; // Capture current position as startY

            // Calculate the final resting position relative to the target symbol at Y=0
            // stepsAway is how many positions 'j' is after 'targetSymbolArrayIndex' (circularly)
            const stepsAway = (j - reel.targetSymbolArrayIndex + SYMBOLS_PER_REEL) % SYMBOLS_PER_REEL;
            const targetY = stepsAway * SYMBOL_SIZE; // This is the absolute final position

            // Store start and target positions for the tween
            reel.symbolStopData.push({ sprite: symbol.sprite, startY: currentY, targetY: targetY });

             // Debug log for first few symbols
            // if (j < 3) console.log(` Reel ${reel.index}, Symbol ${j}: startY=${currentY.toFixed(1)}, targetY=${targetY}`);
        });

        reel.blurFilter.blurY = 0; // Remove blur instantly
        // State flags (isSpinning=false, isStopping=true) were set before calling this
    }

    // --- Game Loop (Ticker) ---
    app.ticker.add((ticker: PIXI.Ticker) => {
        const deltaMs = ticker.deltaMS;
        let allReelsIdle = true; // Assume all stopped/idle

        // --- Win Message Animation (Updated for Image) ---
        if (isWinImageAnimating) {
            winImageAnimElapsed += deltaMs;
            let progress = Math.min(1, winImageAnimElapsed / WIN_MESSAGE_DURATION); // Uses updated duration
            // Use easeOutBack for scaling again
            let scale = winImageAnimStartScale + (winImageAnimTargetScale - winImageAnimStartScale) * easeOutBack(progress);

            // Apply scale to the image sprite
            winImageSprite.scale.set(scale);

            if (progress >= 1) {
                isWinImageAnimating = false; // Animation finished
                console.log("Win image animation complete.");
                // Image stays visible until next spin.
            }
        }

        reels.forEach(reel => {
            // --- Free Spinning ---
            if (reel.isSpinning) {
                allReelsIdle = false;
                const deltaY = reel.spinSpeed * ticker.deltaTime;
                reel.container.children.forEach(child => { child.y += deltaY; }); // Move symbols
                // Wrap symbols
                reel.container.children.forEach(child => {
                     const sprite = child; // child is already a DisplayObject
                     if (sprite.y >= totalReelHeight) sprite.y -= totalReelHeight;
                     else if (sprite.y <= -SYMBOL_SIZE) sprite.y += totalReelHeight;
                 });
            }
            // --- Stopping Tween ---
            else if (reel.isStopping) {
                allReelsIdle = false;
                reel.stopTweenElapsed += deltaMs;
                const progress = Math.min(1, reel.stopTweenElapsed / reel.stopTweenDuration);
                const easedProgress = 1 - Math.pow(1 - progress, 3); // EaseOutCubic (adjust easing as desired)

                reel.symbolStopData.forEach(data => {
                    data.sprite.y = data.startY + (data.targetY - data.startY) * easedProgress; // Interpolate
                });

                if (progress >= 1) { // Tween finished
                    reel.isStopping = false; // Mark as fully stopped
                    reel.symbolStopData.forEach(data => { data.sprite.y = data.targetY; }); // Snap to final position
                    console.log(`Reel ${reel.index} finished stopping tween.`);
                }
            }
            // Else: Reel is idle
        }); // End reels.forEach

        // --- Check if Machine Should Finalize Spin ---
        if (isMachineSpinning && allReelsIdle) {
            console.log("All reels idle. Finalizing spin cycle.");
            isMachineSpinning = false; // Mark machine as idle *before* checking wins
            setTimeout(checkWins, 50); // Check wins after short delay
        }
    });

    // --- Settings Overlay Logic ---
    const settingsOverlay = document.getElementById('settings-overlay');
    const closeOverlayButton = document.getElementById('close-overlay-button');
    const coinSizeValueSpan = document.getElementById('coin-size-value');
    const coinsLineValueSpan = document.getElementById('coins-line-value');
    const linesValueSpan = document.getElementById('lines-value');
    function updateOverlayDisplay() { /* ... */ }
    if (settingsOverlay && closeOverlayButton && coinSizeValueSpan && coinsLineValueSpan && linesValueSpan && betTextContainer) { /* ... Event listeners ... */ }
    else { console.error("One or more UI or settings overlay elements not found!"); }

    // --- Spin Button Listener (PixiJS) ---
    spinButton.on('pointertap', () => { if (!isMachineSpinning) startSpin(); else console.log("Ignoring spin click."); });

    // --- Start BGM on Interaction ---
    const startBgm = () => { if (sounds.bgm && !sounds.bgm.isPlaying) { sounds.bgm.play({ loop: true, volume: 0.3 }); app.stage.off('pointertap', startBgm); } else if (!sounds.bgm) { app.stage.off('pointertap', startBgm); } };
    app.stage.eventMode = 'static'; app.stage.on('pointertap', startBgm);

    updateTotalBetDisplay(); // Final initial UI updates
} // End main()

// --- Start the Application ---
main().catch(err => { console.error("Error during game initialization:", err); });