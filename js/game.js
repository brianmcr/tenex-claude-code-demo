import { clearJustPressed, justPressed } from './input.js';
import { createPlayer, updatePlayer } from './player.js';
import { updateOpponent, OPP_STATE } from './opponent.js';
import { processCombat } from './combat.js';
import { drawRing, drawOpponent, drawPlayer, drawHitEffects, drawHitFlash, addHitEffect, updateRendererTime, drawPlayerKnockdownOverlay, drawTelegraphProp, addComicText, drawComicTexts } from './renderer.js';
import { drawHUD, drawTitleScreen, drawIntroScreen, drawResultScreen, drawGameOverScreen, drawKnockdownCount, drawTransition, updateTransition, startTransition, drawFlavorText, updateFlavorText, showFlavorText, updateUITime, resetIntroTimer, notifyStarEarned } from './ui.js';
import { createIntern } from './opponents/intern.js';
import { createManager } from './opponents/manager.js';
import { createCEO } from './opponents/ceo.js';

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

let player = createPlayer();

const opponentFactories = [createIntern, createManager, createCEO];

let currentOpponentIndex = 0;
let opponent = null;
let fightWon = false;

// Knockdown state
let knockdownTarget = null;
let knockdownTimer = 0;
let knockdownMashCount = 0;
const KNOCKDOWN_PAUSE = 2.0;
const PLAYER_KNOCKDOWN_TIME = 10.0;
const PLAYER_MASH_THRESHOLD = 25;
const TKO_COUNT = 3;

// Round timer
const ROUND_TIME = 99;
let roundTimer = ROUND_TIME;

// Screen shake
let screenShake = { intensity: 0, duration: 0 };

// State transition
let pendingState = null;
let prevStars = 0;

// Flavor text for knockdowns
const FLAVOR_TEXT = {
  'The Intern': 'O-ow... okay one more try...',
  'Middle Manager': 'This will be reflected in your review...',
  'The CEO': '...Interesting.',
};

function triggerShake(intensity, duration) {
  screenShake.intensity = intensity;
  screenShake.duration = duration;
}

function transitionTo(newState) {
  pendingState = newState;
  startTransition(() => {
    currentState = pendingState;
    pendingState = null;
    if (newState === STATE.INTRO || newState === STATE.TITLE) {
      resetIntroTimer();
    }
  });
}

function spawnOpponent(index) {
  opponent = opponentFactories[index]();
  roundTimer = ROUND_TIME;
}

function resetForNewGame() {
  currentOpponentIndex = 0;
  player = createPlayer();
  spawnOpponent(0);
}

function update(dt) {
  updateRendererTime(dt);
  updateUITime(dt);
  updateTransition(dt);
  updateFlavorText(dt);

  // Decay screen shake
  if (screenShake.duration > 0) {
    screenShake.duration -= dt;
    if (screenShake.duration <= 0) {
      screenShake.intensity = 0;
      screenShake.duration = 0;
    }
  }

  if (pendingState !== null) return;

  if (currentState === STATE.TITLE) {
    if (justPressed('Enter')) {
      currentOpponentIndex = 0;
      player = createPlayer();
      spawnOpponent(0);
      transitionTo(STATE.INTRO);
    }
    return;
  }

  if (currentState === STATE.INTRO) {
    if (justPressed('Enter')) {
      transitionTo(STATE.FIGHT);
    }
    return;
  }

  if (currentState === STATE.FIGHT) {
    updatePlayer(player, dt);
    updateOpponent(opponent, dt);

    roundTimer -= dt;
    if (roundTimer <= 0) {
      roundTimer = 0;
      const playerPct = player.health / player.maxHealth;
      const oppPct = opponent.health / opponent.maxHealth;
      fightWon = playerPct >= oppPct;
      currentState = STATE.RESULT;
      return;
    }

    const result = processCombat(player, opponent, dt);

    if (result.playerHit) {
      triggerShake(8, 0.2);
      addHitEffect(400, 350);
    }
    if (result.oppHit) {
      triggerShake(4, 0.15);
      const hx = 400 + (Math.random() - 0.5) * 60;
      const hy = 280 + (Math.random() - 0.5) * 40;
      addHitEffect(hx, hy);
      addComicText(hx, hy);
    }

    if (player.stars > prevStars) {
      notifyStarEarned();
    }
    prevStars = player.stars;

    if (result.knockdown) {
      currentState = STATE.KNOCKDOWN;
      knockdownTarget = result.knockdown;
      knockdownTimer = 0;
      knockdownMashCount = 0;
      triggerShake(15, 0.4);

      if (result.knockdown === 'opponent') {
        opponent.state = OPP_STATE.DOWN;
        opponent.knockdowns++;
        if (FLAVOR_TEXT[opponent.name]) {
          showFlavorText(FLAVOR_TEXT[opponent.name]);
        }
      } else {
        player.knockdowns++;
      }
    }
  }

  if (currentState === STATE.KNOCKDOWN) {
    knockdownTimer += dt;

    if (knockdownTarget === 'opponent') {
      if (knockdownTimer >= KNOCKDOWN_PAUSE) {
        if (opponent.knockdowns >= TKO_COUNT) {
          fightWon = true;
          currentState = STATE.RESULT;
        } else {
          opponent.health = Math.round(opponent.maxHealth * 0.4);
          opponent.state = OPP_STATE.IDLE;
          opponent.stateTimer = 1.5;
          currentState = STATE.FIGHT;
        }
      }
    }

    if (knockdownTarget === 'player') {
      if (justPressed('KeyZ') || justPressed('KeyX')) {
        knockdownMashCount++;
      }

      if (knockdownMashCount >= PLAYER_MASH_THRESHOLD) {
        player.health = Math.max(player.health, 20);
        player.action = 'idle';
        player.actionTimer = 0;
        currentState = STATE.FIGHT;
      } else if (knockdownTimer >= PLAYER_KNOCKDOWN_TIME) {
        if (player.knockdowns >= TKO_COUNT) {
          fightWon = false;
          currentState = STATE.RESULT;
        } else {
          player.health = Math.max(player.health, 20);
          player.action = 'idle';
          player.actionTimer = 0;
          currentState = STATE.FIGHT;
        }
      }
    }
  }

  if (currentState === STATE.RESULT) {
    if (justPressed('Enter')) {
      if (fightWon) {
        currentOpponentIndex++;
        if (currentOpponentIndex >= opponentFactories.length) {
          transitionTo(STATE.GAMEOVER);
        } else {
          player = createPlayer();
          spawnOpponent(currentOpponentIndex);
          transitionTo(STATE.INTRO);
        }
      } else {
        transitionTo(STATE.GAMEOVER);
      }
    }
  }

  if (currentState === STATE.GAMEOVER) {
    if (justPressed('Enter')) {
      resetForNewGame();
      transitionTo(STATE.TITLE);
    }
  }
}

function render() {
  ctx.save();

  // Apply screen shake
  if (screenShake.intensity > 0) {
    const shakeX = (Math.random() - 0.5) * screenShake.intensity * 2;
    const shakeY = (Math.random() - 0.5) * screenShake.intensity * 2;
    ctx.translate(shakeX, shakeY);
    // Decay intensity
    screenShake.intensity *= 0.9;
  }

  // Clear
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  switch (currentState) {
    case STATE.TITLE:
      drawTitleScreen(ctx);
      break;

    case STATE.INTRO:
      drawIntroScreen(ctx, opponent);
      break;

    case STATE.FIGHT:
      drawRing(ctx);
      drawOpponent(ctx, opponent);
      drawTelegraphProp(ctx, opponent);
      drawHitEffects(ctx);
      drawComicTexts(ctx);
      drawHitFlash(ctx);
      drawPlayer(ctx, player);
      drawHUD(ctx, player, opponent, roundTimer);
      break;

    case STATE.KNOCKDOWN:
      drawRing(ctx);
      drawOpponent(ctx, opponent);
      drawPlayer(ctx, player);
      drawHUD(ctx, player, opponent, roundTimer);
      if (knockdownTarget === 'player') {
        drawPlayerKnockdownOverlay(ctx, knockdownTimer);
      }
      drawKnockdownCount(ctx, knockdownTimer, knockdownTarget === 'player');
      drawFlavorText(ctx);
      break;

    case STATE.RESULT:
      drawResultScreen(ctx, fightWon, opponent, player);
      break;

    case STATE.GAMEOVER:
      drawGameOverScreen(ctx, fightWon);
      break;
  }

  // Draw transition overlay on top of everything
  drawTransition(ctx);

  ctx.restore();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap dt to avoid huge jumps
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
