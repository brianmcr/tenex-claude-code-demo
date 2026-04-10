import { clearJustPressed, justPressed } from './input.js';
import { createPlayer, updatePlayer } from './player.js';
import { createOpponent, updateOpponent, OPP_STATE } from './opponent.js';
import { processCombat } from './combat.js';
import { drawRing, drawOpponent, drawPlayer, drawHitEffects, addHitEffect, updateRendererTime } from './renderer.js';
import { drawHUD, drawTitleScreen, drawIntroScreen, drawResultScreen, drawGameOverScreen, drawKnockdownCount, updateUITime } from './ui.js';

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

// Opponent sequence — all use test config for now; real opponents come in Task 5-7
const opponentConfigs = [
  {
    name: 'The Intern',
    title: 'Mail Room Menace',
    taunt: '"S-sorry in advance... I really need this promotion!"',
    health: 60,
    color: '#4a90d9',
    idleMinTime: 1.5,
    idleMaxTime: 2.5,
    patterns: [
      { telegraph: 'windUpRight', telegraphDuration: 1.0, attackType: 'hook', direction: 'right', attackDuration: 0.4, recoveryDuration: 2.0, damage: 8, blockable: true },
      { telegraph: 'windUpLeft', telegraphDuration: 1.0, attackType: 'hook', direction: 'left', attackDuration: 0.4, recoveryDuration: 2.0, damage: 8, blockable: true },
      { telegraph: 'centerWindUp', telegraphDuration: 1.2, attackType: 'slam', direction: 'center', attackDuration: 0.5, recoveryDuration: 2.0, damage: 15, blockable: false },
    ],
  },
  {
    name: 'Middle Manager',
    title: 'Director of Synergy',
    taunt: '"Let\'s take this offline. Permanently."',
    health: 80,
    color: '#7b7b7b',
    idleMinTime: 1.0,
    idleMaxTime: 1.8,
    patterns: [
      { telegraph: 'adjustTie', telegraphDuration: 0.6, attackType: 'jab', direction: 'center', attackDuration: 0.25, recoveryDuration: 0.8, damage: 10, blockable: true },
      { telegraph: 'sipCoffee', telegraphDuration: 0.8, attackType: 'uppercut', direction: 'center', attackDuration: 0.3, recoveryDuration: 1.5, damage: 18, blockable: false },
      { telegraph: 'adjustTie', telegraphDuration: 0.5, attackType: 'jab', direction: 'left', attackDuration: 0.25, recoveryDuration: 0.8, damage: 10, blockable: true },
    ],
  },
  {
    name: 'The CEO',
    title: 'Chairman of Pain',
    taunt: '"...You have 30 seconds. Make them count."',
    health: 100,
    color: '#1a1a2e',
    idleMinTime: 0.6,
    idleMaxTime: 1.2,
    goldenParachute: true,
    patterns: [
      { telegraph: 'smirk', telegraphDuration: 0.35, attackType: 'jab', direction: 'right', attackDuration: 0.15, recoveryDuration: 0.5, damage: 12, blockable: true },
      { telegraph: 'adjustCufflinks', telegraphDuration: 0.5, attackType: 'cross', direction: 'center', attackDuration: 0.2, recoveryDuration: 0.75, damage: 20, blockable: false },
      { telegraph: 'smirk', telegraphDuration: 0.35, attackType: 'jab', direction: 'left', attackDuration: 0.15, recoveryDuration: 0.5, damage: 12, blockable: true },
    ],
  },
];

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
  opponent = createOpponent(opponentConfigs[index]);
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
        if (currentOpponentIndex >= opponentConfigs.length) {
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
