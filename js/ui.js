import { getStyle } from './artStyle.js';

let uiTime = 0;
let starEarnedTimer = 0;

// Screen transition
let transitionAlpha = 0;
let transitionPhase = 'none'; // 'out', 'in', 'none'
let transitionTimer = 0;
let transitionCallback = null;
const TRANSITION_DURATION = 0.3;

// Flavor text
let flavorText = '';
let flavorTimer = 0;
const FLAVOR_DURATION = 3.5;

let introTimer = 0;
let lastScreen = '';

export function updateUITime(dt) {
  uiTime += dt;
  introTimer += dt;
  if (starEarnedTimer > 0) starEarnedTimer -= dt;
}

export function notifyStarEarned() {
  starEarnedTimer = 0.3;
}

export function resetIntroTimer() {
  introTimer = 0;
}

export function startTransition(cb) {
  transitionPhase = 'out';
  transitionTimer = 0;
  transitionCallback = cb;
}

export function updateTransition(dt) {
  if (transitionPhase === 'none') return;
  transitionTimer += dt;
  if (transitionPhase === 'out') {
    transitionAlpha = Math.min(1, transitionTimer / TRANSITION_DURATION);
    if (transitionTimer >= TRANSITION_DURATION) {
      if (transitionCallback) transitionCallback();
      transitionCallback = null;
      transitionPhase = 'in';
      transitionTimer = 0;
    }
  } else if (transitionPhase === 'in') {
    transitionAlpha = 1 - Math.min(1, transitionTimer / TRANSITION_DURATION);
    if (transitionTimer >= TRANSITION_DURATION) {
      transitionPhase = 'none';
      transitionAlpha = 0;
    }
  }
}

export function drawTransition(ctx) {
  if (transitionAlpha <= 0) return;
  ctx.fillStyle = `rgba(0,0,0,${transitionAlpha})`;
  ctx.fillRect(0, 0, 800, 600);
}

export function showFlavorText(text) {
  flavorText = text;
  flavorTimer = FLAVOR_DURATION;
}

export function updateFlavorText(dt) {
  if (flavorTimer > 0) flavorTimer -= dt;
}

export function drawFlavorText(ctx) {
  if (flavorTimer <= 0 || !flavorText) return;
  const alpha = flavorTimer > 0.5 ? Math.min(1, (FLAVOR_DURATION - flavorTimer + 0.3) / 0.3) : flavorTimer / 0.5;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'italic 30px "Segoe UI", Arial, sans-serif';

  // Dark backdrop
  const displayText = '"' + flavorText + '"';
  const tw = ctx.measureText(displayText).width;
  const padX = 16, padY = 12;
  ctx.fillStyle = `rgba(0,0,0,${0.5 * alpha})`;
  ctx.beginPath();
  ctx.roundRect(400 - tw / 2 - padX, 460 - padY - 14, tw + padX * 2, padY * 2 + 14, 8);
  ctx.fill();

  ctx.fillStyle = `rgba(255,220,150,${alpha})`;
  ctx.fillText(displayText, 400, 460);
  ctx.restore();
}

// --- HUD ---

export function drawHUD(ctx, player, opp, roundTimer) {
  const W = 800;
  const barW = 250, barH = 18, barY = 16;

  // Opponent name
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(opp.name, W / 2, 20);

  // Round timer
  const timerVal = Math.max(0, Math.ceil(roundTimer || 0));
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = timerVal <= 10 ? '#ff4444' : '#ffdd44';
  if (timerVal <= 10) {
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
  }
  ctx.fillText(timerVal.toString(), W / 2, 52);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  // Player health bar (left side)
  drawBar(ctx, 20, barY + 12, barW, barH, player.health / player.maxHealth, '#22cc44', '#116622', 'P');

  // Opponent health bar (right side)
  drawBar(ctx, W - 20 - barW, barY + 12, barW, barH, opp.health / opp.maxHealth, '#dd3333', '#771818', 'O');

  // Stamina bar (below player health)
  drawBar(ctx, 20, barY + 36, barW * 0.8, 10, player.stamina / player.maxStamina, '#ddaa22', '#886611', null);

  // Star icons with glow on earned
  const starY = barY + 56;
  for (let i = 0; i < player.maxStars; i++) {
    const filled = i < player.stars;
    const isNewest = filled && i === player.stars - 1 && starEarnedTimer > 0;
    if (isNewest) {
      const glowT = starEarnedTimer / 0.3;
      const s = 1 + glowT * 0.6;
      ctx.save();
      ctx.translate(30 + i * 24, starY);
      ctx.scale(s, s);
      ctx.shadowColor = '#ffdd00';
      ctx.shadowBlur = 15 * glowT;
      drawStarIcon(ctx, 0, 0, 8, true);
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      drawStarIcon(ctx, 30 + i * 24, starY, 8, filled);
    }
  }

  // Knockdown indicators
  ctx.font = '11px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#aaa';
  ctx.fillText(`KD: ${player.knockdowns}/3`, 20, barY + 78);

  ctx.textAlign = 'right';
  ctx.fillText(`KD: ${opp.knockdowns}/3`, W - 20, barY + 48);
  ctx.textAlign = 'left';
}

function drawBar(ctx, x, y, w, h, pct, fillColor, bgColor, label) {
  pct = Math.max(0, Math.min(1, pct));

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);

  // Fill
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, fillColor);
  grad.addColorStop(1, darkenHex(fillColor, 40));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w * pct, h);

  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x, y, w * pct, h / 3);

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function drawStarIcon(ctx, x, y, size, filled) {
  ctx.fillStyle = filled ? '#ffdd00' : 'rgba(100,100,100,0.5)';
  ctx.strokeStyle = filled ? '#ffaa00' : 'rgba(80,80,80,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerA = (i * 2 * Math.PI / 5) - Math.PI / 2;
    const innerA = outerA + Math.PI / 5;
    ctx.lineTo(x + Math.cos(outerA) * size, y + Math.sin(outerA) * size);
    ctx.lineTo(x + Math.cos(innerA) * size * 0.4, y + Math.sin(innerA) * size * 0.4);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (filled) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.2, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- TITLE SCREEN ---

export function drawTitleScreen(ctx) {
  const W = 800, H = 600;

  // Dark background
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  // Animated spotlight that slowly moves
  const spotX = W / 2 + Math.sin(uiTime * 0.4) * 60;
  const spotY = H * 0.35 + Math.cos(uiTime * 0.3) * 20;
  const spot = ctx.createRadialGradient(spotX, spotY, 30, spotX, spotY, 350);
  spot.addColorStop(0, 'rgba(70,55,90,0.45)');
  spot.addColorStop(0.5, 'rgba(30,25,50,0.2)');
  spot.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, W, H);

  // Animated ring ropes that sway
  ctx.strokeStyle = 'rgba(200,180,160,0.15)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const sway = Math.sin(uiTime * 0.8 + i * 0.5) * 6;
    ctx.beginPath();
    ctx.moveTo(0, 350 + i * 30);
    ctx.quadraticCurveTo(400, 340 + i * 30 + sway, 800, 350 + i * 30);
    ctx.stroke();
  }

  // Crowd silhouettes at bottom
  ctx.fillStyle = 'rgba(20,20,35,0.8)';
  for (let i = 0; i < 30; i++) {
    const cx = i * 28 + 10;
    const cy = 430 + Math.sin(i * 2.3) * 8 + Math.sin(uiTime * 1.5 + i) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 7, cy, 14, 15);
  }

  // Punch-in title effect: scale from large to normal over first ~1 second
  ctx.save();
  ctx.textAlign = 'center';

  const introScale = uiTime < 1.0 ? 1 + (1 - uiTime) * 1.5 : 1.0;
  const introAlpha = Math.min(1, uiTime / 0.5);

  ctx.save();
  ctx.translate(W / 2, 200);
  ctx.scale(introScale, introScale);
  ctx.globalAlpha = introAlpha;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = 'bold 58px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CORPORATE KNOCKOUT', 3, 3);

  // Main title
  const titleGrad = ctx.createLinearGradient(-250, -40, -250, 20);
  titleGrad.addColorStop(0, '#fff');
  titleGrad.addColorStop(0.5, '#ffdd88');
  titleGrad.addColorStop(1, '#cc8833');
  ctx.fillStyle = titleGrad;
  ctx.fillText('CORPORATE KNOCKOUT', 0, 0);

  ctx.restore();

  // Subtitle
  ctx.font = '22px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#8888aa';
  ctx.fillText('Fight Your Way to the Top', W / 2, 245);

  // Art style selector (above ENTER prompt for prominence)
  const styleName = getStyle().toUpperCase();
  const arrowPulse = 0.4 + 0.6 * Math.abs(Math.sin(uiTime * 4));
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#fff';
  const arrowL = '\u25C4';
  const arrowR = '\u25BA';
  const labelText = '  ' + styleName + '  ';
  // Draw arrows with pulsing opacity
  ctx.save();
  ctx.globalAlpha = arrowPulse;
  ctx.fillText(arrowL, W / 2 - ctx.measureText(labelText).width / 2 - 18, 370);
  ctx.fillText(arrowR, W / 2 + ctx.measureText(labelText).width / 2 + 6, 370);
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.fillText(labelText, W / 2, 370);
  // Colored underline
  const underColor = getStyle() === 'anime' ? '#4488ff' : '#888';
  const nameW = ctx.measureText(labelText).width;
  ctx.strokeStyle = underColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameW / 2, 376);
  ctx.lineTo(W / 2 + nameW / 2, 376);
  ctx.stroke();
  // Instruction
  ctx.font = '15px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(150,150,170,0.7)';
  ctx.fillText('\u2190 / \u2192 to change style', W / 2, 396);

  // Pulsing "Press ENTER to Start"
  const pulse = 0.5 + 0.5 * Math.sin(uiTime * 3);
  ctx.font = '20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = `rgba(200,200,220,${0.3 + pulse * 0.7})`;
  ctx.fillText('Press ENTER to Start', W / 2, 430);

  // Controls
  ctx.font = '14px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(180,180,200,0.7)';
  ctx.fillText('CONTROLS', W / 2, 500);

  ctx.font = '13px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(150,150,170,0.6)';
  ctx.fillText('Z = Left Punch   |   X = Right Punch   |   SPACE = Star Special', W / 2, 525);
  ctx.fillText('\u2190 = Dodge Left   |   \u2192 = Dodge Right   |   \u2193 = Block', W / 2, 545);

  ctx.restore();
}

// --- INTRO SCREEN ---

export function drawIntroScreen(ctx, opp) {
  const W = 800, H = 600;

  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  const tint = ctx.createRadialGradient(300, 300, 50, 300, 300, 350);
  tint.addColorStop(0, hexToRGBA(opp.color, 0.15));
  tint.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);

  // Slide-in animation
  const slideIn = Math.min(1, introTimer * 2.5);
  const slideX = -100 * (1 - easeOutBack(slideIn));

  // Draw portrait based on opponent name
  ctx.save();
  ctx.translate(slideX, 0);
  drawAnimePortrait(ctx, 80, 100, 250, 360, opp);
  ctx.restore();

  // VS badge with animated glow
  ctx.save();
  ctx.textAlign = 'center';
  const vsPulse = 0.7 + 0.3 * Math.sin(uiTime * 4);
  ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ff4444';
  ctx.shadowColor = `rgba(255,0,0,${vsPulse})`;
  ctx.shadowBlur = 25;
  ctx.fillText('VS', 400, 310);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Name and title
  ctx.save();
  ctx.textAlign = 'left';

  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(opp.name, 440, 200);

  ctx.font = 'italic 20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#aaaacc';
  ctx.fillText(opp.title, 440, 235);

  ctx.font = '16px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#8888aa';
  wrapText(ctx, opp.taunt, 440, 290, 300, 22);

  ctx.restore();

  const pulse = 0.5 + 0.5 * Math.sin(uiTime * 3);
  ctx.textAlign = 'center';
  ctx.font = '20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = `rgba(200,200,220,${0.3 + pulse * 0.7})`;
  ctx.fillText('Press ENTER to Fight', 400, 530);
  ctx.textAlign = 'left';
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// --- ANIME PORTRAITS ---

function drawAnimePortrait(ctx, x, y, w, h, opp) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Background gradient
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, darkenHex(opp.color, 30));
  bg.addColorStop(1, darkenHex(opp.color, 80));
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  // Spotlight in portrait
  const pSpot = ctx.createRadialGradient(x + w / 2, y + h * 0.35, 20, x + w / 2, y + h * 0.35, 180);
  pSpot.addColorStop(0, 'rgba(255,255,255,0.08)');
  pSpot.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = pSpot;
  ctx.fillRect(x, y, w, h);

  const cx = x + w / 2;
  const cy = y + h * 0.4;

  if (opp.name === 'The Intern') {
    drawInternPortrait(ctx, cx, cy);
  } else if (opp.name === 'Middle Manager') {
    drawManagerPortrait(ctx, cx, cy);
  } else if (opp.name === 'The CEO') {
    drawCEOPortrait(ctx, cx, cy);
  }

  // Portrait border
  ctx.strokeStyle = opp.color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  // Inner glow border
  ctx.strokeStyle = `rgba(255,255,255,0.1)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  ctx.restore();
}

function drawInternPortrait(ctx, cx, cy) {
  // Body - slightly too big blue suit
  const suitGrad = ctx.createLinearGradient(cx - 60, cy + 30, cx + 60, cy + 150);
  suitGrad.addColorStop(0, '#5a9ae9');
  suitGrad.addColorStop(0.5, '#4a90d9');
  suitGrad.addColorStop(1, '#3870b0');
  ctx.fillStyle = suitGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 65, cy + 40);
  ctx.quadraticCurveTo(cx - 70, cy + 100, cx - 60, cy + 200);
  ctx.lineTo(cx + 60, cy + 200);
  ctx.quadraticCurveTo(cx + 70, cy + 100, cx + 65, cy + 40);
  ctx.closePath();
  ctx.fill();

  // Wrinkle lines on suit
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy + 60);
  ctx.quadraticCurveTo(cx - 25, cy + 90, cx - 35, cy + 120);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 25, cy + 55);
  ctx.quadraticCurveTo(cx + 30, cy + 85, cx + 20, cy + 115);
  ctx.stroke();

  // Lapels
  ctx.strokeStyle = '#3060a0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 30);
  ctx.lineTo(cx - 25, cy + 90);
  ctx.moveTo(cx + 12, cy + 30);
  ctx.lineTo(cx + 25, cy + 90);
  ctx.stroke();

  // Shirt
  ctx.fillStyle = '#f0ece5';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 30);
  ctx.lineTo(cx - 10, cy + 100);
  ctx.lineTo(cx + 10, cy + 100);
  ctx.lineTo(cx + 14, cy + 30);
  ctx.closePath();
  ctx.fill();

  // Tie (red, slightly crooked)
  ctx.save();
  ctx.translate(cx, cy + 60);
  ctx.rotate(0.08);
  ctx.fillStyle = '#cc3333';
  ctx.beginPath();
  ctx.moveTo(-4, -28);
  ctx.lineTo(4, -28);
  ctx.lineTo(6, 30);
  ctx.lineTo(0, 38);
  ctx.lineTo(-6, 30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Neck
  const neckGrad = ctx.createLinearGradient(cx - 12, cy + 10, cx + 12, cy + 10);
  neckGrad.addColorStop(0, '#e8c8a0');
  neckGrad.addColorStop(0.5, '#f5ddc0');
  neckGrad.addColorStop(1, '#e8c8a0');
  ctx.fillStyle = neckGrad;
  ctx.fillRect(cx - 12, cy + 10, 24, 28);

  // Head
  const skinGrad = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy - 25, 55);
  skinGrad.addColorStop(0, '#fce8d0');
  skinGrad.addColorStop(1, '#e8c8a0');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 36, cy - 10);
  ctx.quadraticCurveTo(cx - 40, cy - 40, cx - 28, cy - 55);
  ctx.quadraticCurveTo(cx, cy - 68, cx + 28, cy - 55);
  ctx.quadraticCurveTo(cx + 40, cy - 40, cx + 36, cy - 10);
  ctx.quadraticCurveTo(cx + 34, cy + 12, cx + 20, cy + 20);
  ctx.quadraticCurveTo(cx, cy + 28, cx - 20, cy + 20);
  ctx.quadraticCurveTo(cx - 34, cy + 12, cx - 36, cy - 10);
  ctx.closePath();
  ctx.fill();

  // Messy brown hair
  ctx.fillStyle = '#6b4226';
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy - 15);
  ctx.quadraticCurveTo(cx - 42, cy - 45, cx - 28, cy - 60);
  ctx.quadraticCurveTo(cx - 10, cy - 72, cx + 5, cy - 68);
  ctx.quadraticCurveTo(cx + 20, cy - 72, cx + 30, cy - 58);
  ctx.quadraticCurveTo(cx + 42, cy - 42, cx + 38, cy - 12);
  ctx.quadraticCurveTo(cx + 35, cy - 30, cx + 25, cy - 38);
  ctx.quadraticCurveTo(cx + 10, cy - 48, cx - 5, cy - 45);
  ctx.quadraticCurveTo(cx - 20, cy - 48, cx - 30, cy - 35);
  ctx.closePath();
  ctx.fill();

  // Messy hair spikes
  ctx.fillStyle = '#7b5236';
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy - 62);
  ctx.lineTo(cx - 8, cy - 75);
  ctx.lineTo(cx - 3, cy - 60);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy - 60);
  ctx.lineTo(cx + 18, cy - 78);
  ctx.lineTo(cx + 22, cy - 58);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 25, cy - 50);
  ctx.lineTo(cx - 35, cy - 65);
  ctx.lineTo(cx - 22, cy - 55);
  ctx.closePath();
  ctx.fill();

  // Big nervous anime eyes
  drawPortraitEye(ctx, cx - 15, cy - 20, 12, 14, '#4488cc', true);
  drawPortraitEye(ctx, cx + 15, cy - 20, 12, 14, '#4488cc', true);

  // Nervous eyebrows (raised, worried)
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 25, cy - 40);
  ctx.quadraticCurveTo(cx - 15, cy - 44, cx - 5, cy - 38);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 25, cy - 40);
  ctx.quadraticCurveTo(cx + 15, cy - 44, cx + 5, cy - 38);
  ctx.stroke();

  // Nose
  ctx.strokeStyle = '#d4a880';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.quadraticCurveTo(cx + 4, cy, cx, cy + 4);
  ctx.stroke();

  // Nervous mouth (small wobbly)
  ctx.strokeStyle = '#c07060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 12);
  ctx.quadraticCurveTo(cx - 3, cy + 14, cx, cy + 11);
  ctx.quadraticCurveTo(cx + 3, cy + 14, cx + 8, cy + 12);
  ctx.stroke();

  // Sweat drops
  ctx.fillStyle = 'rgba(150,200,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(cx + 32, cy - 25);
  ctx.quadraticCurveTo(cx + 35, cy - 18, cx + 32, cy - 12);
  ctx.quadraticCurveTo(cx + 29, cy - 18, cx + 32, cy - 25);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 33, cy - 10);
  ctx.quadraticCurveTo(cx - 30, cy - 4, cx - 33, cy + 2);
  ctx.quadraticCurveTo(cx - 36, cy - 4, cx - 33, cy - 10);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#ecc8a8';
  ctx.beginPath();
  ctx.ellipse(cx - 37, cy - 8, 6, 10, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 37, cy - 8, 6, 10, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Oversized boxing gloves
  drawPortraitGlove(ctx, cx - 70, cy + 100, 1.3, true);
  drawPortraitGlove(ctx, cx + 70, cy + 100, 1.3, false);
}

function drawManagerPortrait(ctx, cx, cy) {
  // Body - perfectly fitted gray suit
  const suitGrad = ctx.createLinearGradient(cx - 55, cy + 30, cx + 55, cy + 150);
  suitGrad.addColorStop(0, '#8b8b8b');
  suitGrad.addColorStop(0.5, '#7b7b7b');
  suitGrad.addColorStop(1, '#5a5a5a');
  ctx.fillStyle = suitGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 55, cy + 35);
  ctx.quadraticCurveTo(cx - 58, cy + 90, cx - 52, cy + 200);
  ctx.lineTo(cx + 52, cy + 200);
  ctx.quadraticCurveTo(cx + 58, cy + 90, cx + 55, cy + 35);
  ctx.closePath();
  ctx.fill();

  // Sharp lapels
  ctx.strokeStyle = '#505050';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 28);
  ctx.lineTo(cx - 28, cy + 95);
  ctx.moveTo(cx + 14, cy + 28);
  ctx.lineTo(cx + 28, cy + 95);
  ctx.stroke();

  // Shirt
  ctx.fillStyle = '#f0ece5';
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 28);
  ctx.lineTo(cx - 12, cy + 100);
  ctx.lineTo(cx + 12, cy + 100);
  ctx.lineTo(cx + 16, cy + 28);
  ctx.closePath();
  ctx.fill();

  // Tie (power red, perfectly straight)
  ctx.fillStyle = '#bb2222';
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 25);
  ctx.lineTo(cx + 5, cy + 25);
  ctx.lineTo(cx + 7, cy + 90);
  ctx.lineTo(cx, cy + 98);
  ctx.lineTo(cx - 7, cy + 90);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#dd3333';
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + 22);
  ctx.lineTo(cx + 6, cy + 22);
  ctx.lineTo(cx + 4, cy + 30);
  ctx.lineTo(cx - 4, cy + 30);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.fillStyle = '#f0d0b0';
  ctx.fillRect(cx - 12, cy + 8, 24, 28);

  // Head
  const skinGrad = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy - 25, 55);
  skinGrad.addColorStop(0, '#f5ddc0');
  skinGrad.addColorStop(1, '#e0c0a0');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy - 8);
  ctx.quadraticCurveTo(cx - 38, cy - 35, cx - 25, cy - 52);
  ctx.quadraticCurveTo(cx, cy - 62, cx + 25, cy - 52);
  ctx.quadraticCurveTo(cx + 38, cy - 35, cx + 34, cy - 8);
  ctx.quadraticCurveTo(cx + 32, cy + 12, cx + 18, cy + 18);
  ctx.quadraticCurveTo(cx, cy + 24, cx - 18, cy + 18);
  ctx.quadraticCurveTo(cx - 32, cy + 12, cx - 34, cy - 8);
  ctx.closePath();
  ctx.fill();

  // Slicked back dark hair
  ctx.fillStyle = '#2a2015';
  ctx.beginPath();
  ctx.moveTo(cx - 36, cy - 12);
  ctx.quadraticCurveTo(cx - 40, cy - 42, cx - 26, cy - 56);
  ctx.quadraticCurveTo(cx, cy - 66, cx + 26, cy - 56);
  ctx.quadraticCurveTo(cx + 40, cy - 42, cx + 36, cy - 12);
  ctx.quadraticCurveTo(cx + 34, cy - 28, cx + 22, cy - 36);
  ctx.quadraticCurveTo(cx, cy - 48, cx - 22, cy - 36);
  ctx.quadraticCurveTo(cx - 34, cy - 28, cx - 36, cy - 12);
  ctx.closePath();
  ctx.fill();
  // Hair sheen
  const sheen = ctx.createLinearGradient(cx - 20, cy - 55, cx + 20, cy - 40);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy - 50);
  ctx.quadraticCurveTo(cx, cy - 58, cx + 20, cy - 50);
  ctx.quadraticCurveTo(cx, cy - 42, cx - 20, cy - 50);
  ctx.fill();

  // Rectangular glasses
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(cx - 25, cy - 28, 18, 14);
  ctx.rect(cx + 7, cy - 28, 18, 14);
  ctx.stroke();
  // Bridge
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 22);
  ctx.lineTo(cx + 7, cy - 22);
  ctx.stroke();
  // Lens glare
  ctx.fillStyle = 'rgba(200,220,255,0.15)';
  ctx.fillRect(cx - 23, cy - 26, 14, 10);
  ctx.fillRect(cx + 9, cy - 26, 14, 10);

  // Eyes behind glasses (stern)
  drawPortraitEye(ctx, cx - 16, cy - 20, 8, 10, '#5a4030', false);
  drawPortraitEye(ctx, cx + 16, cy - 20, 8, 10, '#5a4030', false);

  // Stern eyebrows (angled down toward center)
  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 27, cy - 34);
  ctx.lineTo(cx - 8, cy - 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 27, cy - 34);
  ctx.lineTo(cx + 8, cy - 30);
  ctx.stroke();

  // Nose
  ctx.strokeStyle = '#d0a080';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.quadraticCurveTo(cx + 5, cy + 2, cx, cy + 5);
  ctx.stroke();

  // Condescending smirk
  ctx.strokeStyle = '#b06050';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 10);
  ctx.quadraticCurveTo(cx, cy + 8, cx + 12, cy + 14);
  ctx.stroke();

  // Ears
  ctx.fillStyle = '#e8c0a0';
  ctx.beginPath();
  ctx.ellipse(cx - 35, cy - 8, 6, 10, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 35, cy - 8, 6, 10, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Coffee mug in left hand
  ctx.save();
  ctx.translate(cx - 65, cy + 95);
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(-10, -16, 20, 24);
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(-8, -12, 16, 18);
  ctx.strokeStyle = '#e8e0d0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(12, 0, 7, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // Steam
  ctx.strokeStyle = 'rgba(200,200,200,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-5 + i * 5, -18);
    ctx.quadraticCurveTo(-5 + i * 5 + 3, -26, -5 + i * 5 - 2, -32);
    ctx.stroke();
  }
  ctx.restore();

  // Glove on right
  drawPortraitGlove(ctx, cx + 65, cy + 110, 1.0, false);
}

function drawCEOPortrait(ctx, cx, cy) {
  // Body - impeccable dark navy suit
  const suitGrad = ctx.createLinearGradient(cx - 55, cy + 30, cx + 55, cy + 150);
  suitGrad.addColorStop(0, '#2a2a4e');
  suitGrad.addColorStop(0.5, '#1a1a2e');
  suitGrad.addColorStop(1, '#0e0e1e');
  ctx.fillStyle = suitGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 55, cy + 35);
  ctx.quadraticCurveTo(cx - 56, cy + 90, cx - 50, cy + 200);
  ctx.lineTo(cx + 50, cy + 200);
  ctx.quadraticCurveTo(cx + 56, cy + 90, cx + 55, cy + 35);
  ctx.closePath();
  ctx.fill();

  // Suit fabric sheen
  const fabricSheen = ctx.createLinearGradient(cx - 30, cy + 40, cx + 30, cy + 120);
  fabricSheen.addColorStop(0, 'rgba(255,255,255,0)');
  fabricSheen.addColorStop(0.3, 'rgba(255,255,255,0.05)');
  fabricSheen.addColorStop(0.6, 'rgba(255,255,255,0)');
  ctx.fillStyle = fabricSheen;
  ctx.fillRect(cx - 55, cy + 35, 110, 165);

  // Sharp lapels
  ctx.strokeStyle = '#0a0a18';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 28);
  ctx.lineTo(cx - 30, cy + 100);
  ctx.moveTo(cx + 14, cy + 28);
  ctx.lineTo(cx + 30, cy + 100);
  ctx.stroke();

  // Shirt
  ctx.fillStyle = '#f5f0e8';
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 28);
  ctx.lineTo(cx - 12, cy + 105);
  ctx.lineTo(cx + 12, cy + 105);
  ctx.lineTo(cx + 16, cy + 28);
  ctx.closePath();
  ctx.fill();

  // Tie (dark silk)
  const tieGrad = ctx.createLinearGradient(cx - 6, cy + 25, cx + 6, cy + 95);
  tieGrad.addColorStop(0, '#1a1a3a');
  tieGrad.addColorStop(0.5, '#2a2a4a');
  tieGrad.addColorStop(1, '#1a1a3a');
  ctx.fillStyle = tieGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 25);
  ctx.lineTo(cx + 5, cy + 25);
  ctx.lineTo(cx + 6, cy + 90);
  ctx.lineTo(cx, cy + 98);
  ctx.lineTo(cx - 6, cy + 90);
  ctx.closePath();
  ctx.fill();

  // Gold cufflinks
  ctx.fillStyle = '#daa520';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(cx - 50, cy + 85, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 50, cy + 85, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Neck
  ctx.fillStyle = '#ecc8a8';
  ctx.fillRect(cx - 12, cy + 8, 24, 28);

  // Head - sharp angular features
  const skinGrad = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy - 25, 55);
  skinGrad.addColorStop(0, '#f0d8c0');
  skinGrad.addColorStop(1, '#d8b898');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 32, cy - 8);
  ctx.quadraticCurveTo(cx - 36, cy - 32, cx - 24, cy - 52);
  ctx.quadraticCurveTo(cx, cy - 64, cx + 24, cy - 52);
  ctx.quadraticCurveTo(cx + 36, cy - 32, cx + 32, cy - 8);
  ctx.quadraticCurveTo(cx + 28, cy + 10, cx + 16, cy + 16);
  ctx.lineTo(cx, cy + 22); // sharp chin
  ctx.lineTo(cx - 16, cy + 16);
  ctx.quadraticCurveTo(cx - 28, cy + 10, cx - 32, cy - 8);
  ctx.closePath();
  ctx.fill();

  // Silver-streaked perfectly styled hair
  const hairGrad = ctx.createLinearGradient(cx - 30, cy - 58, cx + 30, cy - 40);
  hairGrad.addColorStop(0, '#2a2a2a');
  hairGrad.addColorStop(0.3, '#555');
  hairGrad.addColorStop(0.5, '#3a3a3a');
  hairGrad.addColorStop(0.7, '#666');
  hairGrad.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy - 12);
  ctx.quadraticCurveTo(cx - 38, cy - 40, cx - 24, cy - 56);
  ctx.quadraticCurveTo(cx, cy - 66, cx + 24, cy - 56);
  ctx.quadraticCurveTo(cx + 38, cy - 40, cx + 34, cy - 12);
  ctx.quadraticCurveTo(cx + 32, cy - 28, cx + 20, cy - 38);
  ctx.quadraticCurveTo(cx, cy - 48, cx - 20, cy - 38);
  ctx.quadraticCurveTo(cx - 32, cy - 28, cx - 34, cy - 12);
  ctx.closePath();
  ctx.fill();

  // Hair sheen
  const hSheen = ctx.createLinearGradient(cx - 15, cy - 58, cx + 15, cy - 42);
  hSheen.addColorStop(0, 'rgba(255,255,255,0)');
  hSheen.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  hSheen.addColorStop(0.6, 'rgba(255,255,255,0.2)');
  hSheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hSheen;
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 50);
  ctx.quadraticCurveTo(cx, cy - 58, cx + 18, cy - 50);
  ctx.quadraticCurveTo(cx, cy - 44, cx - 18, cy - 50);
  ctx.fill();

  // Cold piercing eyes
  drawPortraitEye(ctx, cx - 15, cy - 18, 9, 11, '#4a6888', false);
  drawPortraitEye(ctx, cx + 15, cy - 18, 9, 11, '#4a6888', false);

  // Slightly narrowed eyelids
  ctx.fillStyle = '#f0d8c0';
  ctx.beginPath();
  ctx.ellipse(cx - 15, cy - 22, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 15, cy - 22, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Strong eyebrows
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy - 32);
  ctx.lineTo(cx - 6, cy - 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 26, cy - 32);
  ctx.lineTo(cx + 6, cy - 30);
  ctx.stroke();

  // Sharp nose
  ctx.strokeStyle = '#c8a080';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx + 3, cy + 4);
  ctx.lineTo(cx, cy + 6);
  ctx.stroke();

  // Barely any expression - thin straight line mouth
  ctx.strokeStyle = '#a07060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 12);
  ctx.lineTo(cx + 10, cy + 12);
  ctx.stroke();

  // Ears
  ctx.fillStyle = '#e0c0a0';
  ctx.beginPath();
  ctx.ellipse(cx - 33, cy - 8, 5, 9, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 33, cy - 8, 5, 9, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Arms at sides (barely visible, just gloves)
  drawPortraitGlove(ctx, cx - 60, cy + 120, 1.0, true);
  drawPortraitGlove(ctx, cx + 60, cy + 120, 1.0, false);
}

function drawPortraitEye(ctx, x, y, w, h, irisColor, wide) {
  const scaleH = wide ? 1.2 : 1.0;
  // White
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x, y, w, h * scaleH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iris
  const irisGrad = ctx.createRadialGradient(x, y + 1, 2, x, y, w * 0.85);
  irisGrad.addColorStop(0, lightenHex(irisColor, 30));
  irisGrad.addColorStop(0.6, irisColor);
  irisGrad.addColorStop(1, darkenHex(irisColor, 40));
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, w * 0.75, h * 0.8 * scaleH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#080810';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, w * 0.35, h * 0.4 * scaleH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Anime highlights
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.2, y - h * 0.2, w * 0.25, h * 0.2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - w * 0.15, y + h * 0.25, w * 0.12, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Upper eyelid line
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h * scaleH, 0, Math.PI + 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
}

function drawPortraitGlove(ctx, x, y, scale, isLeft) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (isLeft ? 1 : -1), scale);

  const gloveGrad = ctx.createRadialGradient(0, 0, 5, 0, -5, 30);
  gloveGrad.addColorStop(0, '#e63030');
  gloveGrad.addColorStop(0.6, '#c41818');
  gloveGrad.addColorStop(1, '#8a0f0f');
  ctx.fillStyle = gloveGrad;

  ctx.beginPath();
  ctx.moveTo(-22, -8);
  ctx.quadraticCurveTo(-26, -20, -16, -24);
  ctx.quadraticCurveTo(0, -28, 16, -22);
  ctx.quadraticCurveTo(26, -16, 24, 0);
  ctx.quadraticCurveTo(22, 14, 8, 18);
  ctx.quadraticCurveTo(-4, 20, -16, 14);
  ctx.quadraticCurveTo(-24, 8, -22, -8);
  ctx.closePath();
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(-4, -14, 12, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Lacing
  ctx.strokeStyle = '#f5e8d0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 12);
  ctx.quadraticCurveTo(0, 16, 10, 12);
  ctx.stroke();

  ctx.restore();
}

function lightenHex(hex, amount) {
  if (!hex.startsWith('#')) return hex;
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// --- RESULT SCREEN ---

export function drawResultScreen(ctx, won, opp, player) {
  const W = 800, H = 600;

  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  // Star burst / confetti particles on win
  if (won) {
    for (let i = 0; i < 25; i++) {
      const px = (Math.sin(i * 5.7 + uiTime * 0.6) * 0.5 + 0.5) * W;
      const py = ((i * 41 + uiTime * 50) % (H + 20)) - 10;
      const colors = ['#ff4444', '#44ff44', '#ffff44', '#ff44ff', '#44ffff', '#ffaa22'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.7;
      ctx.fillRect(px, py, 5, 3);
    }
    ctx.globalAlpha = 1;
  }

  ctx.save();
  ctx.textAlign = 'center';

  // KO text
  ctx.font = 'bold 90px "Segoe UI", Arial, sans-serif';
  const koGrad = ctx.createLinearGradient(0, 200, 0, 300);
  if (won) {
    koGrad.addColorStop(0, '#ffdd44');
    koGrad.addColorStop(1, '#ff8800');
  } else {
    koGrad.addColorStop(0, '#ff4444');
    koGrad.addColorStop(1, '#880000');
  }
  ctx.fillStyle = koGrad;
  ctx.shadowColor = won ? '#ffaa00' : '#ff0000';
  ctx.shadowBlur = 30;
  ctx.fillText('KO!', W / 2, 220);
  ctx.shadowBlur = 0;

  // Opponent name in result
  if (opp) {
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = won ? '#ffdd88' : '#cc8888';
    ctx.fillText(
      won ? `${opp.name} has been knocked out!` : `${opp.name} wins...`,
      W / 2, 280
    );
  }

  // Win/lose text
  ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = won ? '#44dd66' : '#dd4444';
  ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE...', W / 2, 340);

  // Fight stats
  if (player) {
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#8888aa';
    const kdText = player.knockdowns === 0
      ? 'Flawless - no knockdowns taken!'
      : `Knockdowns taken: ${player.knockdowns}`;
    ctx.fillText(kdText, W / 2, 380);
  }

  // Continue
  const pulse = 0.5 + 0.5 * Math.sin(uiTime * 3);
  ctx.font = '20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = `rgba(200,200,220,${0.3 + pulse * 0.7})`;
  ctx.fillText('Press ENTER to Continue', W / 2, 450);

  ctx.restore();
}

// --- GAME OVER SCREEN ---

export function drawGameOverScreen(ctx, won) {
  const W = 800, H = 600;

  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = 'center';

  if (won) {
    // Victory spotlight
    const spot = ctx.createRadialGradient(W / 2, 250, 30, W / 2, 250, 300);
    spot.addColorStop(0, 'rgba(255,220,80,0.15)');
    spot.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, W, H);

    ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif';
    const grad = ctx.createLinearGradient(0, 180, 0, 240);
    grad.addColorStop(0, '#ffee66');
    grad.addColorStop(1, '#ffaa22');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 20;
    ctx.fillText("YOU'RE THE NEW CEO!", W / 2, 220);
    ctx.shadowBlur = 0;

    ctx.font = '22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText('Corner office unlocked. Synergy achieved.', W / 2, 280);

    // Confetti-like particles
    for (let i = 0; i < 30; i++) {
      const px = (Math.sin(i * 7.3 + uiTime * 0.5) * 0.5 + 0.5) * W;
      const py = ((i * 37 + uiTime * 60) % (H + 20)) - 10;
      const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(px, py, 6, 4);
    }
  } else {
    ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#cc3333';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', W / 2, 240);
    ctx.shadowBlur = 0;

    ctx.font = '20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('Back to the mail room...', W / 2, 300);
  }

  const pulse = 0.5 + 0.5 * Math.sin(uiTime * 3);
  ctx.font = '20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = `rgba(200,200,220,${0.3 + pulse * 0.7})`;
  ctx.fillText(won ? 'Press ENTER to Play Again' : 'Press ENTER to Retry', W / 2, 440);

  ctx.restore();
}

// --- KNOCKDOWN COUNT ---

export function drawKnockdownCount(ctx, count, isPlayer) {
  const W = 800, H = 600;
  ctx.save();
  ctx.textAlign = 'center';

  // Big number
  ctx.font = 'bold 120px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 30;
  ctx.fillText(Math.min(10, Math.floor(count)).toString(), W / 2, H / 2 - 20);
  ctx.shadowBlur = 0;

  if (isPlayer) {
    const pulse = 0.5 + 0.5 * Math.sin(uiTime * 8);
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = `rgba(255,100,100,${0.5 + pulse * 0.5})`;
    ctx.fillText('MASH Z AND X!', W / 2, H / 2 + 50);
  } else {
    ctx.font = '24px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('KNOCKDOWN!', W / 2, H / 2 + 50);
  }

  ctx.restore();
}

// --- HELPERS ---

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, cy);
      line = word + ' ';
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, cy);
}

function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darkenHex(hex, amount) {
  if (hex.startsWith('rgb')) return hex;
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r},${g},${b})`;
}
