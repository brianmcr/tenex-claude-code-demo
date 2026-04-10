import { clearJustPressed, justPressed } from './input.js';
import { createPlayer, updatePlayer } from './player.js';
import { createOpponent, updateOpponent, OPP_STATE } from './opponent.js';
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
  TUTORIAL: 'tutorial',
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

// Tutorial state
let tutorialStep = 0;
let tutorialProgress = 0;
let tutorialFeedbackText = '';
let tutorialFeedbackTimer = 0;
let tutorialDummy = null;
let tutorialCompleted = false;
const TUTORIAL_STEPS = [
  { instruction: 'Press Z or X to PUNCH', detail: 'Hit the dummy!', goal: 3 },
  { instruction: 'Press \u2190 or \u2192 to DODGE', detail: 'Dodge the attack!', goal: 2 },
  { instruction: 'Press \u2193 to BLOCK', detail: 'Block the attack!', goal: 2 },
  { instruction: 'Dodge, then COUNTER-PUNCH!', detail: 'Watch the tell, dodge, then punch!', goal: 3 },
  { instruction: "You're ready!", detail: 'Press ENTER to fight!', goal: 0 },
];
const TUTORIAL_FEEDBACK = ['NICE!', 'GREAT!', 'PERFECT!', 'AWESOME!'];

function createTutorialDummy() {
  return createOpponent({
    name: 'Practice Dummy',
    title: 'Training Partner',
    taunt: '',
    health: 9999,
    color: '#6a6a8a',
    idleMinTime: 99,
    idleMaxTime: 99,
    patterns: [
      {
        telegraph: 'windUpRight',
        telegraphDuration: 2.0,
        attackType: 'hook',
        direction: 'right',
        attackDuration: 0.6,
        recoveryDuration: 2.5,
        damage: 0,
        blockable: true,
      },
    ],
  });
}

function showTutorialFeedback() {
  tutorialFeedbackText = TUTORIAL_FEEDBACK[Math.floor(Math.random() * TUTORIAL_FEEDBACK.length)];
  tutorialFeedbackTimer = 1.0;
}

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
      if (!tutorialCompleted) {
        tutorialStep = 0;
        tutorialProgress = 0;
        tutorialFeedbackTimer = 0;
        tutorialDummy = createTutorialDummy();
        tutorialDummy.state = OPP_STATE.RECOVERY;
        tutorialDummy.stateTimer = 999;
        transitionTo(STATE.TUTORIAL);
      } else {
        spawnOpponent(0);
        transitionTo(STATE.INTRO);
      }
    }
    return;
  }

  if (currentState === STATE.INTRO) {
    if (justPressed('Enter')) {
      transitionTo(STATE.FIGHT);
    }
    return;
  }

  if (currentState === STATE.TUTORIAL) {
    if (tutorialFeedbackTimer > 0) tutorialFeedbackTimer -= dt;
    updatePlayer(player, dt);
    updateOpponent(tutorialDummy, dt);

    // Prevent player from dying in tutorial
    player.health = player.maxHealth;

    const step = TUTORIAL_STEPS[tutorialStep];

    if (tutorialStep === 0) {
      // Step 1: punch 3 times — dummy stays in recovery
      tutorialDummy.state = OPP_STATE.RECOVERY;
      tutorialDummy.stateTimer = 999;
      const isPunching = player.action === 'punchLeft' || player.action === 'punchRight';
      if (isPunching && player.actionTimer > 0.15) {
        tutorialProgress++;
        showTutorialFeedback();
        if (tutorialProgress >= step.goal) {
          tutorialStep++;
          tutorialProgress = 0;
          // Start first dodge attack after a brief pause
          tutorialDummy.state = OPP_STATE.IDLE;
          tutorialDummy.stateTimer = 1.5;
          tutorialDummy.currentPattern = {
            telegraph: 'windUpRight',
            telegraphDuration: 2.0,
            attackType: 'hook',
            direction: 'right',
            attackDuration: 0.6,
            recoveryDuration: 2.5,
            damage: 0,
            blockable: true,
          };
        }
      }
    } else if (tutorialStep === 1) {
      // Step 2: dodge 2 attacks
      // Force slow attack pattern
      if (tutorialDummy.state === OPP_STATE.IDLE && tutorialDummy.stateTimer <= 0) {
        const dirs = ['right', 'left'];
        const dir = dirs[tutorialProgress % 2];
        tutorialDummy.currentPattern = {
          telegraph: dir === 'right' ? 'windUpRight' : 'windUpLeft',
          telegraphDuration: 2.0,
          attackType: 'hook',
          direction: dir,
          attackDuration: 0.6,
          recoveryDuration: 2.5,
          damage: 0,
          blockable: true,
        };
        tutorialDummy.telegraphType = tutorialDummy.currentPattern.telegraph;
        tutorialDummy.attackDirection = dir;
        tutorialDummy.state = OPP_STATE.TELEGRAPH;
        tutorialDummy.stateTimer = 2.0;
      }
      // Check if player dodged during attack window
      if (tutorialDummy.state === OPP_STATE.ATTACK) {
        const dodged = (player.action === 'dodgeLeft' && tutorialDummy.attackDirection === 'right') ||
                       (player.action === 'dodgeRight' && tutorialDummy.attackDirection === 'left');
        if (dodged) {
          tutorialProgress++;
          showTutorialFeedback();
          tutorialDummy.state = OPP_STATE.IDLE;
          tutorialDummy.stateTimer = 1.5;
          if (tutorialProgress >= step.goal) {
            tutorialStep++;
            tutorialProgress = 0;
            tutorialDummy.state = OPP_STATE.IDLE;
            tutorialDummy.stateTimer = 1.5;
          }
        }
      }
      // If attack hits during tutorial, just reset
      if (tutorialDummy.state === OPP_STATE.RECOVERY && tutorialStep === 1) {
        tutorialDummy.state = OPP_STATE.IDLE;
        tutorialDummy.stateTimer = 1.0;
      }
    } else if (tutorialStep === 2) {
      // Step 3: block 2 attacks
      if (tutorialDummy.state === OPP_STATE.IDLE && tutorialDummy.stateTimer <= 0) {
        tutorialDummy.currentPattern = {
          telegraph: 'windUpRight',
          telegraphDuration: 2.0,
          attackType: 'hook',
          direction: 'right',
          attackDuration: 0.6,
          recoveryDuration: 2.5,
          damage: 0,
          blockable: true,
        };
        tutorialDummy.telegraphType = 'windUpRight';
        tutorialDummy.attackDirection = 'right';
        tutorialDummy.state = OPP_STATE.TELEGRAPH;
        tutorialDummy.stateTimer = 2.0;
      }
      if (tutorialDummy.state === OPP_STATE.ATTACK) {
        if (player.action === 'block') {
          tutorialProgress++;
          showTutorialFeedback();
          addComicText(400, 500, 'BLOCKED!');
          tutorialDummy.state = OPP_STATE.IDLE;
          tutorialDummy.stateTimer = 1.5;
          if (tutorialProgress >= step.goal) {
            tutorialStep++;
            tutorialProgress = 0;
            tutorialDummy.state = OPP_STATE.IDLE;
            tutorialDummy.stateTimer = 1.5;
          }
        }
      }
      if (tutorialDummy.state === OPP_STATE.RECOVERY && tutorialStep === 2) {
        tutorialDummy.state = OPP_STATE.IDLE;
        tutorialDummy.stateTimer = 1.0;
      }
    } else if (tutorialStep === 3) {
      // Step 4: dodge then counter-punch 3 times
      if (tutorialDummy.state === OPP_STATE.IDLE && tutorialDummy.stateTimer <= 0) {
        const dirs = ['right', 'left', 'right'];
        const dir = dirs[tutorialProgress % 3];
        tutorialDummy.currentPattern = {
          telegraph: dir === 'right' ? 'windUpRight' : 'windUpLeft',
          telegraphDuration: 1.5,
          attackType: 'hook',
          direction: dir,
          attackDuration: 0.5,
          recoveryDuration: 2.5,
          damage: 0,
          blockable: true,
        };
        tutorialDummy.telegraphType = tutorialDummy.currentPattern.telegraph;
        tutorialDummy.attackDirection = dir;
        tutorialDummy.state = OPP_STATE.TELEGRAPH;
        tutorialDummy.stateTimer = 1.5;
      }
      // After dodge, check for counter-punch during recovery
      if (tutorialDummy.state === OPP_STATE.ATTACK) {
        const dodged = (player.action === 'dodgeLeft' && tutorialDummy.attackDirection === 'right') ||
                       (player.action === 'dodgeRight' && tutorialDummy.attackDirection === 'left');
        if (dodged) {
          tutorialDummy.state = OPP_STATE.RECOVERY;
          tutorialDummy.stateTimer = 2.5;
        }
      }
      if (tutorialDummy.state === OPP_STATE.RECOVERY) {
        const isPunching = player.action === 'punchLeft' || player.action === 'punchRight';
        if (isPunching && player.actionTimer > 0.15) {
          tutorialProgress++;
          showTutorialFeedback();
          tutorialDummy.state = OPP_STATE.IDLE;
          tutorialDummy.stateTimer = 1.5;
          if (tutorialProgress >= step.goal) {
            tutorialStep++;
            tutorialProgress = 0;
          }
        }
      }
      // If attack lands (player didn't dodge), just reset
      if (tutorialDummy.state === OPP_STATE.RECOVERY && tutorialDummy.stateTimer > 2.4 && tutorialStep === 3) {
        // let it play out naturally
      }
    } else if (tutorialStep === 4) {
      // Step 5: press enter to continue
      if (justPressed('Enter')) {
        tutorialCompleted = true;
        player = createPlayer();
        spawnOpponent(0);
        transitionTo(STATE.INTRO);
      }
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
      if (opponent.state !== OPP_STATE.IDLE) {
        addHitEffect(hx, hy);
        addComicText(hx, hy);
      }
    }
    if (result.blocked) {
      addComicText(400, 500, 'BLOCKED!');
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

    case STATE.TUTORIAL:
      drawRing(ctx);
      drawOpponent(ctx, tutorialDummy);
      drawTelegraphProp(ctx, tutorialDummy);
      drawHitEffects(ctx);
      drawComicTexts(ctx);
      drawHitFlash(ctx);
      drawPlayer(ctx, player);
      // Tutorial UI overlay
      drawTutorialOverlay(ctx);
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
      if (knockdownTarget === 'player') {
        const tiltAmt = Math.sin(knockdownTimer * 2) * 0.02;
        ctx.save();
        ctx.translate(400, 300);
        ctx.rotate(tiltAmt);
        ctx.translate(-400, -300);
      }
      drawRing(ctx);
      drawOpponent(ctx, opponent);
      drawPlayer(ctx, player);
      if (knockdownTarget === 'player') {
        ctx.restore();
      }
      drawHUD(ctx, player, opponent, roundTimer);
      if (knockdownTarget === 'player') {
        drawPlayerKnockdownOverlay(ctx, knockdownTimer);
      }
      drawKnockdownCount(ctx, knockdownTimer, knockdownTarget === 'player');
      if (knockdownTarget === 'player') {
        const pct = Math.min(1, knockdownMashCount / PLAYER_MASH_THRESHOLD);
        const barW = 300, barH = 20, barX = 250, barY = 555;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        const fillColor = pct > 0.7 ? '#44dd66' : pct > 0.4 ? '#ddaa22' : '#dd4444';
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barW * pct, barH);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(barX, barY, barW * pct, barH / 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${knockdownMashCount} / ${PLAYER_MASH_THRESHOLD}`, 400, barY + 15);
        ctx.textAlign = 'left';
      }
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

function drawTutorialOverlay(ctx) {
  const W = 800;
  const step = TUTORIAL_STEPS[tutorialStep] || TUTORIAL_STEPS[4];

  // Dim top area for text readability
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, 110);

  ctx.save();
  ctx.textAlign = 'center';

  // Step indicator
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#8888aa';
  ctx.fillText(`Step ${tutorialStep + 1} of ${TUTORIAL_STEPS.length}`, W / 2, 22);

  // Main instruction
  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 6;
  ctx.fillText(step.instruction, W / 2, 58);
  ctx.shadowBlur = 0;

  // Detail text
  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#aaaacc';
  ctx.fillText(step.detail, W / 2, 85);

  // Progress dots
  if (step.goal > 0) {
    const dotSpacing = 24;
    const startX = W / 2 - ((step.goal - 1) * dotSpacing) / 2;
    for (let i = 0; i < step.goal; i++) {
      ctx.beginPath();
      ctx.arc(startX + i * dotSpacing, 100, 6, 0, Math.PI * 2);
      if (i < tutorialProgress) {
        ctx.fillStyle = '#44dd66';
      } else {
        ctx.fillStyle = 'rgba(100,100,100,0.5)';
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Feedback text (NICE! / GREAT! etc)
  if (tutorialFeedbackTimer > 0) {
    const scale = 0.5 + (1 - tutorialFeedbackTimer) * 0.8;
    const alpha = Math.min(1, tutorialFeedbackTimer * 2);
    ctx.save();
    ctx.translate(W / 2, 300);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText(tutorialFeedbackText, 0, 0);
    ctx.fillStyle = '#44dd66';
    ctx.fillText(tutorialFeedbackText, 0, 0);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // "TRAINING" watermark
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,100,0.3)';
  ctx.fillText('TRAINING', W / 2, 580);

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
