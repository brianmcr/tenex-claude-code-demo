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
