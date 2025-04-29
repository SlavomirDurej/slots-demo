# TODO List: Disney Princess Slot Machine Demo

## Phase 1: Project Setup & Foundation (Est: 1-2 hours)

*   [ ] Initialize project directory.
*   [ ] Initialize Git repository (`git init`).
*   [ ] Set up Node.js project (`npm init -y`).
*   [ ] Install dependencies: `typescript`, `pixi.js`, `tailwindcss`.
*   [ ] Install dev dependencies: `@types/node`, `vite` (recommended), `autoprefixer`, `postcss`.
*   [ ] Configure TypeScript (`tsconfig.json`).
*   [ ] Configure Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, input CSS file).
*   [ ] Create basic HTML file (`index.html`) with a canvas element for PixiJS and potentially a container for the HTML overlay.
*   [ ] Create main TypeScript entry point (`src/main.ts` or similar).
*   [ ] Initialize basic PixiJS Application (Renderer, Stage, Ticker).
*   [ ] Add PixiJS canvas to the HTML.
*   [ ] Set up basic Vite config (`vite.config.js`) if using Vite.
*   [ ] Make initial Git commit: "Project setup and initialization".

## Phase 2: Asset Generation & Loading (Est: 2-4 hours - depends on generation time)

*   [ ] Refine and use AI prompts to generate all required visual assets (background, frame, symbols, buttons, UI elements). Ensure correct format (PNG, transparent backgrounds).
*   [ ] Refine and use AI prompts to generate all required audio assets (BGM, SFX). Ensure correct format (MP3, OGG, or WAV).
*   [ ] Organize assets into an `assets` folder (e.g., `assets/images`, `assets/audio`).
*   [ ] Implement asset loading logic using `PIXI.Assets`. Load all necessary textures and sounds.
*   [ ] Display the background image on the PixiJS stage.
*   [ ] Display the slot frame image over the background.
*   [ ] Git commit: "Generated and loaded initial assets".

## Phase 3: Static Scene & UI Layout (Est: 2-3 hours)

*   [ ] Create TypeScript classes/interfaces for `Symbol`, `Reel`, `SlotMachineGrid`.
*   [ ] Define symbol types and their corresponding texture names.
*   [ ] Create containers in PixiJS for the reels/grid area.
*   [ ] Statically position placeholder symbols (e.g., 5x3 grid of one symbol type) within the frame.
*   [ ] Create and position PixiJS `Text` objects for `BALANCE`, `BET`, and `WIN` displays. Use placeholder values.
*   [ ] Create and position the 'Spin' button (as a PixiJS `Sprite` or `Graphics` object, make it interactive).
*   [ ] Create and position the clickable text/area for opening the Bet settings. Make it interactive.
*   [ ] Git commit: "Static scene layout with grid and basic UI elements".

## Phase 4: Reel Spinning Mechanics (Est: 4-6 hours)

*   [ ] Implement logic to populate reels with random symbols (initially and after spin). Need more symbols than visible rows to simulate rolling.
*   [ ] Add click handler to the 'Spin' button.
*   [ ] Implement reel spinning animation:
    *   Use PixiJS ticker or a tweening library (like GSAP) for smooth vertical movement.
    *   Symbols should loop vertically.
    *   Apply vertical `BlurFilter` to each reel container when it starts spinning.
    *   Remove `BlurFilter` when the reel stops.
*   [ ] Implement staggered start: Start reel 1, wait a short delay, start reel 2, etc.
*   [ ] Implement staggered stop: Define spin duration, then stop reel 1, wait a short delay, stop reel 2, etc. Ensure reels stop showing valid symbol positions.
*   [ ] Add Spin Start/Stop SFX triggers.
*   [ ] Git commit: "Implemented reel spinning mechanism with blur and staggered start/stop".

## Phase 5: Win Detection Logic (Est: 3-4 hours)

*   [ ] Define the paylines required for the demo (arrays of grid indices, e.g., `[[5,6,7,8,9], [0,1,2,3,4], ...]`).
*   [ ] Create a function `checkWins()` that runs after all reels have stopped.
*   [ ] This function should iterate through the defined paylines.
*   [ ] For each line, check for 3, 4, or 5 matching symbols starting from reel 1.
*   [ ] Implement basic Wild symbol substitution logic.
*   [ ] Store winning lines and winning symbols.
*   [ ] Calculate a dummy win amount based on the win (e.g., fixed amount per win for demo).
*   [ ] Update the `WIN` display text object.
*   [ ] Git commit: "Implemented win detection logic for predefined lines".

## Phase 6: Win Animation (Est: 2-3 hours)

*   [ ] Create a function `playWinAnimation(winningLines)` triggered after `checkWins()`.
*   [ ] Animate the symbols involved in the win (e.g., scale pulse, add temporary glow filter or overlay sprite).
*   [ ] Optionally, draw the payline(s) over the grid using `PIXI.Graphics`.
*   [ ] Trigger the Win SFX.
*   [ ] Show the win amount animation (e.g., the count-up effect from the example).
*   [ ] Ensure animation plays for a short duration before enabling the Spin button again.
*   [ ] Git commit: "Implemented win announcement animation and SFX".

## Phase 7: Bet Settings Overlay (Est: 3-4 hours)

*   [ ] Create the HTML structure for the overlay (`div` with content, initially hidden).
*   [ ] Style the overlay and its contents (buttons, text displays) using Tailwind CSS.
*   [ ] Add +/- buttons and displays for Coin Size, Coins Per Line, Lines.
*   [ ] Add a Close (X) button.
*   [ ] Implement JavaScript/TypeScript logic:
    *   PixiJS click handler on the bet text triggers the display of the HTML overlay (e.g., add/remove a CSS class).
    *   Click handlers for +/- buttons update the values *displayed* in the overlay.
    *   Update the main `BET` display on the PixiJS canvas based on the formula: `Lines * Coins Per Line * Coin Size`.
    *   Close button hides the overlay.
    *   Add Button Click SFX to overlay buttons.
*   [ ] Git commit: "Implemented bet settings overlay UI and basic interactivity".

## Phase 8: Audio Integration (Est: 1-2 hours)

*   [ ] Ensure all audio assets are loaded correctly.
*   [ ] Implement background music (BGM) playback on game load (consider user interaction requirement for audio start in browsers). Add play/mute toggle if desired.
*   [ ] Ensure all SFX (Button Clicks, Spin Start/Stop, Win) are triggered at the correct moments.
*   [ ] Adjust audio volume levels for balance.
*   [ ] Git commit: "Integrated background music and sound effects".

## Phase 9: Polish & Refinement (Est: 2-4 hours)

*   [ ] Review all animations and transitions for smoothness.
*   [ ] Check visual consistency and styling.
*   [ ] Refactor code for clarity, organization, and maintainability. Add comments.
*   [ ] Test basic responsiveness (if the layout allows).
*   [ ] Perform basic cross-browser checks (Chrome, Firefox).
*   [ ] Update `README.md` with build/run instructions if necessary.
*   [ ] Git commit: "Code cleanup, polishing, and final adjustments".

## Phase 10: Final Steps

*   [ ] Create a final build (if using a bundler like Vite: `npm run build`).
*   [ ] Final test of the built version.
*   [ ] Final Git commit and push to remote repository (e.g., GitHub).