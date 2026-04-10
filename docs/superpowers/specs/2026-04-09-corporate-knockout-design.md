# Corporate Knockout — Design Spec

A Punch-Out!! style boxing game where you fight your way up the corporate ladder. Browser-based, vanilla JS + HTML Canvas, no dependencies.

## Game Concept

Three opponents with distinct personalities and telegraphed attack patterns. First-person perspective (player gloves visible at bottom). Hybrid art style: AI-generated anime portraits for splash/intro screens, canvas-drawn characters for gameplay.

## Characters

### The Intern (Easy — Tutorial)
- **Tells:** Winds up obviously, whole body leans back for 1 second
- **Attacks:** Slow right hook (dodge left), slow left hook (dodge right)
- **Openings:** After every missed attack, stands dazed for 2 seconds
- **Special:** "First Day Flail" — wild 3-punch combo, dodge any direction
- **Personality:** Nervous, apologizes when hitting you

### Middle Manager (Medium)
- **Tells:** Adjusts tie before jab, sips coffee before power hit
- **Attacks:** Quick jab (block or dodge), coffee mug uppercut (must dodge), "meeting invite" 3-hit combo (left-right-left)
- **Openings:** After missed coffee uppercut (1.5s), after combo finishes (1s "checking email")
- **Special:** "Performance Review" — unblockable overhead slam, must dodge
- **Personality:** Condescending, passive-aggressive remarks

### The CEO (Hard)
- **Tells:** Subtle — slight smirk before jab, adjusts cufflinks before power move
- **Attacks:** Fast jab (tiny window), power cross (dodge only), "hostile takeover" feint (fakes one direction, hits the other)
- **Openings:** Only after power cross or successful feint dodge. 0.75s windows.
- **Special:** "Golden Parachute" — recovers from first knockdown at 50% health. "Board Meeting" — rapid 5-hit combo, alternating dodge directions.
- **Personality:** Cool, barely acknowledges you until you land hits

## Controls

| Key | Action |
|-----|--------|
| Arrow Left/Right | Dodge left/right |
| Arrow Down | Block |
| Z | Left punch |
| X | Right punch |
| Space | Special punch (when star meter full) |

## Gameplay Mechanics

### Core Loop
1. Opponent telegraphs an attack (visual tell + brief pause)
2. Player dodges or blocks
3. Counter-punch window opens
4. Land enough hits → opponent goes down
5. Three knockdowns = KO, advance to next opponent

### Systems
- **Health bar** — both player and opponent, visible at top of screen
- **Stamina** — punching costs stamina, recovers over time. Spam = weak hits + exhaustion
- **Star meter** — earned by landing counter-punches during openings. Full meter = one special punch
- **Knockdown system** — health hits zero = knockdown. 10-count, button mash to get up. 3 knockdowns = TKO.

### Game States
Title Screen → Character Intro → Fight → Win/Lose → Next Fight or Game Over

### Between Fights
Anime portrait intro of next opponent with a trash-talk line, then fight starts.

## Technical Architecture

### Platform
Single-page browser app. No build tools, no dependencies. ES modules (`<script type="module">`).

### Rendering
Single HTML Canvas, 60fps via `requestAnimationFrame`. Draw order: background (ring) → opponent → player gloves → UI (health bars, stars, timer).

### File Structure
```
tenex-claude-code-demo/
├── index.html          # Entry point, canvas setup, CSS
├── js/
│   ├── game.js         # Game loop, state machine
│   ├── player.js       # Player state, input handling
│   ├── opponent.js     # Base opponent class
│   ├── opponents/
│   │   ├── intern.js   # Intern patterns
│   │   ├── manager.js  # Manager patterns
│   │   └── ceo.js      # CEO patterns
│   ├── renderer.js     # All canvas drawing
│   └── ui.js           # HUD, menus, transitions
└── assets/
    └── portraits/      # AI-generated anime PNGs (placeholder initially)
```

### Art Assets
- Gameplay characters drawn with canvas primitives (shapes, paths, gradients)
- Anime-style portraits for character intros — placeholder colored rectangles initially, swap in PNGs later
