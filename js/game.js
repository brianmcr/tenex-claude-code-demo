import { clearJustPressed, justPressed } from './input.js';
import { createPlayer, updatePlayer } from './player.js';
import { updateOpponent, OPP_STATE } from './opponent.js';
import { processCombat } from './combat.js';
import { drawRing, drawOpponent, drawPlayer, drawHitEffects, addHitEffect, updateRendererTime } from './renderer.js';
import { drawHUD, drawTitleScreen, drawIntroScreen, drawResultScreen, drawGameOverScreen, drawKnockdownCount, updateUITime } from './ui.js';
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
const PLAYER_MASH_THRESHOLD = 15;
const TKO_COUNT = 3;

// Screen shake
let screenShake = { intensity: 0, duration: 0 };

function triggerShake(intensity, duration) {
  screenShake.intensity = intensity;
  screenShake.duration = duration;
}

function spawnOpponent(index) {
  opponent = opponentFactories[index]();
}

function resetForNewGame() {
  currentOpponentIndex = 0;
  player = createPlayer();
  spawnOpponent(0);
}

function update(dt) {
  updateRendererTime(dt);
  updateUITime(dt);

  // Decay screen shake
  if (screenShake.duration > 0) {
    screenShake.duration -= dt;
    if (screenShake.duration <= 0) {
      screenShake.intensity = 0;
      screenShake.duration = 0;
    }
  }

  if (currentState === STATE.TITLE) {
    if (justPressed('Enter')) {
      currentOpponentIndex = 0;
      player = createPlayer();
      spawnOpponent(0);
      currentState = STATE.INTRO;
    }
    return;
  }

  if (currentState === STATE.INTRO) {
    if (justPressed('Enter')) {
      currentState = STATE.FIGHT;
    }
    return;
  }

  if (currentState === STATE.FIGHT) {
    updatePlayer(player, dt);
    updateOpponent(opponent, dt);

    const result = processCombat(player, opponent, dt);

    if (result.playerHit) {
      triggerShake(8, 0.2);
      addHitEffect(400, 350);
    }
    if (result.oppHit) {
      triggerShake(4, 0.15);
      addHitEffect(400 + (Math.random() - 0.5) * 60, 280 + (Math.random() - 0.5) * 40);
    }

    if (result.knockdown) {
      currentState = STATE.KNOCKDOWN;
      knockdownTarget = result.knockdown;
      knockdownTimer = 0;
      knockdownMashCount = 0;
      triggerShake(15, 0.4);

      if (result.knockdown === 'opponent') {
        opponent.state = OPP_STATE.DOWN;
        opponent.knockdowns++;
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
          currentState = STATE.GAMEOVER;
        } else {
          player = createPlayer();
          spawnOpponent(currentOpponentIndex);
          currentState = STATE.INTRO;
        }
      } else {
        currentState = STATE.GAMEOVER;
      }
    }
  }

  if (currentState === STATE.GAMEOVER) {
    if (justPressed('Enter')) {
      resetForNewGame();
      currentState = STATE.TITLE;
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
      drawHitEffects(ctx);
      drawPlayer(ctx, player);
      drawHUD(ctx, player, opponent);
      break;

    case STATE.KNOCKDOWN:
      drawRing(ctx);
      drawOpponent(ctx, opponent);
      drawPlayer(ctx, player);
      drawHUD(ctx, player, opponent);
      drawKnockdownCount(ctx, knockdownTimer, knockdownTarget === 'player');
      break;

    case STATE.RESULT:
      drawResultScreen(ctx, fightWon);
      break;

    case STATE.GAMEOVER:
      drawGameOverScreen(ctx, fightWon);
      break;
  }

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
