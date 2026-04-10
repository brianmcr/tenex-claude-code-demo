import { clearJustPressed, justPressed } from './input.js';
import { createPlayer, updatePlayer } from './player.js';
import { createOpponent, updateOpponent, OPP_STATE } from './opponent.js';
import { processCombat } from './combat.js';

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

let currentState = STATE.FIGHT; // TEMP: start in fight for testing
let lastTime = 0;

export function setState(s) { currentState = s; }
export function getState() { return currentState; }
export function getCtx() { return ctx; }
export function getCanvas() { return canvas; }

let player = createPlayer();

// Temp test opponent
let opponent = createOpponent({
  name: 'Test Dummy',
  title: 'Sparring Partner',
  taunt: '"Let\'s see what you\'ve got!"',
  health: 60,
  color: '#d94a4a',
  idleMinTime: 1.0,
  idleMaxTime: 2.0,
  goldenParachute: false,
  patterns: [
    {
      telegraph: 'windUpRight',
      telegraphDuration: 0.8,
      attackType: 'hook',
      direction: 'right',
      attackDuration: 0.4,
      recoveryDuration: 1.5,
      damage: 10,
      blockable: true,
    },
    {
      telegraph: 'windUpLeft',
      telegraphDuration: 0.8,
      attackType: 'hook',
      direction: 'left',
      attackDuration: 0.4,
      recoveryDuration: 1.5,
      damage: 10,
      blockable: true,
    },
    {
      telegraph: 'centerWindUp',
      telegraphDuration: 1.0,
      attackType: 'slam',
      direction: 'center',
      attackDuration: 0.5,
      recoveryDuration: 2.0,
      damage: 15,
      blockable: false,
    },
  ],
});

// Knockdown state tracking
let knockdownTarget = null; // 'player' or 'opponent'
let knockdownTimer = 0;
let knockdownMashCount = 0;
const KNOCKDOWN_PAUSE = 2.0;
const PLAYER_KNOCKDOWN_TIME = 10.0;
const PLAYER_MASH_THRESHOLD = 15;
const TKO_COUNT = 3;

function update(dt) {
  if (currentState === STATE.FIGHT) {
    updatePlayer(player, dt);
    updateOpponent(opponent, dt);

    const result = processCombat(player, opponent, dt);

    if (result.knockdown) {
      currentState = STATE.KNOCKDOWN;
      knockdownTarget = result.knockdown;
      knockdownTimer = 0;
      knockdownMashCount = 0;

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
          currentState = STATE.RESULT;
        } else {
          // Reset opponent and resume fight
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
        // Player recovers
        player.health = Math.max(player.health, 20);
        player.action = 'idle';
        player.actionTimer = 0;
        currentState = STATE.FIGHT;
      } else if (knockdownTimer >= PLAYER_KNOCKDOWN_TIME) {
        if (player.knockdowns >= TKO_COUNT) {
          currentState = STATE.RESULT;
        } else {
          // Player gets back up with minimum health
          player.health = Math.max(player.health, 20);
          player.action = 'idle';
          player.actionTimer = 0;
          currentState = STATE.FIGHT;
        }
      }
    }
  }
}

function render() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Temporary: show current state
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`State: ${currentState}`, 10, 30);

  if (currentState === STATE.FIGHT || currentState === STATE.KNOCKDOWN) {
    // Player debug
    ctx.fillStyle = '#0f0';
    ctx.font = '14px monospace';
    ctx.fillText(`P  HP: ${player.health} | STA: ${Math.round(player.stamina)} | Stars: ${player.stars} | Action: ${player.action} | KD: ${player.knockdowns}`, 10, 560);

    // Opponent debug
    ctx.fillStyle = '#f80';
    ctx.fillText(`O  HP: ${opponent.health}/${opponent.maxHealth} | State: ${opponent.state} | Timer: ${opponent.stateTimer.toFixed(1)} | Dir: ${opponent.attackDirection || '-'} | KD: ${opponent.knockdowns}`, 10, 580);
  }

  if (currentState === STATE.KNOCKDOWN) {
    ctx.fillStyle = '#ff0';
    ctx.font = '28px monospace';
    if (knockdownTarget === 'opponent') {
      ctx.fillText(`KNOCKDOWN! (${opponent.knockdowns}/${TKO_COUNT})`, 220, 300);
    } else {
      ctx.fillText(`YOU'RE DOWN! Mash Z/X! (${knockdownMashCount}/${PLAYER_MASH_THRESHOLD})`, 120, 300);
      ctx.font = '18px monospace';
      ctx.fillText(`Time: ${Math.max(0, PLAYER_KNOCKDOWN_TIME - knockdownTimer).toFixed(1)}s`, 320, 340);
    }
  }

  if (currentState === STATE.RESULT) {
    ctx.fillStyle = '#fff';
    ctx.font = '36px monospace';
    const won = opponent.knockdowns >= TKO_COUNT;
    ctx.fillText(won ? 'TKO! YOU WIN!' : 'TKO... YOU LOSE', 220, 300);
  }
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
