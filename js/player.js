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
    blockFlashTimer: 0,
    mashCount: 0,       // for knockdown recovery
    invincible: false,
    invincibleTimer: 0,

    get punchPower() {
      return this.stamina > 20 ? 8 : 3;
    },
    get specialPower() {
      return 25;
    },
  };
}

export function updatePlayer(p, dt) {
  if (p.blockFlashTimer > 0) p.blockFlashTimer -= dt;
  if (p.invincibleTimer > 0) {
    p.invincibleTimer -= dt;
    if (p.invincibleTimer <= 0) {
      p.invincible = false;
      p.invincibleTimer = 0;
    }
  }

  if (p.action === 'idle' || p.action === 'block') {
    p.stamina = Math.min(p.maxStamina, p.stamina + STAMINA_REGEN * dt);
  }

  if (p.action !== 'idle' && p.action !== 'block') {
    p.actionTimer -= dt;
    if (p.actionTimer <= 0) {
      p.action = 'idle';
      p.actionTimer = 0;
    }
    return; // locked into action
  }

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
