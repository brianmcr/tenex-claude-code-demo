import { stunPlayer } from './player.js';
import { OPP_STATE, stunOpponent } from './opponent.js';

const COUNTER_STAR_CHANCE = 1;
const IDLE_PUNCH_DAMAGE = 2;
const BLOCK_STUN_DURATION = 0.5;

export function processCombat(player, opp, dt) {
  const result = { playerHit: false, oppHit: false, knockdown: null, blocked: false };

  // --- Opponent attacks player ---
  if (opp.state === OPP_STATE.ATTACK && opp.stateTimer > 0 && !player.invincible) {
    const pattern = opp.currentPattern;
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
      } else if (blocked) {
        stunOpponent(opp, BLOCK_STUN_DURATION);
        result.blocked = true;
        player.blockFlashTimer = 0.3;
        // Chip damage through block
        if (pattern.chipDamage) {
          player.health -= pattern.chipDamage;
          if (player.health <= 0) {
            player.health = 0;
            result.knockdown = 'player';
          }
        }
      } else if (dodged) {
        opp.state = OPP_STATE.RECOVERY;
        opp.stateTimer = pattern.recoveryDuration;
      }
    }
  }

  // --- Player attacks opponent ---
  const isPunching = player.action === 'punchLeft' || player.action === 'punchRight' || player.action === 'special';
  const punchJustStarted = isPunching && player.actionTimer > 0.15;

  if (punchJustStarted && (opp.state === OPP_STATE.RECOVERY || opp.state === OPP_STATE.STUNNED)) {
    const damage = player.action === 'special' ? player.specialPower : player.punchPower;
    const isCounter = opp.state === OPP_STATE.RECOVERY;

    opp.health -= damage;
    result.oppHit = true;

    if (isCounter && player.stars < player.maxStars) {
      player.stars += COUNTER_STAR_CHANCE;
    }

    if (opp.health <= 0) {
      if (opp.goldenParachute && !opp.usedParachute) {
        opp.usedParachute = true;
        opp.health = Math.round(opp.maxHealth * 0.3);
        opp.desperate = true;
        stunOpponent(opp, 2.0);
      } else {
        opp.health = 0;
        result.knockdown = 'opponent';
      }
    }
  }

  // --- Idle-punching: reduced damage, provokes opponent ---
  if (punchJustStarted && opp.state === OPP_STATE.IDLE) {
    opp.health -= IDLE_PUNCH_DAMAGE;
    result.oppHit = true;
    opp.stateTimer = 0;

    if (opp.health <= 0) {
      if (opp.goldenParachute && !opp.usedParachute) {
        opp.usedParachute = true;
        opp.health = Math.round(opp.maxHealth * 0.3);
        opp.desperate = true;
        stunOpponent(opp, 2.0);
      } else {
        opp.health = 0;
        result.knockdown = 'opponent';
      }
    }
  }

  // --- Player punches during telegraph = risky glancing blow ---
  if (punchJustStarted && opp.state === OPP_STATE.TELEGRAPH) {
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
