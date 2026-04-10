# Corporate Knockout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable Punch-Out!! style boxing game with 3 corporate-themed opponents, pattern-based combat, and anime-styled character portraits.

**Architecture:** Single-page browser app using HTML Canvas for rendering, vanilla ES modules for game logic. State machine drives game flow (title → intro → fight → result → next). Each opponent is a subclass with unique attack patterns and timing windows.

**Tech Stack:** HTML5 Canvas, vanilla JavaScript (ES modules), CSS for non-canvas UI. No build tools, no dependencies.

**Spec:** `docs/superpowers/specs/2026-04-09-corporate-knockout-design.md`

---

## File Structure

```
tenex-claude-code-demo/
├── index.html              # Entry point — canvas, CSS, module loader
├── js/
│   ├── game.js             # Game loop (rAF), state machine, orchestration
│   ├── input.js            # Keyboard input polling (key state map)
│   ├── player.js           # Player state: health, stamina, stars, position, actions
│   ├── combat.js           # Damage calc, knockdown logic, hit detection
│   ├── opponent.js         # Base opponent: state machine, health, pattern runner
│   ├── opponents/
│   │   ├── intern.js       # Intern attack patterns and tells
│   │   ├── manager.js      # Manager attack patterns and tells
│   │   └── ceo.js          # CEO attack patterns and tells
│   ├── renderer.js         # All canvas drawing: ring, characters, effects
│   └── ui.js               # HUD (health/stamina/stars), title screen, intros, transitions
└── assets/
    └── portraits/          # Character portrait PNGs (placeholder initially)
```

---

### Task 1: Project Scaffolding + Game Loop

**Files:**
- Create: `index.html`
- Create: `js/game.js`
- Create: `js/input.js`

This task sets up the HTML page with a centered canvas, the core game loop running at 60fps, and keyboard input polling. After this task, you should see a black canvas that responds to key presses (log them to verify).

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Corporate Knockout</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #111;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    font-family: 'Segoe UI', Arial, sans-serif;
  }
  canvas {
    border: 2px solid #333;
    image-rendering: pixelated;
  }
</style>
</head>
<body>
<canvas id="game" width="800" height="600"></canvas>
<script type="module" src="js/game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `js/input.js`**

Keyboard input module. Tracks which keys are currently held down and provides `justPressed()` for single-fire actions (dodge, punch).

```javascript
const keys = {};
const justPressedKeys = {};

window.addEventListener('keydown', e => {
  if (!keys[e.code]) justPressedKeys[e.code] = true;
  keys[e.code] = true;
  e.preventDefault();
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
  e.preventDefault();
});

export function isDown(code) {
  return !!keys[code];
}

export function justPressed(code) {
  return !!justPressedKeys[code];
}

export function clearJustPressed() {
  for (const k in justPressedKeys) delete justPressedKeys[k];
}
```

- [ ] **Step 3: Create `js/game.js`**

Game loop and state machine skeleton. States: `title`, `intro`, `fight`, `knockdown`, `result`, `gameover`. For now just renders a black screen and logs the current state.

```javascript
import { clearJustPressed } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export const STATE = {
  TITLE: 'title',
  INTRO: 'intro',
  FIGHT: 'fight',
  KNOCKDOWN: 'knockdown',
  RESULT: 'result',
  GAMEOVER: 'gameover',
};

let currentState = STATE.TITLE;
let lastTime = 0;

export function setState(s) { currentState = s; }
export function getState() { return currentState; }
export function getCtx() { return ctx; }
export function getCanvas() { return canvas; }

function update(dt) {
  // Will dispatch to state-specific update functions
}

function render() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Will dispatch to state-specific render functions

  // Temporary: show current state
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`State: ${currentState}`, 10, 30);
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(dt);
  render();
  clearJustPressed();

  requestAnimationFrame(loop);
}

requestAnimationFrame(ts => {
  lastTime = ts;
  loop(ts);
});
```

- [ ] **Step 4: Verify in browser**

Open `index.html` in a browser (or serve with `npx http-server -p 8080 -c-1` from the project root since ES modules require HTTP). Verify:
- Black canvas with "State: title" in top-left
- No console errors
- Arrow keys / Z / X don't cause page scrolling (preventDefault working)

- [ ] **Step 5: Commit**

```bash
git add index.html js/game.js js/input.js
git commit -m "feat: project scaffolding with game loop and input system"
```

---

### Task 2: Player Module

**Files:**
- Create: `js/player.js`

Player state and action logic. Tracks health, stamina, stars, current action (idle/punching/dodging/blocking/stunned). Actions have durations — once you start a dodge, you're committed for its duration.

- [ ] **Step 1: Create `js/player.js`**

```javascript
import { justPressed, isDown } from './input.js';

const PUNCH_DURATION = 0.2;
const DODGE_DURATION = 0.3;
const BLOCK_RECOVERY = 0.15;
const STUN_DURATION = 0.5;
const STAMINA_COST = 8;
const STAMINA_REGEN = 15;
const SPECIAL_COST = 3; // stars needed

export function createPlayer() {
  return {
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    stars: 0,
    maxStars: 3,
    knockdowns: 0,

    action: 'idle',     // idle, punchLeft, punchRight, dodgeLeft, dodgeRight, block, special, stunned
    actionTimer: 0,
    mashCount: 0,       // for knockdown recovery

    // Damage output — reduced when stamina is low
    get punchPower() {
      return this.stamina > 20 ? 8 : 3;
    },
    get specialPower() {
      return 25;
    },
  };
}

export function updatePlayer(p, dt) {
  // Regenerate stamina when idle or blocking
  if (p.action === 'idle' || p.action === 'block') {
    p.stamina = Math.min(p.maxStamina, p.stamina + STAMINA_REGEN * dt);
  }

  // Count down action timer
  if (p.action !== 'idle' && p.action !== 'block') {
    p.actionTimer -= dt;
    if (p.actionTimer <= 0) {
      p.action = 'idle';
      p.actionTimer = 0;
    }
    return; // locked into action
  }

  // Process input
  if (justPressed('KeyZ') && p.stamina >= STAMINA_COST) {
    p.action = 'punchLeft';
    p.actionTimer = PUNCH_DURATION;
    p.stamina -= STAMINA_COST;
  } else if (justPressed('KeyX') && p.stamina >= STAMINA_COST) {
    p.action = 'punchRight';
    p.actionTimer = PUNCH_DURATION;
    p.stamina -= STAMINA_COST;
  } else if (justPressed('Space') && p.stars >= SPECIAL_COST) {
    p.action = 'special';
    p.actionTimer = 0.4;
    p.stars = 0;
  } else if (justPressed('ArrowLeft')) {
    p.action = 'dodgeLeft';
    p.actionTimer = DODGE_DURATION;
  } else if (justPressed('ArrowRight')) {
    p.action = 'dodgeRight';
    p.actionTimer = DODGE_DURATION;
  } else if (isDown('ArrowDown')) {
    p.action = 'block';
  } else {
    p.action = 'idle';
  }
}

export function stunPlayer(p) {
  p.action = 'stunned';
  p.actionTimer = STUN_DURATION;
}
```

- [ ] **Step 2: Integrate into game loop**

In `js/game.js`, import and wire up the player. Create the player instance, call `updatePlayer` during the fight state, and display health/stamina as temp text for verification.

Add to `game.js`:
```javascript
import { createPlayer, updatePlayer } from './player.js';

let player = createPlayer();
```

In the `update(dt)` function:
```javascript
if (currentState === STATE.FIGHT) {
  updatePlayer(player, dt);
}
```

In the `render()` function, add temp debug display:
```javascript
if (currentState === STATE.FIGHT) {
  ctx.fillStyle = '#0f0';
  ctx.font = '14px monospace';
  ctx.fillText(`HP: ${player.health} | STA: ${Math.round(player.stamina)} | Stars: ${player.stars} | Action: ${player.action}`, 10, 580);
}
```

Temporarily set `currentState = STATE.FIGHT` for testing.

- [ ] **Step 3: Verify in browser**

Reload the page. Press Z, X, arrows, space. Verify:
- Action changes briefly then returns to idle
- Stamina decreases on punch, regenerates during idle
- Holding down-arrow shows "block", releasing returns to idle

- [ ] **Step 4: Commit**

```bash
git add js/player.js js/game.js
git commit -m "feat: player module with input-driven actions and stamina"
```

---

### Task 3: Base Opponent + Combat System

**Files:**
- Create: `js/opponent.js`
- Create: `js/combat.js`

The opponent runs a pattern sequence: idle → telegraph (tell) → attack → recovery (opening). The combat module handles hit detection (is the player dodging the right way? are they punching during an opening?) and damage application.

- [ ] **Step 1: Create `js/opponent.js`**

```javascript
export const OPP_STATE = {
  IDLE: 'idle',
  TELEGRAPH: 'telegraph',
  ATTACK: 'attack',
  RECOVERY: 'recovery',
  STUNNED: 'stunned',
  DOWN: 'down',
};

export function createOpponent(config) {
  return {
    name: config.name,
    health: config.health,
    maxHealth: config.health,
    knockdowns: 0,

    state: OPP_STATE.IDLE,
    stateTimer: 0,

    // Current pattern step
    patterns: config.patterns,       // array of pattern objects
    currentPattern: null,
    patternIndex: 0,
    patternCooldown: 1.0,           // time between patterns

    // Visual
    telegraphType: null,             // which tell animation to show
    attackType: null,                // which attack animation to show
    attackDirection: null,           // 'left', 'right', 'center' — for dodge checks

    // Config
    idleMinTime: config.idleMinTime || 1.0,
    idleMaxTime: config.idleMaxTime || 2.0,
    goldenParachute: config.goldenParachute || false,
    usedParachute: false,

    // Portrait / flavor
    portrait: config.portrait || null,
    title: config.title || '',
    taunt: config.taunt || '',
    color: config.color || '#888',
  };
}

export function updateOpponent(opp, dt) {
  opp.stateTimer -= dt;

  if (opp.state === OPP_STATE.DOWN) return;

  if (opp.stateTimer <= 0) {
    switch (opp.state) {
      case OPP_STATE.IDLE:
        startNextPattern(opp);
        break;
      case OPP_STATE.TELEGRAPH:
        opp.state = OPP_STATE.ATTACK;
        opp.stateTimer = opp.currentPattern.attackDuration;
        break;
      case OPP_STATE.ATTACK:
        opp.state = OPP_STATE.RECOVERY;
        opp.stateTimer = opp.currentPattern.recoveryDuration;
        break;
      case OPP_STATE.RECOVERY:
      case OPP_STATE.STUNNED:
        opp.state = OPP_STATE.IDLE;
        opp.stateTimer = opp.idleMinTime + Math.random() * (opp.idleMaxTime - opp.idleMinTime);
        break;
    }
  }
}

function startNextPattern(opp) {
  const pattern = opp.patterns[opp.patternIndex % opp.patterns.length];
  opp.currentPattern = pattern;
  opp.patternIndex++;

  opp.telegraphType = pattern.telegraph;
  opp.attackType = pattern.attackType;
  opp.attackDirection = pattern.direction;

  opp.state = OPP_STATE.TELEGRAPH;
  opp.stateTimer = pattern.telegraphDuration;
}

export function stunOpponent(opp, duration) {
  opp.state = OPP_STATE.STUNNED;
  opp.stateTimer = duration;
}
```

- [ ] **Step 2: Create `js/combat.js`**

```javascript
import { stunPlayer } from './player.js';
import { OPP_STATE, stunOpponent } from './opponent.js';

const COUNTER_STAR_CHANCE = 1; // always earn star on counter-punch

export function processCombat(player, opp, dt) {
  const result = { playerHit: false, oppHit: false, knockdown: null };

  // --- Opponent attacks player ---
  if (opp.state === OPP_STATE.ATTACK && opp.stateTimer > 0) {
    const pattern = opp.currentPattern;
    // Check on first frame of attack (stateTimer close to full duration)
    const justStarted = opp.stateTimer > pattern.attackDuration - dt * 1.5;
    if (justStarted) {
      const dodged = didPlayerDodge(player, pattern);
      const blocked = player.action === 'block' && pattern.blockable !== false;

      if (!dodged && !blocked) {
        player.health -= pattern.damage;
        stunPlayer(player);
        result.playerHit = true;
        if (player.health <= 0) {
          player.health = 0;
          result.knockdown = 'player';
        }
      } else if (dodged) {
        // Successful dodge — opponent enters recovery (opening)
        opp.state = OPP_STATE.RECOVERY;
        opp.stateTimer = pattern.recoveryDuration;
      }
    }
  }

  // --- Player attacks opponent ---
  const isPunching = player.action === 'punchLeft' || player.action === 'punchRight' || player.action === 'special';
  const punchJustStarted = isPunching && player.actionTimer > 0.15;

  if (punchJustStarted && (opp.state === OPP_STATE.RECOVERY || opp.state === OPP_STATE.STUNNED || opp.state === OPP_STATE.IDLE)) {
    const damage = player.action === 'special' ? player.specialPower : player.punchPower;
    const isCounter = opp.state === OPP_STATE.RECOVERY;

    opp.health -= damage;
    result.oppHit = true;

    if (isCounter && player.stars < player.maxStars) {
      player.stars += COUNTER_STAR_CHANCE;
    }

    if (opp.health <= 0) {
      // Check golden parachute
      if (opp.goldenParachute && !opp.usedParachute) {
        opp.usedParachute = true;
        opp.health = opp.maxHealth * 0.5;
        stunOpponent(opp, 2.0);
      } else {
        opp.health = 0;
        result.knockdown = 'opponent';
      }
    }
  }

  // --- Player punches during telegraph = risky, opponent can still attack ---
  if (punchJustStarted && opp.state === OPP_STATE.TELEGRAPH) {
    // Glancing blow — small damage, no star
    opp.health -= 3;
    result.oppHit = true;
  }

  return result;
}

function didPlayerDodge(player, pattern) {
  const dir = pattern.direction;
  if (dir === 'left') return player.action === 'dodgeRight';
  if (dir === 'right') return player.action === 'dodgeLeft';
  if (dir === 'center') return player.action === 'dodgeLeft' || player.action === 'dodgeRight';
  return false;
}
```

- [ ] **Step 3: Wire combat into game loop**

In `game.js`, import `createOpponent`, `updateOpponent` from `opponent.js` and `processCombat` from `combat.js`. Create a temporary test opponent. In the fight state's `update()`, call `updateOpponent` and `processCombat`. Handle knockdown results (transition to knockdown state, increment counts, check for TKO at 3).

Add a knockdown state handler: when knockdown = 'opponent', pause for 2 seconds then check knockdown count. If 3, transition to `result` state. Otherwise reset opponent health partially and resume. For player knockdown, track mash count on Z/X press, recover if enough mashes in 10 seconds.

Add opponent debug text alongside player debug text in the render function.

- [ ] **Step 4: Verify in browser**

Set state to FIGHT with the temp opponent. Verify:
- Opponent cycles through idle → telegraph → attack → recovery
- Pressing dodge during telegraph avoids the hit
- Punching during recovery deals damage
- When opponent health hits 0, knockdown triggers
- Three knockdowns → result state

- [ ] **Step 5: Commit**

```bash
git add js/opponent.js js/combat.js js/game.js
git commit -m "feat: base opponent and combat system with knockdowns"
```

---

### Task 4: Renderer — Ring, Characters, and HUD

**Files:**
- Create: `js/renderer.js`
- Create: `js/ui.js`

This is the big visual task. Draws the boxing ring background, the opponent character (anime-styled with canvas primitives), the player's gloves, and the HUD (health bars, stamina bar, star meter, round timer).

- [ ] **Step 1: Create `js/renderer.js`**

Draw functions for:
- `drawRing(ctx)` — perspective ring with ropes, floor, crowd shadows
- `drawOpponent(ctx, opp)` — anime-styled character drawn with canvas shapes. Different poses based on `opp.state` (idle sway, telegraph wind-up, attack lunge, recovery stumble, stunned stars, down on ground). Use `opp.color` for suit color.
- `drawPlayer(ctx, player)` — first-person gloves at bottom of screen. Position shifts based on `player.action` (center for idle, offset for dodge, forward for punch, raised for block).
- `drawHitEffect(ctx, target)` — white flash + impact lines when hit lands

The opponent character should be drawn anime-style: large head with big eyes, exaggerated proportions, suit/tie, boxing gloves. Use gradients and curves to give it personality. Each opponent gets different features via their config (hair color, expression, accessories like glasses or coffee mug).

The player gloves should be large, taking up the bottom ~20% of screen, with slight idle bob animation.

This file will be the longest — expect 200-400 lines of canvas path drawing. Break it into clearly labeled functions.

- [ ] **Step 2: Create `js/ui.js`**

Draw functions for:
- `drawHUD(ctx, player, opp)` — health bars (player green, opponent red) at top, stamina bar below player health, star icons, opponent name
- `drawTitleScreen(ctx)` — "CORPORATE KNOCKOUT" title with subtitle "Fight your way to the top", "Press ENTER to start"
- `drawIntroScreen(ctx, opp)` — opponent portrait (colored rectangle placeholder for now), name, title, taunt text. "Press ENTER to fight"
- `drawResultScreen(ctx, won)` — "YOU WIN" / "YOU LOSE" with prompt to continue
- `drawGameOverScreen(ctx, won)` — "CONGRATULATIONS" / "GAME OVER" final screen
- `drawKnockdownCount(ctx, count, isPlayer)` — referee count (1-10) in center of screen

- [ ] **Step 3: Replace game.js rendering with renderer/ui calls**

Remove all temporary debug text from `game.js`. Import `renderer.js` and `ui.js`. In the render function, dispatch to the appropriate draw functions based on `currentState`:

- `title` → `drawTitleScreen(ctx)`
- `intro` → `drawIntroScreen(ctx, currentOpponent)`
- `fight` → `drawRing(ctx)`, `drawOpponent(ctx, opp)`, `drawPlayer(ctx, player)`, `drawHUD(ctx, player, opp)`
- `knockdown` → `drawRing(ctx)`, `drawOpponent(ctx, opp)`, `drawPlayer(ctx, player)`, `drawKnockdownCount(ctx, ...)`
- `result` → `drawResultScreen(ctx, won)`
- `gameover` → `drawGameOverScreen(ctx, won)`

- [ ] **Step 4: Add state transition logic to game.js**

Wire up ENTER key to advance through title → intro → fight. After a fight result, ENTER advances to next opponent intro (or game over if all 3 beaten). This completes the full game flow skeleton.

- [ ] **Step 5: Verify in browser**

Walk through the full flow: title screen → press enter → intro screen → press enter → fight (with temp opponent) → knock them out → result → etc. Verify all screens render, HUD updates during combat, opponent animates between states.

- [ ] **Step 6: Commit**

```bash
git add js/renderer.js js/ui.js js/game.js
git commit -m "feat: renderer with ring, characters, HUD, and all game screens"
```

---

### Task 5: The Intern (First Real Fight)

**Files:**
- Create: `js/opponents/intern.js`
- Modify: `js/game.js` — replace test opponent with real opponent sequence

- [ ] **Step 1: Create `js/opponents/intern.js`**

```javascript
import { createOpponent } from '../opponent.js';

export function createIntern() {
  return createOpponent({
    name: 'The Intern',
    title: 'Mail Room Menace',
    taunt: '"S-sorry in advance... I really need this promotion!"',
    health: 80,
    color: '#4a90d9',  // blue suit

    idleMinTime: 1.5,
    idleMaxTime: 2.5,

    patterns: [
      {
        telegraph: 'windUpRight',
        telegraphDuration: 1.0,
        attackType: 'hook',
        direction: 'right',
        attackDuration: 0.4,
        recoveryDuration: 2.0,
        damage: 8,
        blockable: true,
      },
      {
        telegraph: 'windUpLeft',
        telegraphDuration: 1.0,
        attackType: 'hook',
        direction: 'left',
        attackDuration: 0.4,
        recoveryDuration: 2.0,
        damage: 8,
        blockable: true,
      },
      {
        telegraph: 'windUpRight',
        telegraphDuration: 1.0,
        attackType: 'hook',
        direction: 'right',
        attackDuration: 0.4,
        recoveryDuration: 2.0,
        damage: 8,
        blockable: true,
      },
      {
        // First Day Flail — 3-hit combo, dodge any direction
        telegraph: 'flailWindUp',
        telegraphDuration: 1.2,
        attackType: 'flail',
        direction: 'center',
        attackDuration: 0.8,
        recoveryDuration: 2.0,
        damage: 15,
        blockable: false,
      },
    ],
  });
}
```

- [ ] **Step 2: Wire into game.js**

Import `createIntern`. Set up an opponent sequence array: `[createIntern, createManager, createCEO]` (latter two as placeholders returning null for now). On game start, create first opponent from the sequence. On fight win, advance to next. On all 3 beaten, go to gameover (victory).

- [ ] **Step 3: Verify the Intern fight**

Play through the Intern fight. Verify:
- Telegraph animation is clear and gives ~1 second to react
- Dodging works in both directions
- Counter-punching during recovery deals damage
- Flail attack requires dodge (blocking fails)
- Three knockdowns = KO
- Feel: should be easy, forgiving, tutorial-like

- [ ] **Step 4: Commit**

```bash
git add js/opponents/intern.js js/game.js
git commit -m "feat: the Intern — first opponent with tutorial patterns"
```

---

### Task 6: Middle Manager

**Files:**
- Create: `js/opponents/manager.js`
- Modify: `js/game.js` — wire into opponent sequence

- [ ] **Step 1: Create `js/opponents/manager.js`**

```javascript
import { createOpponent } from '../opponent.js';

export function createManager() {
  return createOpponent({
    name: 'Middle Manager',
    title: 'Director of Synergy',
    taunt: '"Let\'s take this offline. Permanently."',
    health: 120,
    color: '#7b7b7b',  // gray suit

    idleMinTime: 1.0,
    idleMaxTime: 1.8,

    patterns: [
      {
        telegraph: 'adjustTie',
        telegraphDuration: 0.6,
        attackType: 'jab',
        direction: 'center',
        attackDuration: 0.25,
        recoveryDuration: 0.8,
        damage: 10,
        blockable: true,
      },
      {
        telegraph: 'sipCoffee',
        telegraphDuration: 0.8,
        attackType: 'uppercut',
        direction: 'center',
        attackDuration: 0.3,
        recoveryDuration: 1.5,
        damage: 18,
        blockable: false,  // must dodge
      },
      {
        telegraph: 'adjustTie',
        telegraphDuration: 0.5,
        attackType: 'jab',
        direction: 'left',
        attackDuration: 0.25,
        recoveryDuration: 0.8,
        damage: 10,
        blockable: true,
      },
      {
        // Meeting Invite combo — left-right-left
        telegraph: 'checkPhone',
        telegraphDuration: 0.7,
        attackType: 'combo',
        direction: 'left',
        attackDuration: 0.6,
        recoveryDuration: 1.0,
        damage: 22,
        blockable: true,
      },
      {
        // Performance Review — unblockable slam
        telegraph: 'raiseClipboard',
        telegraphDuration: 0.8,
        attackType: 'slam',
        direction: 'center',
        attackDuration: 0.35,
        recoveryDuration: 1.2,
        damage: 20,
        blockable: false,
      },
    ],
  });
}
```

- [ ] **Step 2: Wire into game.js opponent sequence**

Replace the placeholder for index 1 with `createManager`.

- [ ] **Step 3: Verify the Manager fight**

Play through Intern → Manager. Verify:
- Shorter telegraph windows make it harder than Intern
- Coffee uppercut can't be blocked — must dodge
- Meeting Invite combo does heavy damage if you just block
- Performance Review slam is clearly telegraphed but unblockable
- Feel: noticeable step up in difficulty, requires learning patterns

- [ ] **Step 4: Commit**

```bash
git add js/opponents/manager.js js/game.js
git commit -m "feat: Middle Manager — second opponent with faster patterns"
```

---

### Task 7: The CEO

**Files:**
- Create: `js/opponents/ceo.js`
- Modify: `js/game.js` — wire into opponent sequence

- [ ] **Step 1: Create `js/opponents/ceo.js`**

```javascript
import { createOpponent } from '../opponent.js';

export function createCEO() {
  return createOpponent({
    name: 'The CEO',
    title: 'Chairman of Pain',
    taunt: '"...You have 30 seconds. Make them count."',
    health: 150,
    color: '#1a1a2e',  // dark navy suit

    idleMinTime: 0.6,
    idleMaxTime: 1.2,
    goldenParachute: true,

    patterns: [
      {
        telegraph: 'smirk',
        telegraphDuration: 0.35,
        attackType: 'jab',
        direction: 'right',
        attackDuration: 0.15,
        recoveryDuration: 0.5,
        damage: 12,
        blockable: true,
      },
      {
        telegraph: 'adjustCufflinks',
        telegraphDuration: 0.5,
        attackType: 'cross',
        direction: 'center',
        attackDuration: 0.2,
        recoveryDuration: 0.75,
        damage: 20,
        blockable: false,
      },
      {
        telegraph: 'smirk',
        telegraphDuration: 0.35,
        attackType: 'jab',
        direction: 'left',
        attackDuration: 0.15,
        recoveryDuration: 0.5,
        damage: 12,
        blockable: true,
      },
      {
        // Hostile Takeover — feint then hit opposite side
        telegraph: 'feintLeft',
        telegraphDuration: 0.5,
        attackType: 'feint',
        direction: 'right',  // actual attack comes from opposite of feint
        attackDuration: 0.2,
        recoveryDuration: 0.75,
        damage: 22,
        blockable: false,
      },
      {
        telegraph: 'adjustCufflinks',
        telegraphDuration: 0.4,
        attackType: 'cross',
        direction: 'center',
        attackDuration: 0.2,
        recoveryDuration: 0.75,
        damage: 20,
        blockable: false,
      },
      {
        // Board Meeting — rapid 5-hit combo
        telegraph: 'crackKnuckles',
        telegraphDuration: 0.6,
        attackType: 'boardMeeting',
        direction: 'center',
        attackDuration: 1.0,
        recoveryDuration: 1.0,
        damage: 35,
        blockable: false,
      },
    ],
  });
}
```

- [ ] **Step 2: Wire into game.js opponent sequence**

Replace the placeholder for index 2 with `createCEO`. Ensure the game over (victory) screen triggers after beating all 3.

- [ ] **Step 3: Verify the CEO fight**

Play through all three fights. Verify:
- CEO telegraph windows are very short (~0.35s for jab)
- Feint attack tricks you if you dodge based on the telegraph direction
- Golden Parachute triggers on first knockdown — CEO recovers at 50% health
- Board Meeting combo is devastating but has clear wind-up
- Feel: genuinely hard, requires learning the pattern sequence

- [ ] **Step 4: Commit**

```bash
git add js/opponents/ceo.js js/game.js
git commit -m "feat: the CEO — final boss with feints and golden parachute"
```

---

### Task 8: Polish — Animations, Effects, Sound Cues

**Files:**
- Modify: `js/renderer.js` — add hit flash, screen shake, knockdown animation
- Modify: `js/ui.js` — smooth transitions between screens, animated title
- Modify: `js/game.js` — screen shake state, transition timers

- [ ] **Step 1: Add screen shake**

In `game.js`, add a `screenShake` variable `{ intensity: 0, duration: 0 }`. When player or opponent is hit, set intensity (5 for light, 12 for heavy). In render, apply `ctx.translate(randomOffset, randomOffset)` before drawing, restore after. Decay intensity over duration.

- [ ] **Step 2: Add hit flash effect**

In `renderer.js`, when a hit lands, flash the canvas white (overlay a semi-transparent white rect) for 2 frames. Track flash state in a simple counter variable.

- [ ] **Step 3: Add opponent telegraph animations**

In `renderer.js`, enhance `drawOpponent` to show distinct visual tells:
- `windUpRight/windUpLeft` — body leans back, arm pulls back
- `sipCoffee` — hand raises to face
- `adjustTie` — hand goes to neck
- `smirk` — subtle expression change (eyes narrow)
- `feintLeft` — body shifts one way, arm goes the other
- `crackKnuckles` / `raiseClipboard` / `checkPhone` — appropriate gestures

Each is a canvas transform on the base character pose.

- [ ] **Step 4: Add smooth screen transitions**

In `ui.js`, add a fade-to-black transition between states. When changing state, fade out over 0.3s, switch, fade in over 0.3s. Use a transition overlay rect with animated alpha.

- [ ] **Step 5: Add knockdown animation**

When opponent goes down: animate them falling backward over 0.5s (rotate and translate down). When player goes down: screen tilts, red vignette, "MASH Z AND X!" text pulses.

- [ ] **Step 6: Polish the title screen**

Animate "CORPORATE KNOCKOUT" with a punch-in effect (scale from large to normal). Add subtle idle animation to the background (maybe swaying ropes or crowd silhouettes).

- [ ] **Step 7: Verify full playthrough**

Play through all 3 fights start to finish. Check that:
- All transitions are smooth
- Hit effects feel impactful
- Telegraph animations are readable
- Knockdown sequences are dramatic
- Title screen feels polished
- No visual glitches or timing issues

- [ ] **Step 8: Commit**

```bash
git add js/renderer.js js/ui.js js/game.js
git commit -m "feat: polish pass — animations, screen shake, transitions, effects"
```

---

### Task 9: Character Portraits + Final Integration

**Files:**
- Create: `assets/portraits/` placeholder images
- Modify: `js/ui.js` — render portraits on intro screens
- Modify: `js/renderer.js` — final visual tuning

- [ ] **Step 1: Generate placeholder portraits**

Create canvas-generated "anime portrait" placeholders for each character. Draw them as styled canvas art in the intro screen rendering — not as external files. Each portrait should show:
- **Intern:** Young face, messy hair, wide nervous eyes, wrinkled blue suit, oversized boxing gloves
- **Manager:** Stern middle-aged face, glasses, slicked hair, gray suit, coffee mug in one glove
- **CEO:** Sharp features, cold eyes, perfectly styled hair, dark navy suit, gold cufflinks visible

These are drawn with canvas paths/gradients directly in `ui.js`'s `drawIntroScreen`, making the game fully self-contained (no external assets needed).

- [ ] **Step 2: Add character intro presentation**

On the intro screen, show the portrait on the left, opponent name/title/taunt on the right. Add a "VS" graphic. Animate the portrait sliding in from the left.

- [ ] **Step 3: Add between-round flavor text**

After each knockdown (opponent), show brief text: Intern says "O-ow... okay one more try...", Manager says "This will be reflected in your review...", CEO says "...Interesting."

- [ ] **Step 4: Final integration pass**

- Ensure all three fights are correctly sequenced
- Victory screen after beating CEO shows "YOU'RE THE NEW CEO!" or similar
- Game over screen offers "Press ENTER to retry"
- Controls reminder on title screen

- [ ] **Step 5: Verify complete game**

Full playthrough from title to victory. All portraits render, all intros display, all fights play correctly, game over and retry work.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: character portraits, intros, and final game flow"
```
