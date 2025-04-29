Okay, let's set up the instructions and task list for building this Disney Princess themed slot machine demo.

---

**File 1: `README.md` (Instructions for Cursor AI / System Prompt)**

# System Prompt: Disney Princess Slot Machine Demo Development

## Project Goal
Develop a front-end demo of a 5-reel, 3-row slot machine game with a "Disney Princess" theme. The application should be built using HTML5, TypeScript, and PixiJS for rendering and animation. Tailwind CSS will be used for styling UI elements where appropriate (especially overlays and potentially buttons). The final product should be a self-contained demo running locally in a web browser, with no backend requirements.

## Core Technologies
*   **HTML5:** Base structure.
*   **TypeScript:** Programming language for logic and structure.
*   **PixiJS (v7 or latest stable):** 2D WebGL renderer for graphics, animations, and effects (sprites, filters, stage management).
*   **Tailwind CSS:** Utility-first CSS framework for styling HTML-based UI elements (like the settings overlay).
*   **(Optional but recommended) GSAP:** For potentially smoother and more complex animations/tweens, especially for reels and win effects. PixiJS has basic animation capabilities, but GSAP offers more control.
*   **Vite (or similar bundler):** Recommended for efficient development workflow (TS compilation, asset handling, dev server, HMR).

## Key Features & Requirements

1.  **Theme:** Disney Princesses. All visual assets (symbols, background, UI elements) should reflect this theme.
2.  **Layout:**
    *   Standard 5x3 slot grid.
    *   Background image depicting an enchanted, fairytale setting.
    *   UI elements: Spin Button, Balance display, Bet display, clickable Bet configuration text/button.
3.  **Symbols:**
    *   Use various Disney Princesses as high-value symbols (e.g., Cinderella, Belle, Ariel, Jasmine, Rapunzel).
    *   Use thematic items as lower-value symbols (e.g., Glass Slipper, Enchanted Rose, Magic Lamp, Tiara).
    *   Consider a 'Wild' symbol (e.g., a sparkling castle or magic wand).
    *   Consider a 'Feature/Scatter' symbol (though triggering a feature isn't required for the *demo*, having the symbol is good).
    *   Symbols should be distinct and easily recognizable. Use PNGs with transparency. Consider spritesheets if simple symbol animations are desired on win.
4.  **Spinning Mechanics:**
    *   Clicking the 'Spin' button initiates the spin.
    *   Reels (columns) 1 through 5 should start spinning sequentially with a slight delay (staggered start).
    *   Reels should stop spinning sequentially with a slight delay (staggered stop).
    *   While spinning, apply a vertical motion blur effect to the symbols/reels using PixiJS filters (`BlurFilter` configured for vertical blur).
    *   Spinning should simulate symbols moving downwards rapidly.
5.  **Win Detection:**
    *   Implement basic win detection for specific, predefined paylines after the reels stop.
    *   Required lines for demo:
        *   Middle horizontal row (Row 2).
        *   Top horizontal row (Row 1).
        *   Bottom horizontal row (Row 3).
        *   Simple Diagonal (Top-Left to Bottom-Right).
        *   Simple V-Shape (Top-Left, Middle-Center, Top-Right).
    *   Detection should identify 3, 4, or 5 matching symbols on an active payline, starting from the leftmost reel (Reel 1). Wild symbols can substitute for others.
6.  **Win Animation:**
    *   Upon detecting a win:
        *   Highlight the winning symbols (e.g., slight scale-up/down pulse, add a glow effect, draw the payline).
        *   Display the total win amount (can be a simple text update or animation like the example image).
        *   Play a celebratory sound effect.
        *   Animation should be clear and visually appealing.
7.  **Bet Configuration:**
    *   Display current `BALANCE`, `BET`, and `WIN` amounts.
    *   Display text indicating current bet settings (e.g., "Playing 25 lines at 4 coins/line with 0.05 coins"). This text should be clickable.
    *   Clicking the bet text triggers a modal overlay (can be HTML styled with Tailwind).
    *   The overlay shows controls for:
        *   `COIN SIZE` (+/- buttons)
        *   `COINS PER LINE` (+/- buttons)
        *   `LINES` (+/- buttons - visually updates the number, though win logic can stick to the demo lines).
    *   Buttons should update the displayed values within the overlay.
    *   The main `BET` display on the game screen should update based on overlay settings (BET = Lines * Coins Per Line * Coin Size). *Full implementation of variable lines/coins affecting win calculations is not strictly required for the demo, but the UI should function.*
    *   Include a 'Close' (X) button on the overlay.
8.  **Audio:**
    *   Background Music (BGM): Looping, magical, fairytale-themed music.
    *   Sound Effects (SFX):
        *   Button clicks (Spin, overlay buttons).
        *   Reel Spin Start (one sound or per reel).
        *   Reel Stop Click (per reel).
        *   Win notification/celebration sound.
9.  **Technical Considerations:**
    *   Use PixiJS Stage and Containers for scene management.
    *   Use PixiJS Sprites for symbols and potentially UI elements.
    *   Use PixiJS Text for displaying dynamic values (Balance, Bet, Win).
    *   Leverage the PixiJS Ticker for game loop updates and animations.
    *   Load all assets using `PIXI.Assets` for efficient loading.
    *   Implement motion blur using `PIXI.filters.BlurFilter`.
    *   Ensure code is well-structured, commented, and uses TypeScript features appropriately (interfaces, classes, types).
    *   The overlay can be a standard HTML `div` positioned over the PixiJS canvas, styled with Tailwind CSS. Communication between PixiJS clicks and HTML overlay visibility will be needed.

## Asset Generation Prompts (Placeholders - Refine as needed)

*   **Background:** "Enchanted forest scene at dawn/dusk, fairytale style, magical lighting, with depth and space for a central game interface. Aspect ratio ~16:9."
*   **Slot Frame:** "Stylized wooden or stone frame for a 5x3 slot game grid, fairytale aesthetic, perhaps with subtle vine or scrollwork details. Provide as a transparent PNG, ensuring the central 5x3 area is clear."
*   **Symbols (Examples):**
    *   "Icon of Cinderella, Disney-like style, clear silhouette, facing forward, on a transparent background, suitable for a slot machine symbol." (Repeat for Belle, Ariel, Jasmine, Rapunzel)
    *   "Icon of a sparkling glass slipper, fairytale style, clear, transparent background, slot symbol." (Repeat for Enchanted Rose, Magic Lamp, Golden Tiara)
    *   "Icon of a glittering magic wand or sparkling fairytale castle, designated as WILD symbol, transparent background, slot symbol."
    *   "Icon representing a FEATURE or BONUS, perhaps a magical storybook or a fairy godmother silhouette, transparent background, slot symbol."
*   **Buttons:**
    *   "Spin button, circular, green with a white rotating arrow icon, glossy/stylized look, transparent background."
    *   "Small plus (+) button, stylized wood or stone texture, clear shape, transparent background."
    *   "Small minus (-) button, stylized wood or stone texture, clear shape, transparent background."
*   **UI Elements:**
    *   "Simple, clean display panels/areas with a subtle wood or parchment texture for showing Balance, Bet, Win text. Transparent PNG."
    *   "Settings overlay background, semi-transparent dark color, clean borders, space for buttons and text. Fits over the game area."
*   **Audio (Prompts for AI Audio Generator):**
    *   **BGM:** "Gentle, looping orchestral background music, magical fairytale theme, evokes wonder and enchantment, suitable for a game lobby/idle state. ~2 minutes loop."
    *   **Spin SFX:** "Sound effect of slot reels starting to spin, perhaps a magical 'whoosh' or a light mechanical whir with sparkles."
    *   **Reel Stop SFX:** "Short, distinct 'click' or 'thud' sound effect, one for each reel stopping. Clean and satisfying."
    *   **Button Click SFX:** "Pleasant, short 'click' sound effect for UI button presses, possibly with a slight magical sparkle."
    *   **Win SFX:** "Short, celebratory fanfare sound effect, magical and rewarding, perhaps with twinkling sounds or a harp flourish. Different variations for small vs. big wins could be considered later."
