import { clearJustPressed } from './input.js';
import { createPlayer, updatePlayer } from './player.js';

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

function update(dt) {
  if (currentState === STATE.FIGHT) {
    updatePlayer(player, dt);
  }
}

function render() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Will dispatch to state-specific render functions

  // Temporary: show current state
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`State: ${currentState}`, 10, 30);

  if (currentState === STATE.FIGHT) {
    ctx.fillStyle = '#0f0';
    ctx.font = '14px monospace';
    ctx.fillText(`HP: ${player.health} | STA: ${Math.round(player.stamina)} | Stars: ${player.stars} | Action: ${player.action}`, 10, 580);
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
