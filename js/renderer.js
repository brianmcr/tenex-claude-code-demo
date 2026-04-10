import { getStyle } from './artStyle.js';

let gameTime = 0;
let hitEffects = [];
let hitFlashTimer = 0;
let comicTexts = [];
const COMIC_WORDS = ['POW!', 'WHAM!', 'BAM!', 'CRACK!', 'SMACK!', 'THWACK!'];

export function updateRendererTime(dt) {
  gameTime += dt;
  if (hitFlashTimer > 0) hitFlashTimer -= dt;
  hitEffects = hitEffects.filter(e => {
    e.life -= dt;
    return e.life > 0;
  });
  comicTexts = comicTexts.filter(e => {
    e.life -= dt;
    return e.life > 0;
  });
}

export function addHitEffect(x, y) {
  hitEffects.push({ x, y, life: 0.3, maxLife: 0.3 });
  hitFlashTimer = 0.05;
}

export function drawHitFlash(ctx) {
  if (hitFlashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${hitFlashTimer / 0.05 * 0.25})`;
    ctx.fillRect(0, 0, 800, 600);
  }
}

// --- RING ---

export function drawRing(ctx) {
  if (getStyle() === 'anime') {
    drawRingAnime(ctx);
  } else {
    drawRingClassic(ctx);
  }
}

function drawRingAnime(ctx) {
  const W = 800, H = 600;

  // Deep dark background
  const crowdGrad = ctx.createLinearGradient(0, 0, 0, 280);
  crowdGrad.addColorStop(0, '#050510');
  crowdGrad.addColorStop(1, '#0e0e1e');
  ctx.fillStyle = crowdGrad;
  ctx.fillRect(0, 0, W, 280);

  // Crowd row 3 (far back) - darker, smaller
  ctx.fillStyle = '#08080f';
  for (let i = 0; i < 45; i++) {
    const cx = i * 19 + 3 + Math.sin(i * 4.1) * 5;
    const cy = 195 + Math.sin(i * 1.5) * 6 + Math.sin(gameTime * 0.8 + i * 0.5) * 1;
    const r = 6 + Math.sin(i * 1.7) * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy - r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - r * 0.5, cy - r, r * 1.0, r * 1.3);
  }

  // Crowd row 2 (middle)
  ctx.fillStyle = '#0b0b16';
  for (let i = 0; i < 38; i++) {
    const cx = i * 23 + 10 + Math.sin(i * 2.9) * 6;
    const cy = 215 + Math.sin(i * 1.8) * 8 + Math.sin(gameTime * 1.1 + i * 0.7) * 1.5;
    const r = 7 + Math.sin(i * 1.1) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy - r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - r * 0.5, cy - r, r * 1.0, r * 1.5);
    // Anime eye glints - occasional bright dots
    if (i % 5 === 0) {
      const glintPhase = Math.sin(gameTime * 2 + i * 1.3);
      if (glintPhase > 0.3) {
        ctx.fillStyle = `rgba(255,255,255,${glintPhase * 0.5})`;
        ctx.beginPath();
        ctx.arc(cx - 2, cy - r * 1.6, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, cy - r * 1.6, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b0b16';
      }
    }
  }

  // Crowd row 1 (front) - larger, more detail
  ctx.fillStyle = '#10101c';
  for (let i = 0; i < 42; i++) {
    const cx = i * 21 + 5 + Math.sin(i * 3.7) * 4;
    const cy = 235 + Math.sin(i * 2.1) * 10 + Math.sin(gameTime * 1.5 + i) * 2;
    const r = 9 + Math.sin(i * 1.3) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy - r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - r * 0.6, cy - r, r * 1.2, r * 1.8);
    // Eye glints for front row
    if (i % 4 === 0) {
      const glintPhase = Math.sin(gameTime * 1.8 + i * 2.1);
      if (glintPhase > 0.2) {
        ctx.fillStyle = `rgba(200,220,255,${glintPhase * 0.6})`;
        ctx.beginPath();
        ctx.arc(cx - 2, cy - r * 1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, cy - r * 1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10101c';
      }
    }
  }

  // Ring floor - hard-edge two-tone shading
  const floorBase = '#2a2a38';
  const floorShadow = '#18182a';
  // Base floor
  ctx.fillStyle = floorBase;
  ctx.beginPath();
  ctx.moveTo(80, 250);
  ctx.lineTo(720, 250);
  ctx.lineTo(800, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Hard shadow on left side of floor
  ctx.fillStyle = floorShadow;
  ctx.beginPath();
  ctx.moveTo(80, 250);
  ctx.lineTo(400, 250);
  ctx.lineTo(400, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Floor depth lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = 280 + i * 40;
    const spread = (y - 250) / (H - 250);
    const lx = 80 - spread * 80;
    const rx = 720 + spread * 80;
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(rx, y);
    ctx.stroke();
  }

  // Center ring emblem - "CK" monogram
  ctx.save();
  ctx.translate(400, 380);
  ctx.scale(1, 0.5); // perspective squash
  // Outer ring
  ctx.strokeStyle = 'rgba(255,220,150,0.06)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, Math.PI * 2);
  ctx.stroke();
  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, 45, 0, Math.PI * 2);
  ctx.stroke();
  // Fist icon (simplified)
  ctx.fillStyle = 'rgba(255,220,150,0.05)';
  ctx.beginPath();
  ctx.moveTo(-15, -10);
  ctx.lineTo(-15, 15);
  ctx.lineTo(15, 15);
  ctx.lineTo(15, -10);
  ctx.quadraticCurveTo(15, -20, 5, -20);
  ctx.lineTo(-5, -20);
  ctx.quadraticCurveTo(-15, -20, -15, -10);
  ctx.closePath();
  ctx.fill();
  // Knuckle lines
  ctx.strokeStyle = 'rgba(255,220,150,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-10 + i * 7, -20);
    ctx.lineTo(-10 + i * 7, -14);
    ctx.stroke();
  }
  // CK text
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,220,150,0.05)';
  ctx.fillText('CK', 0, 42);
  ctx.restore();

  // Corner posts - chrome/metallic
  drawPostAnime(ctx, 95, 250, '#cc3333');
  drawPostAnime(ctx, 705, 250, '#cc3333');

  // Ropes - thicker with metallic sheen
  for (let r = 0; r < 3; r++) {
    const ropeY = 255 + r * 22;
    const sag = 4 + r * 2;
    const baseAlpha = 0.75 - r * 0.12;

    // Left rope - base
    ctx.strokeStyle = `rgba(180,160,140,${baseAlpha})`;
    ctx.lineWidth = 4 - r * 0.5;
    ctx.beginPath();
    ctx.moveTo(95, ropeY);
    ctx.quadraticCurveTo(30, ropeY + sag + 20, 0, ropeY + sag * 3);
    ctx.stroke();
    // Highlight on rope
    ctx.strokeStyle = `rgba(255,240,220,${baseAlpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(95, ropeY - 1);
    ctx.quadraticCurveTo(30, ropeY + sag + 19, 0, ropeY + sag * 3 - 1);
    ctx.stroke();

    // Right rope
    ctx.strokeStyle = `rgba(180,160,140,${baseAlpha})`;
    ctx.lineWidth = 4 - r * 0.5;
    ctx.beginPath();
    ctx.moveTo(705, ropeY);
    ctx.quadraticCurveTo(770, ropeY + sag + 20, 800, ropeY + sag * 3);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,240,220,${baseAlpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(705, ropeY - 1);
    ctx.quadraticCurveTo(770, ropeY + sag + 19, 800, ropeY + sag * 3 - 1);
    ctx.stroke();

    // Top rope across
    ctx.strokeStyle = `rgba(180,160,140,${baseAlpha})`;
    ctx.lineWidth = 4 - r * 0.5;
    ctx.beginPath();
    ctx.moveTo(95, ropeY);
    ctx.quadraticCurveTo(400, ropeY + sag, 705, ropeY);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,240,220,${baseAlpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(95, ropeY - 1);
    ctx.quadraticCurveTo(400, ropeY + sag - 1, 705, ropeY - 1);
    ctx.stroke();
  }

  // Atmospheric speed line hints (static decor, subtle)
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const innerR = 180;
    const outerR = 350 + Math.sin(i * 2.3) * 40;
    ctx.beginPath();
    ctx.moveTo(400 + Math.cos(angle) * innerR, 300 + Math.sin(angle) * innerR * 0.6);
    ctx.lineTo(400 + Math.cos(angle) * outerR, 300 + Math.sin(angle) * outerR * 0.6);
    ctx.stroke();
  }
  ctx.restore();

  // Volumetric light rays from overhead
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const rx = 300 + i * 35 + Math.sin(i * 1.7) * 15;
    const alpha = 0.02 + Math.sin(gameTime * 0.5 + i) * 0.008;
    ctx.fillStyle = `rgba(255,250,220,${Math.max(0, alpha)})`;
    ctx.beginPath();
    ctx.moveTo(rx - 3, 0);
    ctx.lineTo(rx + 3, 0);
    ctx.lineTo(rx + 20 + i * 3, H);
    ctx.lineTo(rx - 15 + i * 3, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Overhead spotlight - stronger, more dramatic
  const lightGrad = ctx.createRadialGradient(400, 0, 30, 400, 0, 420);
  lightGrad.addColorStop(0, 'rgba(255,248,220,0.18)');
  lightGrad.addColorStop(0.3, 'rgba(255,248,220,0.08)');
  lightGrad.addColorStop(0.6, 'rgba(255,248,220,0.02)');
  lightGrad.addColorStop(1, 'rgba(255,248,220,0)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, W, H);

  // Vignette edges for drama
  const vigGrad = ctx.createRadialGradient(400, 300, 200, 400, 300, 500);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, W, H);
}

function drawPostAnime(ctx, x, y, capColor) {
  // Chrome metallic gradient
  const grad = ctx.createLinearGradient(x - 7, 0, x + 7, 0);
  grad.addColorStop(0, '#555');
  grad.addColorStop(0.15, '#888');
  grad.addColorStop(0.35, '#eee');
  grad.addColorStop(0.5, '#fff');
  grad.addColorStop(0.65, '#ddd');
  grad.addColorStop(0.85, '#999');
  grad.addColorStop(1, '#666');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 6, y - 72, 12, 72);

  // Hard shadow on left half
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x - 6, y - 72, 6, 72);

  // Cap base
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.arc(x, y - 72, 10, 0, Math.PI * 2);
  ctx.fill();

  // Cap highlight
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(x - 2, y - 74, 4, 0, Math.PI * 2);
  ctx.fill();

  // Screw detail at base
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.arc(x, y - 5, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawRingClassic(ctx) {
  const W = 800, H = 600;

  // Crowd background
  const crowdGrad = ctx.createLinearGradient(0, 0, 0, 280);
  crowdGrad.addColorStop(0, '#0a0a12');
  crowdGrad.addColorStop(1, '#1a1a2a');
  ctx.fillStyle = crowdGrad;
  ctx.fillRect(0, 0, W, 280);

  // Crowd silhouettes
  ctx.fillStyle = '#12121f';
  for (let i = 0; i < 40; i++) {
    const cx = i * 22 + 5 + Math.sin(i * 3.7) * 4;
    const cy = 230 + Math.sin(i * 2.1) * 12 + Math.sin(gameTime * 1.5 + i) * 2;
    const r = 8 + Math.sin(i * 1.3) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy - r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - r * 0.6, cy - r, r * 1.2, r * 1.8);
  }
  // Second row
  ctx.fillStyle = '#0e0e1a';
  for (let i = 0; i < 35; i++) {
    const cx = i * 25 + 12 + Math.sin(i * 2.9) * 6;
    const cy = 210 + Math.sin(i * 1.8) * 8 + Math.sin(gameTime * 1.2 + i * 0.7) * 1.5;
    const r = 7 + Math.sin(i * 1.1) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy - r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - r * 0.5, cy - r, r * 1.0, r * 1.5);
  }

  // Ring floor (perspective trapezoid)
  const floorGrad = ctx.createLinearGradient(0, 250, 0, H);
  floorGrad.addColorStop(0, '#3a3a4a');
  floorGrad.addColorStop(0.3, '#2a2a38');
  floorGrad.addColorStop(1, '#1e1e2a');
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(80, 250);
  ctx.lineTo(720, 250);
  ctx.lineTo(800, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Floor lines for depth
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = 280 + i * 40;
    const spread = (y - 250) / (H - 250);
    const lx = 80 - spread * 80;
    const rx = 720 + spread * 80;
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(rx, y);
    ctx.stroke();
  }

  // Corner posts
  drawPost(ctx, 95, 250, '#cc3333');
  drawPost(ctx, 705, 250, '#cc3333');

  // Ropes
  for (let r = 0; r < 3; r++) {
    const ropeY = 255 + r * 22;
    const sag = 4 + r * 2;
    const alpha = 0.7 - r * 0.15;

    // Left rope
    ctx.strokeStyle = `rgba(200,180,160,${alpha})`;
    ctx.lineWidth = 3 - r * 0.5;
    ctx.beginPath();
    ctx.moveTo(95, ropeY);
    ctx.quadraticCurveTo(30, ropeY + sag + 20, 0, ropeY + sag * 3);
    ctx.stroke();

    // Right rope
    ctx.beginPath();
    ctx.moveTo(705, ropeY);
    ctx.quadraticCurveTo(770, ropeY + sag + 20, 800, ropeY + sag * 3);
    ctx.stroke();

    // Top rope across
    ctx.beginPath();
    ctx.moveTo(95, ropeY);
    ctx.quadraticCurveTo(400, ropeY + sag, 705, ropeY);
    ctx.stroke();
  }

  // Overhead light
  const lightGrad = ctx.createRadialGradient(400, 0, 50, 400, 0, 400);
  lightGrad.addColorStop(0, 'rgba(255,250,230,0.12)');
  lightGrad.addColorStop(0.5, 'rgba(255,250,230,0.03)');
  lightGrad.addColorStop(1, 'rgba(255,250,230,0)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, W, H);
}

function drawPost(ctx, x, y, color) {
  const grad = ctx.createLinearGradient(x - 6, 0, x + 6, 0);
  grad.addColorStop(0, '#888');
  grad.addColorStop(0.3, '#ddd');
  grad.addColorStop(0.7, '#ddd');
  grad.addColorStop(1, '#888');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 5, y - 70, 10, 70);

  // Cap
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 70, 8, 0, Math.PI * 2);
  ctx.fill();
}

// --- OPPONENT ---

export function computeOpponentPose(opp) {
  let charScale = 1.0;
  if (opp.name === 'The Intern') charScale = 0.85;
  else if (opp.name === 'The CEO') charScale = 1.1;

  let offsetX = 0, offsetY = 0, rotate = 0, scaleX = 1, scaleY = 1;
  let leftArmAngle = 0, rightArmAngle = 0;
  let leftGloveExtend = 0, rightGloveExtend = 0;
  let eyeState = 'normal';
  let mouthState = 'neutral';
  let unblockableGlow = null;

  const breathe = Math.sin(gameTime * 2.5) * 2;
  const sway = Math.sin(gameTime * 1.8) * 1.5;

  switch (opp.state) {
    case 'idle':
      offsetY = breathe;
      offsetX = sway;
      break;
    case 'telegraph': {
      const tProg = 0.5 + 0.5 * Math.sin(gameTime * 12);
      if (opp.telegraphType === 'windUpRight') {
        rightArmAngle = -1.2 - tProg * 0.5;
        rightGloveExtend = -35;
        offsetX = 28 + tProg * 10;
        rotate = -0.18;
        eyeState = 'narrow';
        mouthState = 'smirk';
      } else if (opp.telegraphType === 'windUpLeft') {
        leftArmAngle = 1.2 + tProg * 0.5;
        leftGloveExtend = -35;
        offsetX = -28 - tProg * 10;
        rotate = 0.18;
        eyeState = 'narrow';
        mouthState = 'smirk';
      } else if (opp.telegraphType === 'adjustCufflinks') {
        rightArmAngle = -0.8;
        rightGloveExtend = -30;
        offsetX = 10;
        rotate = -0.06;
        eyeState = 'narrow';
        mouthState = 'neutral';
      } else if (opp.telegraphType === 'smirk') {
        offsetX = tProg * 6;
        offsetY = -4;
        eyeState = 'narrow';
        mouthState = 'smirk';
        rightArmAngle = -0.4;
      } else if (opp.telegraphType === 'feintLeft') {
        offsetX = -35 - tProg * 15;
        leftArmAngle = 0.8;
        rightArmAngle = -1.2 - tProg * 0.5;
        rightGloveExtend = -30;
        rotate = 0.18;
        eyeState = 'narrow';
      } else if (opp.telegraphType === 'crackKnuckles') {
        leftArmAngle = 0.9;
        rightArmAngle = -0.9;
        leftGloveExtend = 25 + tProg * 10;
        rightGloveExtend = 25 + tProg * 10;
        offsetY = -10;
        eyeState = 'narrow';
        mouthState = 'smirk';
      } else if (opp.telegraphType === 'raiseClipboard') {
        rightArmAngle = -1.3 - tProg * 0.5;
        rightGloveExtend = -40;
        offsetY = -18;
        rotate = -0.08;
        eyeState = 'narrow';
        mouthState = 'smirk';
      } else if (opp.telegraphType === 'flailWindUp') {
        leftArmAngle = 0.8 + Math.sin(gameTime * 15) * 0.6;
        rightArmAngle = -0.8 + Math.cos(gameTime * 15) * 0.6;
        leftGloveExtend = -20 + Math.sin(gameTime * 10) * 15;
        rightGloveExtend = -20 + Math.cos(gameTime * 10) * 15;
        offsetY = -20;
        offsetX = Math.sin(gameTime * 8) * 10;
        eyeState = 'normal';
        mouthState = 'open';
      } else if (opp.telegraphType === 'sipCoffee') {
        rightArmAngle = -1.3;
        rightGloveExtend = -35;
        offsetY = breathe - 5;
        offsetX = 6;
        rotate = -0.06;
        eyeState = 'narrow';
        mouthState = 'neutral';
      } else if (opp.telegraphType === 'checkPhone') {
        rightArmAngle = -1.1;
        rightGloveExtend = -30;
        offsetY = breathe - 4;
        offsetX = -8;
        rotate = 0.06;
        eyeState = 'narrow';
      } else if (opp.telegraphType === 'adjustTie') {
        rightArmAngle = -0.7;
        rightGloveExtend = -25;
        offsetY = breathe - 3;
        offsetX = 6;
        rotate = -0.05;
        eyeState = 'narrow';
        mouthState = 'neutral';
      }
      if (opp.currentPattern && opp.currentPattern.blockable === false) {
        const glowPulse = 0.4 + 0.6 * Math.abs(Math.sin(gameTime * 8));
        unblockableGlow = glowPulse;
      }
      break;
    }
    case 'attack':
      offsetY = 25;
      scaleX = 1.05;
      scaleY = 1.05;
      mouthState = 'open';
      if (opp.attackDirection === 'right') {
        rightGloveExtend = 50;
        rightArmAngle = -0.3;
        offsetX = -15;
      } else if (opp.attackDirection === 'left') {
        leftGloveExtend = 50;
        leftArmAngle = 0.3;
        offsetX = 15;
      } else {
        leftGloveExtend = 35;
        rightGloveExtend = 35;
        offsetY = 40;
      }
      break;
    case 'recovery':
      offsetX = Math.sin(gameTime * 8) * 8;
      offsetY = 5;
      eyeState = 'dizzy';
      mouthState = 'ouch';
      leftArmAngle = 0.3;
      rightArmAngle = -0.3;
      break;
    case 'stunned':
      offsetX = Math.sin(gameTime * 10) * 12;
      offsetY = 8 + Math.sin(gameTime * 6) * 3;
      rotate = Math.sin(gameTime * 7) * 0.08;
      eyeState = 'dizzy';
      mouthState = 'ouch';
      leftArmAngle = 0.5;
      rightArmAngle = -0.5;
      break;
    case 'down': {
      offsetY = 120;
      rotate = -0.5;
      scaleY = 0.65;
      scaleX = 1.1;
      eyeState = 'closed';
      mouthState = 'ouch';
      break;
    }
  }

  return {
    offsetX, offsetY, rotate, scaleX, scaleY, charScale,
    leftArmAngle, rightArmAngle, leftGloveExtend, rightGloveExtend,
    eyeState, mouthState, breathe, sway, unblockableGlow,
  };
}

export function drawOpponent(ctx, opp) {
  const pose = computeOpponentPose(opp);
  if (getStyle() === 'anime') {
    drawOpponentAnime(ctx, pose, opp);
  } else {
    drawOpponentClassic(ctx, pose, opp);
  }
}

function drawOpponentAnime(ctx, pose, opp) {
  ctx.save();
  const baseX = 400, baseY = 300;

  const { offsetX, offsetY, rotate, scaleX, scaleY, charScale,
          leftArmAngle, rightArmAngle, leftGloveExtend, rightGloveExtend,
          eyeState, mouthState, sway, unblockableGlow, breathe } = pose;

  // Unblockable glow - dramatic red aura
  if (unblockableGlow !== null) {
    ctx.save();
    ctx.translate(baseX + offsetX, baseY + offsetY);
    for (let i = 3; i >= 0; i--) {
      const r = 60 + i * 15 + Math.sin(gameTime * 6 + i) * 5;
      const a = unblockableGlow * (0.12 - i * 0.025);
      ctx.fillStyle = `rgba(255,40,20,${Math.max(0, a)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Floating red particles
    for (let i = 0; i < 6; i++) {
      const angle = gameTime * 3 + i * Math.PI / 3;
      const dist = 55 + Math.sin(gameTime * 4 + i * 2) * 15;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist * 1.4 - 20;
      const pa = unblockableGlow * (0.4 + 0.3 * Math.sin(gameTime * 8 + i));
      ctx.fillStyle = `rgba(255,80,30,${pa})`;
      ctx.beginPath();
      ctx.arc(px, py, 2 + Math.sin(gameTime * 5 + i) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.translate(baseX + offsetX, baseY + offsetY);
  ctx.rotate(rotate);
  ctx.scale(scaleX * charScale, scaleY * charScale);

  // Shadow on floor
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 100, 65, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- BODY / TORSO ---
  const suitColor = opp.color || '#555';
  const suitShadow = darkenColor(suitColor, 40);
  const suitHighlight = lightenColor(suitColor, 20);

  // Torso base (broader shoulders, defined waist)
  ctx.fillStyle = suitHighlight;
  ctx.beginPath();
  ctx.moveTo(-48, -22);
  ctx.quadraticCurveTo(-52, 10, -48, 45);
  ctx.lineTo(-35, 90);
  ctx.lineTo(35, 90);
  ctx.lineTo(48, 45);
  ctx.quadraticCurveTo(52, 10, 48, -22);
  ctx.closePath();
  ctx.fill();

  // Torso shadow (left half - hard edge cel shading)
  ctx.fillStyle = suitShadow;
  ctx.beginPath();
  ctx.moveTo(-48, -22);
  ctx.quadraticCurveTo(-52, 10, -48, 45);
  ctx.lineTo(-35, 90);
  ctx.lineTo(0, 90);
  ctx.lineTo(0, -22);
  ctx.closePath();
  ctx.fill();

  // Pinstripe pattern for CEO
  if (opp.name === 'The CEO') {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 6, -22);
      ctx.lineTo(i * 6 - 2, 90);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Suit lapels with shadow
  ctx.strokeStyle = darkenColor(suitColor, 60);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-12, -22);
  ctx.lineTo(-22, 45);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(12, -22);
  ctx.lineTo(22, 45);
  ctx.stroke();
  // Lapel fill (V shape)
  ctx.fillStyle = darkenColor(suitColor, 25);
  ctx.beginPath();
  ctx.moveTo(-12, -22);
  ctx.lineTo(-22, 45);
  ctx.lineTo(-14, 45);
  ctx.lineTo(-6, -15);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, -22);
  ctx.lineTo(22, 45);
  ctx.lineTo(14, 45);
  ctx.lineTo(6, -15);
  ctx.closePath();
  ctx.fill();

  // Buttons (2-3)
  const numButtons = opp.name === 'The CEO' ? 2 : 3;
  for (let i = 0; i < numButtons; i++) {
    const by = 20 + i * 20;
    ctx.fillStyle = darkenColor(suitColor, 50);
    ctx.beginPath();
    ctx.arc(0, by, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lightenColor(suitColor, 40);
    ctx.beginPath();
    ctx.arc(-0.5, by - 0.5, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shirt
  ctx.fillStyle = '#e8e0d8';
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.lineTo(-6, 55);
  ctx.lineTo(6, 55);
  ctx.lineTo(10, -20);
  ctx.closePath();
  ctx.fill();
  // Shirt shadow
  ctx.fillStyle = '#d4ccc0';
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.lineTo(-6, 55);
  ctx.lineTo(0, 55);
  ctx.lineTo(0, -20);
  ctx.closePath();
  ctx.fill();

  // Tie
  const tieOffsetX = (opp.name === 'The CEO' && opp.desperate) ? 4 : 0;
  const tieRotate = (opp.name === 'The CEO' && opp.desperate) ? 0.15 : 0;
  ctx.save();
  ctx.translate(tieOffsetX, 0);
  ctx.rotate(tieRotate);
  ctx.fillStyle = '#cc2222';
  ctx.beginPath();
  ctx.moveTo(-4, -15);
  ctx.lineTo(4, -15);
  ctx.lineTo(5, 48);
  ctx.lineTo(0, 55);
  ctx.lineTo(-5, 48);
  ctx.closePath();
  ctx.fill();
  // Tie shadow half
  ctx.fillStyle = '#a01818';
  ctx.beginPath();
  ctx.moveTo(-4, -15);
  ctx.lineTo(0, -15);
  ctx.lineTo(0, 55);
  ctx.lineTo(-5, 48);
  ctx.closePath();
  ctx.fill();
  // Tie diagonal stripes
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(180,30,30,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(-8, -15 + i * 7);
    ctx.lineTo(8, -10 + i * 7);
    ctx.stroke();
  }
  ctx.restore();
  // Tie knot
  ctx.fillStyle = '#cc2222';
  ctx.beginPath();
  ctx.moveTo(-6, -16);
  ctx.lineTo(6, -16);
  ctx.lineTo(4, -9);
  ctx.lineTo(-4, -9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a01818';
  ctx.beginPath();
  ctx.moveTo(-6, -16);
  ctx.lineTo(0, -16);
  ctx.lineTo(0, -9);
  ctx.lineTo(-4, -9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Pocket square for CEO / Manager
  if (opp.name === 'The CEO' || opp.name === 'Middle Manager') {
    ctx.fillStyle = '#f0eae0';
    ctx.beginPath();
    ctx.moveTo(22, 12);
    ctx.lineTo(28, 8);
    ctx.lineTo(34, 10);
    ctx.lineTo(32, 18);
    ctx.lineTo(24, 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Gold cufflinks for CEO
  if (opp.name === 'The CEO') {
    ctx.fillStyle = '#d4a030';
    ctx.beginPath();
    ctx.arc(-42, 55, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(42, 55, 3, 0, Math.PI * 2);
    ctx.fill();
    // Cufflink highlights
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath();
    ctx.arc(-43, 54, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(41, 54, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Collar
  ctx.fillStyle = '#f0e8e0';
  ctx.beginPath();
  ctx.moveTo(-20, -24);
  ctx.lineTo(-6, -16);
  ctx.lineTo(-14, -32);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -24);
  ctx.lineTo(6, -16);
  ctx.lineTo(14, -32);
  ctx.closePath();
  ctx.fill();
  // Collar shadow
  ctx.fillStyle = '#d8d0c8';
  ctx.beginPath();
  ctx.moveTo(-20, -24);
  ctx.lineTo(-14, -20);
  ctx.lineTo(-14, -32);
  ctx.closePath();
  ctx.fill();

  // Sleeve cuffs hint
  ctx.fillStyle = lightenColor(suitColor, 10);
  ctx.fillRect(-49, 52, 12, 5);
  ctx.fillRect(37, 52, 12, 5);
  ctx.strokeStyle = darkenColor(suitColor, 30);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-49, 52, 12, 5);
  ctx.strokeRect(37, 52, 12, 5);

  // Arms + Gloves
  drawArmAnime(ctx, -50, 0, leftArmAngle, leftGloveExtend, suitColor, suitShadow, true, opp.name);
  drawArmAnime(ctx, 50, 0, rightArmAngle, rightGloveExtend, suitColor, suitShadow, false, opp.name);

  // Rim lighting (right side bright edge)
  ctx.strokeStyle = 'rgba(255,245,210,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, -22);
  ctx.quadraticCurveTo(52, 10, 48, 45);
  ctx.lineTo(35, 90);
  ctx.stroke();

  // Neck with cel shading
  ctx.fillStyle = '#f0d0b0';
  ctx.fillRect(-11, -40, 22, 22);
  ctx.fillStyle = '#d8b890';
  ctx.fillRect(-11, -40, 11, 22);

  // Head
  drawHeadAnime(ctx, 0, -68, suitColor, eyeState, mouthState, opp.name, opp.desperate);

  // Sweat drops for stunned/recovery
  if (opp.state === 'stunned' || opp.state === 'recovery') {
    drawAnimeSweatDrops(ctx, 0, -100);
    // X-eyes are handled inside drawHeadAnime via eyeState='dizzy'
  }

  // Stars over head when stunned
  if (opp.state === 'stunned' || opp.state === 'recovery') {
    drawStarsOverHead(ctx, 0, -115);
  }

  ctx.restore();
}

function drawArmAnime(ctx, startX, startY, angle, gloveExtend, suitColor, suitShadow, isLeft, oppName) {
  ctx.save();
  ctx.translate(startX, startY);
  ctx.rotate(angle);

  const dir = isLeft ? 1 : -1;

  // Sleeve - base color
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.moveTo(-9 * dir, -6);
  ctx.quadraticCurveTo(-16 * dir, 25, -11 * dir + gloveExtend * 0.3, 52 + gloveExtend * 0.6);
  ctx.lineTo(9 * dir + gloveExtend * 0.3, 52 + gloveExtend * 0.6);
  ctx.quadraticCurveTo(13 * dir, 25, 9 * dir, -6);
  ctx.closePath();
  ctx.fill();

  // Sleeve shadow (inner half)
  ctx.fillStyle = suitShadow;
  ctx.beginPath();
  ctx.moveTo(-9 * dir, -6);
  ctx.quadraticCurveTo(-16 * dir, 25, -11 * dir + gloveExtend * 0.3, 52 + gloveExtend * 0.6);
  ctx.lineTo(0 + gloveExtend * 0.15, 52 + gloveExtend * 0.6);
  ctx.quadraticCurveTo(-2 * dir, 25, 0, -6);
  ctx.closePath();
  ctx.fill();

  // Cuff detail
  const cuffY = 48 + gloveExtend * 0.6;
  const cuffX = gloveExtend * 0.3;
  ctx.strokeStyle = darkenColor(suitColor, 30);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-9 * dir + cuffX, cuffY);
  ctx.lineTo(9 * dir + cuffX, cuffY);
  ctx.stroke();

  // Boxing glove - cel shaded
  const gx = gloveExtend * 0.3;
  const gy = 57 + gloveExtend * 0.7;
  const gloveBase = oppName === 'The Intern' ? '#e83030' : '#c42020';
  const gloveShadow = oppName === 'The Intern' ? '#b81818' : '#8a0f0f';
  const gloveHighlight = oppName === 'The Intern' ? '#ff5050' : '#e03030';

  // Manager has worn gloves
  const wornPatch = oppName === 'Middle Manager';

  // Glove base
  ctx.fillStyle = gloveBase;
  ctx.beginPath();
  ctx.ellipse(gx, gy, 19, 16, isLeft ? 0.2 : -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Glove shadow half
  ctx.fillStyle = gloveShadow;
  ctx.beginPath();
  ctx.ellipse(gx, gy, 19, 16, isLeft ? 0.2 : -0.2, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();

  // Worn patches for manager
  if (wornPatch) {
    ctx.fillStyle = 'rgba(80,20,20,0.3)';
    ctx.beginPath();
    ctx.ellipse(gx + 5, gy - 3, 6, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(gx - 7, gy + 4, 4, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glove highlight
  ctx.fillStyle = `rgba(255,255,255,0.15)`;
  ctx.beginPath();
  ctx.ellipse(gx + 4, gy - 8, 8, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Glove lace
  ctx.strokeStyle = '#f5f5f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(gx - 9, gy - 9);
  ctx.quadraticCurveTo(gx, gy - 13, gx + 9, gy - 9);
  ctx.stroke();

  ctx.restore();
}

function drawHeadAnime(ctx, x, y, suitColor, eyeState, mouthState, oppName, desperate) {
  ctx.save();
  ctx.translate(x, y);

  // Head shape - cel shaded
  const skinBase = '#fce4c8';
  const skinShadow = '#e0bc90';

  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.moveTo(-30, -16);
  ctx.quadraticCurveTo(-32, -32, -22, -40);
  ctx.quadraticCurveTo(0, -48, 22, -40);
  ctx.quadraticCurveTo(32, -32, 30, -16);
  if (oppName === 'The CEO') {
    ctx.quadraticCurveTo(30, 8, 16, 22);
    ctx.lineTo(0, 30);
    ctx.lineTo(-16, 22);
    ctx.quadraticCurveTo(-30, 8, -30, -16);
  } else if (oppName === 'The Intern') {
    ctx.quadraticCurveTo(32, 12, 20, 26);
    ctx.quadraticCurveTo(0, 34, -20, 26);
    ctx.quadraticCurveTo(-32, 12, -30, -16);
  } else {
    ctx.quadraticCurveTo(30, 10, 20, 24);
    ctx.quadraticCurveTo(0, 32, -20, 24);
    ctx.quadraticCurveTo(-30, 10, -30, -16);
  }
  ctx.closePath();
  ctx.fill();

  // Face shadow (left half = shadow plane)
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.moveTo(-30, -16);
  ctx.quadraticCurveTo(-32, -32, -22, -40);
  ctx.quadraticCurveTo(-10, -48, 0, -44);
  ctx.lineTo(0, 30);
  if (oppName === 'The CEO') {
    ctx.lineTo(-16, 22);
    ctx.quadraticCurveTo(-30, 8, -30, -16);
  } else if (oppName === 'The Intern') {
    ctx.lineTo(-20, 26);
    ctx.quadraticCurveTo(-32, 12, -30, -16);
  } else {
    ctx.lineTo(-20, 24);
    ctx.quadraticCurveTo(-30, 10, -30, -16);
  }
  ctx.closePath();
  ctx.fill();

  // Jaw/cheek shadow plane (triangle on lit side)
  ctx.fillStyle = 'rgba(200,160,120,0.15)';
  ctx.beginPath();
  ctx.moveTo(10, 5);
  ctx.lineTo(25, 0);
  ctx.lineTo(15, 20);
  ctx.closePath();
  ctx.fill();

  // --- HAIR ---
  if (oppName === 'The CEO') {
    drawCEOHairAnime(ctx, desperate);
  } else if (oppName === 'The Intern') {
    drawInternHairAnime(ctx);
  } else {
    drawManagerHairAnime(ctx);
  }

  // --- EYES ---
  let irisColor = '#2050a0'; // default
  if (oppName === 'The Intern') irisColor = '#8b5e3c';
  else if (oppName === 'Middle Manager') irisColor = '#2d8a4e';
  else if (oppName === 'The CEO') irisColor = '#5098cc';

  const eyeScale = oppName === 'The Intern' ? 1.1 : 1.0;
  const eyeNarrowTilt = oppName === 'Middle Manager' ? 0.08 : 0;

  if (eyeState === 'dizzy') {
    // Anime X-eyes for stunned
    drawAnimeXEye(ctx, -13, -8);
    drawAnimeXEye(ctx, 13, -8);
  } else if (eyeState === 'closed') {
    drawAnimeClosedEye(ctx, -13, -8);
    drawAnimeClosedEye(ctx, 13, -8);
  } else if (eyeState === 'narrow') {
    drawAnimeNarrowEye(ctx, -13, -8, irisColor, eyeNarrowTilt);
    drawAnimeNarrowEye(ctx, 13, -8, irisColor, eyeNarrowTilt);
  } else {
    drawAnimeEyeHQ(ctx, -13, -8, irisColor, eyeScale, oppName === 'The CEO');
    drawAnimeEyeHQ(ctx, 13, -8, irisColor, eyeScale, oppName === 'The CEO');
  }

  // Glasses for Manager (over eyes)
  if (oppName === 'Middle Manager') {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    // Left lens
    ctx.beginPath();
    ctx.rect(-24, -15, 18, 12);
    ctx.stroke();
    // Right lens
    ctx.beginPath();
    ctx.rect(6, -15, 18, 12);
    ctx.stroke();
    // Bridge
    ctx.beginPath();
    ctx.moveTo(-6, -9);
    ctx.quadraticCurveTo(0, -7, 6, -9);
    ctx.stroke();
    // Temple arms
    ctx.beginPath();
    ctx.moveTo(-24, -13);
    ctx.lineTo(-30, -12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(24, -13);
    ctx.lineTo(30, -12);
    ctx.stroke();
    // Hinge screws
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(-24, -11, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(24, -11, 1, 0, Math.PI * 2);
    ctx.fill();
    // Lens glare
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-15, -12, 6, Math.PI * 1.2, Math.PI * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(15, -12, 6, Math.PI * 1.2, Math.PI * 1.7);
    ctx.stroke();
  }

  // Eyebrows
  let browColor = '#2a1a0a';
  if (oppName === 'The CEO') browColor = '#666';
  else if (oppName === 'The Intern') browColor = '#5a3820';
  ctx.strokeStyle = browColor;
  ctx.lineWidth = 2.8;
  if (eyeState === 'narrow' || mouthState === 'smirk') {
    ctx.beginPath();
    ctx.moveTo(-22, -19);
    ctx.lineTo(-6, -16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(22, -19);
    ctx.lineTo(6, -16);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-21, -17);
    ctx.quadraticCurveTo(-13, -21, -5, -17);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(21, -17);
    ctx.quadraticCurveTo(13, -21, 5, -17);
    ctx.stroke();
  }

  // Nose - anime style (subtle shadow wedge)
  ctx.fillStyle = 'rgba(200,160,120,0.3)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(3, 6);
  ctx.lineTo(-1, 7);
  ctx.closePath();
  ctx.fill();

  // Mouth
  if (mouthState === 'neutral') {
    ctx.strokeStyle = '#c07060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 14);
    ctx.quadraticCurveTo(0, 16, 8, 14);
    ctx.stroke();
    // Subtle lip color
    ctx.fillStyle = 'rgba(200,120,100,0.15)';
    ctx.beginPath();
    ctx.moveTo(-8, 14);
    ctx.quadraticCurveTo(0, 18, 8, 14);
    ctx.quadraticCurveTo(0, 16, -8, 14);
    ctx.closePath();
    ctx.fill();
  } else if (mouthState === 'open') {
    ctx.fillStyle = '#301010';
    ctx.beginPath();
    ctx.ellipse(0, 15, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Teeth row
    ctx.fillStyle = '#f8f8f0';
    ctx.beginPath();
    ctx.ellipse(0, 12, 7, 2.5, 0, 0, Math.PI);
    ctx.fill();
    // Tooth lines
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 3, 10);
      ctx.lineTo(i * 3, 14);
      ctx.stroke();
    }
    // Lower lip
    ctx.fillStyle = '#c07060';
    ctx.beginPath();
    ctx.ellipse(0, 15, 9, 7, 0, Math.PI * 0.1, Math.PI * 0.9);
    ctx.fill();
    // Intern single tooth on ouch
    if (oppName === 'The Intern') {
      ctx.fillStyle = '#f8f8f0';
      ctx.fillRect(-2, 10, 4, 4);
    }
  } else if (mouthState === 'smirk') {
    ctx.strokeStyle = '#c07060';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, 14);
    ctx.quadraticCurveTo(2, 12, 10, 17);
    ctx.stroke();
    // Smirk shadow
    ctx.fillStyle = 'rgba(180,100,80,0.1)';
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    ctx.quadraticCurveTo(2, 12, 10, 17);
    ctx.quadraticCurveTo(4, 18, -6, 16);
    ctx.closePath();
    ctx.fill();
  } else if (mouthState === 'ouch') {
    ctx.strokeStyle = '#c07060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, 16);
    ctx.lineTo(-4, 13);
    ctx.lineTo(-1, 16);
    ctx.lineTo(2, 13);
    ctx.lineTo(5, 16);
    ctx.stroke();
    if (oppName === 'The Intern') {
      ctx.fillStyle = '#f8f8f0';
      ctx.beginPath();
      ctx.moveTo(-1, 13);
      ctx.lineTo(1, 13);
      ctx.lineTo(1, 17);
      ctx.lineTo(-1, 17);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Bandage for Intern
  if (oppName === 'The Intern') {
    ctx.fillStyle = '#e8d8c0';
    ctx.save();
    ctx.translate(18, 8);
    ctx.rotate(0.15);
    ctx.fillRect(-5, -2, 10, 5);
    ctx.strokeStyle = '#c8b8a0';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-5, -2, 10, 5);
    // Cross marks
    ctx.strokeStyle = '#bb9970';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-2, -1);
    ctx.lineTo(-2, 2);
    ctx.moveTo(2, -1);
    ctx.lineTo(2, 2);
    ctx.stroke();
    ctx.restore();
  }

  // Ears
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(-31, -5, 5, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(31, -5, 5, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Ear shadow
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.ellipse(-31, -5, 3, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(232,192,160,0.5)';
  ctx.beginPath();
  ctx.ellipse(31, -5, 3, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Rim light on right edge of head
  ctx.strokeStyle = 'rgba(255,245,210,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -5, 30, -Math.PI * 0.4, Math.PI * 0.3);
  ctx.stroke();

  // Desperate CEO effects
  if (oppName === 'The CEO' && desperate) {
    // Sweat bead
    ctx.fillStyle = 'rgba(180,210,240,0.7)';
    ctx.beginPath();
    ctx.moveTo(20, -15);
    ctx.quadraticCurveTo(22, -12, 20, -8);
    ctx.quadraticCurveTo(18, -12, 20, -15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(220,240,255,0.5)';
    ctx.beginPath();
    ctx.arc(19.5, -13, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCEOHairAnime(ctx, desperate) {
  // Silver/white swept-back hair, layered sections
  const layers = [
    { offset: 0, color: '#a0a0a0', highlight: '#ddd' },
    { offset: -2, color: '#909090', highlight: '#ccc' },
    { offset: -4, color: '#808088', highlight: '#bbb' },
    { offset: -1, color: '#959598', highlight: '#d8d8d8' },
  ];
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    const yo = i * 1.5;
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.moveTo(-32, -16 + yo);
    ctx.quadraticCurveTo(-34 + l.offset, -36 - i * 2, -22, -44 - i);
    ctx.quadraticCurveTo(0, -52 - i, 22, -44 - i);
    ctx.quadraticCurveTo(34 + l.offset, -36 - i * 2, 32, -16 + yo);
    ctx.quadraticCurveTo(28, -30, 20, -34 - i);
    ctx.quadraticCurveTo(0, -42 - i, -20, -34 - i);
    ctx.quadraticCurveTo(-28, -30, -32, -16 + yo);
    ctx.closePath();
    ctx.fill();
    // Highlight streak per layer
    ctx.strokeStyle = l.highlight;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(-10 + i * 8, -42 - i);
    ctx.quadraticCurveTo(-5 + i * 8, -38, -2 + i * 8, -30);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Desperate: mess up one strand
  if (desperate) {
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.moveTo(8, -44);
    ctx.quadraticCurveTo(12, -52, 6, -56);
    ctx.quadraticCurveTo(4, -50, 6, -44);
    ctx.closePath();
    ctx.fill();
  }
}

function drawInternHairAnime(ctx) {
  // Messy voluminous brown hair with 8 spike groups
  const baseColor = '#6b4226';
  const highlightColor = '#8b6240';
  const shadowColor = '#4a2a14';

  // Base hair mass
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(-32, -16);
  ctx.quadraticCurveTo(-34, -36, -22, -44);
  ctx.quadraticCurveTo(0, -52, 22, -44);
  ctx.quadraticCurveTo(34, -36, 32, -16);
  ctx.quadraticCurveTo(28, -30, 20, -32);
  ctx.quadraticCurveTo(0, -40, -20, -32);
  ctx.quadraticCurveTo(-28, -28, -32, -16);
  ctx.closePath();
  ctx.fill();

  // Shadow half
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.moveTo(-32, -16);
  ctx.quadraticCurveTo(-34, -36, -22, -44);
  ctx.quadraticCurveTo(-10, -52, 0, -48);
  ctx.lineTo(0, -32);
  ctx.quadraticCurveTo(-12, -36, -28, -28);
  ctx.closePath();
  ctx.fill();

  // Spike groups - each a separate bezier path
  const spikes = [
    { x: -18, y: -42, tx: -26, ty: -60, ex: -14, ey: -44 },
    { x: -10, y: -46, tx: -8, ty: -64, ex: -2, ey: -46 },
    { x: 2, y: -46, tx: 6, ty: -66, ex: 12, ey: -44 },
    { x: 14, y: -42, tx: 22, ty: -58, ex: 20, ey: -38 },
    { x: -26, y: -34, tx: -36, ty: -50, ex: -24, ey: -38 },
    { x: 22, y: -36, tx: 34, ty: -48, ex: 28, ey: -30 },
    { x: -4, y: -48, tx: -2, ty: -58, ex: 4, ey: -48 },
    { x: 26, y: -26, tx: 36, ty: -36, ex: 30, ey: -20 },
  ];
  for (let i = 0; i < spikes.length; i++) {
    const s = spikes[i];
    // Spike body
    ctx.fillStyle = i % 2 === 0 ? baseColor : lightenColor(baseColor, 10);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.quadraticCurveTo(s.tx, s.ty, s.ex, s.ey);
    ctx.quadraticCurveTo((s.x + s.ex) / 2, (s.y + s.ey) / 2 + 3, s.x, s.y);
    ctx.closePath();
    ctx.fill();
    // Highlight at tip
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.arc(s.tx * 0.7 + s.x * 0.3, s.ty * 0.7 + s.y * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawManagerHairAnime(ctx) {
  // Slicked back dark hair with strand lines
  ctx.fillStyle = '#1a0e05';
  ctx.beginPath();
  ctx.moveTo(-32, -16);
  ctx.quadraticCurveTo(-34, -36, -22, -44);
  ctx.quadraticCurveTo(0, -52, 22, -44);
  ctx.quadraticCurveTo(34, -36, 32, -16);
  ctx.quadraticCurveTo(28, -30, 20, -32);
  ctx.quadraticCurveTo(0, -40, -20, -32);
  ctx.quadraticCurveTo(-28, -28, -32, -16);
  ctx.closePath();
  ctx.fill();

  // Individual strand lines
  ctx.strokeStyle = 'rgba(40,25,10,0.6)';
  ctx.lineWidth = 1;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6, -44 + Math.abs(i) * 2);
    ctx.quadraticCurveTo(i * 7 + 2, -36, i * 8, -28);
    ctx.stroke();
  }

  // Oily sheen - white highlight streaks
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -44);
  ctx.quadraticCurveTo(-5, -38, -4, -32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, -42);
  ctx.quadraticCurveTo(8, -36, 10, -30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(16, -38);
  ctx.quadraticCurveTo(18, -34, 19, -28);
  ctx.stroke();
}

function drawAnimeEyeHQ(ctx, x, y, irisColor, scale, glowing) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // White (sclera)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iris - two-tone (dark at top, light at bottom)
  const irisTop = darkenColor(irisColor.startsWith('#') ? irisColor : '#3366aa', 30);
  const irisBot = irisColor;
  ctx.fillStyle = irisTop;
  ctx.beginPath();
  ctx.ellipse(0, 1, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bottom half lighter
  ctx.fillStyle = irisBot;
  ctx.beginPath();
  ctx.ellipse(0, 1, 7, 8, 0, 0, Math.PI);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#060612';
  ctx.beginPath();
  ctx.ellipse(0, 1, 3.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Catchlights (2 large, 1 small)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(2.5, -3, 2.8, 2.2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-2.5, 3.5, 1.5, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, 1, 0.8, 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Upper eyelash line (thick, extends past eye)
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-11, -2);
  ctx.quadraticCurveTo(-6, -10, 0, -10);
  ctx.quadraticCurveTo(6, -10, 11, -2);
  ctx.stroke();

  // Lower lash (thin)
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-7, 6);
  ctx.quadraticCurveTo(0, 9, 7, 6);
  ctx.stroke();

  // CEO eye glow
  if (glowing) {
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(gameTime * 3) * 0.05;
    ctx.shadowColor = irisColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = irisColor;
    ctx.beginPath();
    ctx.ellipse(0, 1, 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawAnimeNarrowEye(ctx, x, y, irisColor, tilt) {
  ctx.save();
  ctx.translate(x, y);
  if (tilt) ctx.rotate(x < 0 ? tilt : -tilt);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = irisColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#060612';
  ctx.beginPath();
  ctx.ellipse(0, 0, 3, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(2, -1, 1.5, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Heavy upper lid
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-10, -1);
  ctx.quadraticCurveTo(0, -5, 10, -1);
  ctx.stroke();

  ctx.restore();
}

function drawAnimeXEye(ctx, x, y) {
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 5);
  ctx.lineTo(x + 5, y + 5);
  ctx.moveTo(x + 5, y - 5);
  ctx.lineTo(x - 5, y + 5);
  ctx.stroke();
}

function drawAnimeClosedEye(ctx, x, y) {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.quadraticCurveTo(x, y + 6, x + 8, y);
  ctx.stroke();
  // Eyelash accents
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 1);
  ctx.lineTo(x - 8, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 9, y - 1);
  ctx.lineTo(x + 8, y);
  ctx.stroke();
}

function drawAnimeSweatDrops(ctx, x, y) {
  for (let i = 0; i < 3; i++) {
    const sx = x + 20 + i * 8;
    const sy = y + 10 - i * 12 + Math.sin(gameTime * 4 + i * 2) * 3;
    ctx.fillStyle = 'rgba(180,210,240,0.6)';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 5);
    ctx.quadraticCurveTo(sx + 3, sy, sx, sy + 3);
    ctx.quadraticCurveTo(sx - 3, sy, sx, sy - 5);
    ctx.closePath();
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(220,240,255,0.5)';
    ctx.beginPath();
    ctx.arc(sx - 0.5, sy - 3, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOpponentClassic(ctx, pose, opp) {
  ctx.save();
  const baseX = 400, baseY = 300;

  const { offsetX, offsetY, rotate, scaleX, scaleY, charScale,
          leftArmAngle, rightArmAngle, leftGloveExtend, rightGloveExtend,
          eyeState, mouthState, sway, unblockableGlow } = pose;

  // Unblockable glow effect during telegraph
  if (unblockableGlow !== null) {
    ctx.save();
    ctx.translate(baseX + offsetX, baseY + offsetY);
    ctx.shadowColor = `rgba(255,100,0,${unblockableGlow})`;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = `rgba(255,120,30,${unblockableGlow * 0.6})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 55, 100, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.translate(baseX + offsetX, baseY + offsetY);
  ctx.rotate(rotate);
  ctx.scale(scaleX * charScale, scaleY * charScale);

  // Shadow on floor
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 100, 60, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body / torso (suit jacket)
  const suitColor = opp.color || '#555';
  const suitGrad = ctx.createLinearGradient(-45, -40, 45, 80);
  suitGrad.addColorStop(0, lightenColor(suitColor, 30));
  suitGrad.addColorStop(0.5, suitColor);
  suitGrad.addColorStop(1, darkenColor(suitColor, 30));
  ctx.fillStyle = suitGrad;
  ctx.beginPath();
  ctx.moveTo(-45, -20);
  ctx.quadraticCurveTo(-50, 40, -40, 90);
  ctx.lineTo(40, 90);
  ctx.quadraticCurveTo(50, 40, 45, -20);
  ctx.closePath();
  ctx.fill();

  // Suit lapels
  ctx.strokeStyle = darkenColor(suitColor, 50);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.lineTo(-20, 40);
  ctx.moveTo(10, -20);
  ctx.lineTo(20, 40);
  ctx.stroke();

  // Shirt
  ctx.fillStyle = '#e8e0d8';
  ctx.beginPath();
  ctx.moveTo(-12, -18);
  ctx.lineTo(-8, 50);
  ctx.lineTo(8, 50);
  ctx.lineTo(12, -18);
  ctx.closePath();
  ctx.fill();

  // Tie
  ctx.fillStyle = '#cc2222';
  ctx.beginPath();
  ctx.moveTo(-3, -15);
  ctx.lineTo(3, -15);
  ctx.lineTo(5, 45);
  ctx.lineTo(0, 52);
  ctx.lineTo(-5, 45);
  ctx.closePath();
  ctx.fill();
  // Tie knot
  ctx.beginPath();
  ctx.moveTo(-5, -15);
  ctx.lineTo(5, -15);
  ctx.lineTo(3, -8);
  ctx.lineTo(-3, -8);
  ctx.closePath();
  ctx.fill();

  // Pocket square for CEO
  if (opp.name === 'The CEO') {
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.moveTo(22, 15);
    ctx.lineTo(30, 10);
    ctx.lineTo(35, 18);
    ctx.lineTo(28, 22);
    ctx.closePath();
    ctx.fill();
  }

  // Collar
  ctx.fillStyle = '#f0e8e0';
  ctx.beginPath();
  ctx.moveTo(-18, -22);
  ctx.lineTo(-5, -15);
  ctx.lineTo(-12, -30);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, -22);
  ctx.lineTo(5, -15);
  ctx.lineTo(12, -30);
  ctx.closePath();
  ctx.fill();

  // Arms + Gloves
  drawArm(ctx, -50, 0, leftArmAngle, leftGloveExtend, suitColor, true);
  drawArm(ctx, 50, 0, rightArmAngle, rightGloveExtend, suitColor, false);

  // Neck
  ctx.fillStyle = '#f0d0b0';
  ctx.fillRect(-10, -38, 20, 20);

  // Head
  drawHead(ctx, 0, -65, opp.color, eyeState, mouthState, opp.name);

  // Stars over head when stunned or recovery
  if (opp.state === 'stunned' || opp.state === 'recovery') {
    drawStarsOverHead(ctx, 0, -110);
  }

  ctx.restore();
}

function drawArm(ctx, startX, startY, angle, gloveExtend, suitColor, isLeft) {
  ctx.save();
  ctx.translate(startX, startY);
  ctx.rotate(angle);

  // Sleeve
  const sleeveGrad = ctx.createLinearGradient(0, 0, 0, 50);
  sleeveGrad.addColorStop(0, suitColor);
  sleeveGrad.addColorStop(1, darkenColor(suitColor, 20));
  ctx.fillStyle = sleeveGrad;

  const dir = isLeft ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(-8 * dir, -5);
  ctx.quadraticCurveTo(-15 * dir, 25, -10 * dir + gloveExtend * 0.3, 50 + gloveExtend * 0.6);
  ctx.lineTo(8 * dir + gloveExtend * 0.3, 50 + gloveExtend * 0.6);
  ctx.quadraticCurveTo(12 * dir, 25, 8 * dir, -5);
  ctx.closePath();
  ctx.fill();

  // Boxing glove
  const gx = gloveExtend * 0.3;
  const gy = 55 + gloveExtend * 0.7;
  const gloveGrad = ctx.createRadialGradient(gx, gy, 5, gx, gy, 20);
  gloveGrad.addColorStop(0, '#e83030');
  gloveGrad.addColorStop(0.7, '#c41818');
  gloveGrad.addColorStop(1, '#8a0f0f');
  ctx.fillStyle = gloveGrad;
  ctx.beginPath();
  ctx.ellipse(gx, gy, 18, 15, isLeft ? 0.2 : -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Glove lace line
  ctx.strokeStyle = '#f5f5f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(gx - 8, gy - 8);
  ctx.quadraticCurveTo(gx, gy - 12, gx + 8, gy - 8);
  ctx.stroke();

  ctx.restore();
}

function drawHead(ctx, x, y, suitColor, eyeState, mouthState, oppName) {
  ctx.save();
  ctx.translate(x, y);

  // Head shape - sharper jaw for CEO, rounder for Intern
  const skinGrad = ctx.createRadialGradient(0, 0, 5, 0, -5, 40);
  skinGrad.addColorStop(0, '#fce4c8');
  skinGrad.addColorStop(1, '#e8c8a0');
  ctx.fillStyle = skinGrad;

  ctx.beginPath();
  ctx.moveTo(-28, -15);
  ctx.quadraticCurveTo(-30, -30, -20, -38);
  ctx.quadraticCurveTo(0, -45, 20, -38);
  ctx.quadraticCurveTo(30, -30, 28, -15);
  if (oppName === 'The CEO') {
    ctx.quadraticCurveTo(28, 8, 14, 20);
    ctx.lineTo(0, 28);
    ctx.lineTo(-14, 20);
    ctx.quadraticCurveTo(-28, 8, -28, -15);
  } else if (oppName === 'The Intern') {
    ctx.quadraticCurveTo(30, 12, 18, 24);
    ctx.quadraticCurveTo(0, 32, -18, 24);
    ctx.quadraticCurveTo(-30, 12, -28, -15);
  } else {
    ctx.quadraticCurveTo(28, 10, 18, 22);
    ctx.quadraticCurveTo(0, 30, -18, 22);
    ctx.quadraticCurveTo(-28, 10, -28, -15);
  }
  ctx.closePath();
  ctx.fill();

  // Hair - character specific
  let hairColor = '#2a1a0a'; // default (manager)
  if (oppName === 'The CEO') {
    hairColor = '#888';
    // Silver/white slicked hair
    const silverGrad = ctx.createLinearGradient(-20, -45, 20, -30);
    silverGrad.addColorStop(0, '#888');
    silverGrad.addColorStop(0.4, '#ccc');
    silverGrad.addColorStop(0.6, '#aaa');
    silverGrad.addColorStop(1, '#777');
    ctx.fillStyle = silverGrad;
    ctx.beginPath();
    ctx.moveTo(-30, -15);
    ctx.quadraticCurveTo(-32, -35, -20, -42);
    ctx.quadraticCurveTo(0, -50, 20, -42);
    ctx.quadraticCurveTo(32, -35, 30, -15);
    ctx.quadraticCurveTo(28, -28, 22, -32);
    ctx.quadraticCurveTo(10, -40, -10, -40);
    ctx.quadraticCurveTo(-22, -37, -25, -28);
    ctx.closePath();
    ctx.fill();
  } else if (oppName === 'The Intern') {
    hairColor = '#6b4226';
    // Messy spiky brown hair
    ctx.fillStyle = '#6b4226';
    ctx.beginPath();
    ctx.moveTo(-30, -15);
    ctx.quadraticCurveTo(-32, -35, -20, -42);
    ctx.quadraticCurveTo(0, -50, 20, -42);
    ctx.quadraticCurveTo(32, -35, 30, -15);
    ctx.quadraticCurveTo(28, -28, 22, -30);
    ctx.quadraticCurveTo(10, -38, -10, -38);
    ctx.quadraticCurveTo(-22, -35, -25, -28);
    ctx.closePath();
    ctx.fill();
    // Spiky bits
    ctx.fillStyle = '#7b5236';
    const spikes = [[-12, -42, -8, -55, -3, -44], [5, -42, 12, -56, 16, -42], [-22, -35, -28, -48, -18, -38]];
    for (const s of spikes) {
      ctx.beginPath();
      ctx.moveTo(s[0], s[1]);
      ctx.lineTo(s[2], s[3]);
      ctx.lineTo(s[4], s[5]);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Manager - slicked dark hair
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.moveTo(-30, -15);
    ctx.quadraticCurveTo(-32, -35, -20, -42);
    ctx.quadraticCurveTo(0, -50, 20, -42);
    ctx.quadraticCurveTo(32, -35, 30, -15);
    ctx.quadraticCurveTo(28, -28, 22, -30);
    ctx.quadraticCurveTo(10, -38, -10, -38);
    ctx.quadraticCurveTo(-22, -35, -25, -28);
    ctx.closePath();
    ctx.fill();
    // Glasses
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(-22, -12, 16, 10);
    ctx.rect(6, -12, 16, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -7);
    ctx.lineTo(6, -7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,220,255,0.12)';
    ctx.fillRect(-20, -10, 12, 6);
    ctx.fillRect(8, -10, 12, 6);
  }

  // Eyes (anime style - big and expressive)
  if (eyeState === 'normal') {
    drawAnimeEye(ctx, -12, -8, false);
    drawAnimeEye(ctx, 12, -8, false);
  } else if (eyeState === 'narrow') {
    drawNarrowEye(ctx, -12, -8);
    drawNarrowEye(ctx, 12, -8);
  } else if (eyeState === 'dizzy') {
    drawDizzyEye(ctx, -12, -8);
    drawDizzyEye(ctx, 12, -8);
  } else if (eyeState === 'closed') {
    drawClosedEye(ctx, -12, -8);
    drawClosedEye(ctx, 12, -8);
  }

  // Eyebrows
  ctx.strokeStyle = darkenColor(hairColor, 20);
  ctx.lineWidth = 2.5;
  if (eyeState === 'narrow' || mouthState === 'smirk') {
    // Angry brows
    ctx.beginPath();
    ctx.moveTo(-20, -18);
    ctx.lineTo(-6, -15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, -18);
    ctx.lineTo(6, -15);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-19, -16);
    ctx.quadraticCurveTo(-12, -19, -5, -16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(19, -16);
    ctx.quadraticCurveTo(12, -19, 5, -16);
    ctx.stroke();
  }

  // Nose
  ctx.strokeStyle = '#d4a880';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.quadraticCurveTo(4, 4, 0, 7);
  ctx.stroke();

  // Mouth
  if (mouthState === 'neutral') {
    ctx.strokeStyle = '#c07060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 14);
    ctx.quadraticCurveTo(0, 16, 8, 14);
    ctx.stroke();
  } else if (mouthState === 'open') {
    ctx.fillStyle = '#401010';
    ctx.beginPath();
    ctx.ellipse(0, 15, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c07060';
    ctx.beginPath();
    ctx.ellipse(0, 15, 8, 6, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (mouthState === 'smirk') {
    ctx.strokeStyle = '#c07060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 13);
    ctx.quadraticCurveTo(0, 12, 8, 16);
    ctx.stroke();
  } else if (mouthState === 'ouch') {
    ctx.strokeStyle = '#c07060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(-3, 13);
    ctx.lineTo(0, 16);
    ctx.lineTo(3, 13);
    ctx.lineTo(6, 16);
    ctx.stroke();
  }

  // Ears
  ctx.fillStyle = '#ecc8a8';
  ctx.beginPath();
  ctx.ellipse(-29, -5, 5, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(29, -5, 5, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawAnimeEye(ctx, x, y) {
  // White
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x, y, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iris
  const irisGrad = ctx.createRadialGradient(x, y + 1, 2, x, y, 7);
  irisGrad.addColorStop(0, '#2050a0');
  irisGrad.addColorStop(0.7, '#183878');
  irisGrad.addColorStop(1, '#102050');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#080818';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 3, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Anime highlight (key detail!)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x + 2, y - 2, 2.5, 2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - 2, y + 3, 1.2, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Upper eyelid line
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, 8, 9, 0, Math.PI + 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
}

function drawNarrowEye(ctx, x, y) {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x, y, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#183878';
  ctx.beginPath();
  ctx.ellipse(x, y, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#080818';
  ctx.beginPath();
  ctx.ellipse(x, y, 2.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x + 2, y - 1, 1.5, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 2);
  ctx.quadraticCurveTo(x, y - 5, x + 8, y - 2);
  ctx.stroke();
}

function drawDizzyEye(ctx, x, y) {
  const t = gameTime * 6;
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  // Spiral eyes
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 4; a += 0.3) {
    const r = a * 1.2;
    const px = x + Math.cos(a + t) * r;
    const py = y + Math.sin(a + t) * r;
    if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawClosedEye(ctx, x, y) {
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.quadraticCurveTo(x, y + 5, x + 7, y);
  ctx.stroke();
}

function drawStarsOverHead(ctx, x, y) {
  const numStars = 3;
  for (let i = 0; i < numStars; i++) {
    const angle = gameTime * 3 + (i * Math.PI * 2 / numStars);
    const sx = x + Math.cos(angle) * 25;
    const sy = y + Math.sin(angle * 0.5) * 5 - 5;
    drawStarShape(ctx, sx, sy, 5, '#ffdd00', '#ffaa00');
  }
}

function drawStarShape(ctx, x, y, size, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
    const r = i === 0 ? size : size;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    const outerA = (i * 2 * Math.PI / 5) - Math.PI / 2;
    const innerA = outerA + Math.PI / 5;
    ctx.lineTo(x + Math.cos(outerA) * size, y + Math.sin(outerA) * size);
    ctx.lineTo(x + Math.cos(innerA) * size * 0.4, y + Math.sin(innerA) * size * 0.4);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// --- PLAYER CHARACTER (seen from behind, Punch-Out!! style) ---

export function drawAttackName(ctx, name, isUnblockable, timer) {
  ctx.save();
  ctx.textAlign = 'center';

  const fadeIn = Math.min(1, timer / 0.1);
  const scale = 0.85 + 0.15 * fadeIn;

  ctx.translate(400, 180);
  ctx.scale(scale, scale);
  ctx.globalAlpha = fadeIn;

  ctx.font = 'bold italic 42px "Segoe UI", Arial, sans-serif';

  // Dark backdrop ribbon
  const tw = ctx.measureText(name).width;
  const padX = 20, padY = 20;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - padX, -padY - 10, tw + padX * 2, padY * 2 + 10, 10);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 4;
  ctx.strokeText(name, 0, 0);

  if (isUnblockable) {
    const pulse = 0.7 + 0.3 * Math.sin(gameTime * 6);
    ctx.fillStyle = `rgba(255,${Math.floor(100 + 60 * pulse)},30,${pulse})`;
    ctx.shadowColor = 'rgba(255,80,0,0.6)';
    ctx.shadowBlur = 12;
  } else {
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 6;
  }
  ctx.fillText(name, 0, 0);

  ctx.globalAlpha = 1;
  ctx.restore();
}

export function computePlayerPose(player) {
  const bob = Math.sin(gameTime * 3) * 2;

  let bodyOffsetX = 0, bodyOffsetY = 0;
  let bodyRotate = 0;
  let shoulderTiltL = 0, shoulderTiltR = 0;
  let leftGloveX = -70, leftGloveY = -90;
  let rightGloveX = 70, rightGloveY = -90;
  let headOffsetX = 0, headOffsetY = 0;
  let glowColor = null;

  switch (player.action) {
    case 'idle':
      bodyOffsetY = bob;
      headOffsetY = bob * 0.7;
      break;
    case 'punchLeft':
      leftGloveX = -20;
      leftGloveY = -160;
      bodyRotate = 0.08;
      bodyOffsetX = 8;
      headOffsetX = 5;
      shoulderTiltL = -6;
      rightGloveY += 10;
      break;
    case 'punchRight':
      rightGloveX = 20;
      rightGloveY = -160;
      bodyRotate = -0.08;
      bodyOffsetX = -8;
      headOffsetX = -5;
      shoulderTiltR = -6;
      leftGloveY += 10;
      break;
    case 'dodgeLeft':
      bodyOffsetX = -60;
      headOffsetX = -65;
      bodyRotate = -0.18;
      shoulderTiltL = 8;
      shoulderTiltR = -12;
      leftGloveX -= 50;
      rightGloveX -= 50;
      headOffsetY = 8;
      break;
    case 'dodgeRight':
      bodyOffsetX = 60;
      headOffsetX = 65;
      bodyRotate = 0.18;
      shoulderTiltL = -12;
      shoulderTiltR = 8;
      leftGloveX += 50;
      rightGloveX += 50;
      headOffsetY = 8;
      break;
    case 'block':
      leftGloveX = -25;
      leftGloveY = -120;
      rightGloveX = 25;
      rightGloveY = -120;
      headOffsetY = 12;
      shoulderTiltL = 5;
      shoulderTiltR = 5;
      break;
    case 'special':
      leftGloveX = -18;
      leftGloveY = -155;
      rightGloveX = 18;
      rightGloveY = -155;
      bodyOffsetY = -10;
      headOffsetY = -8;
      glowColor = 'rgba(255,220,80,0.5)';
      break;
    case 'stunned':
      bodyOffsetX = Math.sin(gameTime * 6) * 15;
      headOffsetX = Math.sin(gameTime * 7) * 18;
      headOffsetY = 10 + Math.sin(gameTime * 5) * 5;
      bodyRotate = Math.sin(gameTime * 4) * 0.06;
      leftGloveY = -50;
      rightGloveY = -50;
      leftGloveX = -80 + Math.sin(gameTime * 5) * 10;
      rightGloveX = 80 + Math.cos(gameTime * 5) * 10;
      break;
  }

  return {
    bodyOffsetX, bodyOffsetY, bodyRotate,
    shoulderTiltL, shoulderTiltR,
    leftGloveX, leftGloveY, rightGloveX, rightGloveY,
    headOffsetX, headOffsetY, glowColor,
  };
}

export function drawPlayer(ctx, player) {
  const pose = computePlayerPose(player);
  if (getStyle() === 'anime') {
    drawPlayerAnime(ctx, pose, player);
  } else {
    drawPlayerClassic(ctx, pose, player);
  }
}

function drawPlayerAnime(ctx, pose, player) {
  ctx.save();
  const W = 800, H = 600;
  const baseX = 400, baseY = 480;

  const { bodyOffsetX, bodyOffsetY, bodyRotate,
          shoulderTiltL, shoulderTiltR,
          leftGloveX, leftGloveY, rightGloveX, rightGloveY,
          headOffsetX, headOffsetY, glowColor } = pose;

  ctx.translate(baseX + bodyOffsetX, baseY + bodyOffsetY);
  ctx.rotate(bodyRotate);

  // Shadow on floor
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 40, 75, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skin colors
  const skinBase = '#d4a070';
  const skinShadow = '#a87848';
  const skinHighlight = '#e4b888';

  // Upper back / torso (white tank top) - cel shaded
  const tankBase = '#eeeee8';
  const tankShadow = '#c8c8c0';
  ctx.fillStyle = tankBase;
  ctx.beginPath();
  ctx.moveTo(-55, -32 + shoulderTiltL);
  ctx.quadraticCurveTo(-58, 0, -48, 42);
  ctx.lineTo(48, 42);
  ctx.quadraticCurveTo(58, 0, 55, -32 + shoulderTiltR);
  ctx.quadraticCurveTo(32, -45, 0, -43);
  ctx.quadraticCurveTo(-32, -45, -55, -32 + shoulderTiltL);
  ctx.closePath();
  ctx.fill();

  // Tank shadow (left side = shadow)
  ctx.fillStyle = tankShadow;
  ctx.beginPath();
  ctx.moveTo(-55, -32 + shoulderTiltL);
  ctx.quadraticCurveTo(-58, 0, -48, 42);
  ctx.lineTo(0, 42);
  ctx.lineTo(0, -43);
  ctx.quadraticCurveTo(-32, -45, -55, -32 + shoulderTiltL);
  ctx.closePath();
  ctx.fill();

  // Tank top straps
  ctx.fillStyle = tankBase;
  ctx.beginPath();
  ctx.moveTo(-20, -62);
  ctx.quadraticCurveTo(-24, -48, -30, -37);
  ctx.lineTo(-40, -32 + shoulderTiltL);
  ctx.lineTo(-51, -30 + shoulderTiltL);
  ctx.quadraticCurveTo(-37, -44, -24, -58);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -62);
  ctx.quadraticCurveTo(24, -48, 30, -37);
  ctx.lineTo(40, -32 + shoulderTiltR);
  ctx.lineTo(51, -30 + shoulderTiltR);
  ctx.quadraticCurveTo(37, -44, 24, -58);
  ctx.closePath();
  ctx.fill();

  // Strap stitching details
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  // Left strap stitch
  ctx.beginPath();
  ctx.moveTo(-22, -60);
  ctx.quadraticCurveTo(-26, -46, -34, -34);
  ctx.stroke();
  // Right strap stitch
  ctx.beginPath();
  ctx.moveTo(22, -60);
  ctx.quadraticCurveTo(26, -46, 34, -34);
  ctx.stroke();
  ctx.setLineDash([]);

  // Wrinkle lines that shift with body rotation
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  const wrinkleShift = bodyRotate * 30;
  ctx.beginPath();
  ctx.moveTo(-20 + wrinkleShift, -10);
  ctx.quadraticCurveTo(0 + wrinkleShift, -8, 20 + wrinkleShift, -12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-18 + wrinkleShift, 10);
  ctx.quadraticCurveTo(0 + wrinkleShift, 12, 18 + wrinkleShift, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-15 + wrinkleShift, 28);
  ctx.quadraticCurveTo(0 + wrinkleShift, 30, 15 + wrinkleShift, 26);
  ctx.stroke();

  // Muscle definition - spine shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.quadraticCurveTo(1, 0, 0, 38);
  ctx.stroke();

  // Shoulder blade shadows (defined)
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.moveTo(-16, -22);
  ctx.quadraticCurveTo(-28, -8, -22, 8);
  ctx.quadraticCurveTo(-18, 2, -14, -10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, -22);
  ctx.quadraticCurveTo(28, -8, 22, 8);
  ctx.quadraticCurveTo(18, 2, 14, -10);
  ctx.closePath();
  ctx.fill();

  // Trapezius definition (shadow between neck and shoulders)
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.beginPath();
  ctx.moveTo(-10, -50);
  ctx.quadraticCurveTo(-30, -40, -48, -32 + shoulderTiltL);
  ctx.quadraticCurveTo(-35, -38, -10, -44);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, -50);
  ctx.quadraticCurveTo(30, -40, 48, -32 + shoulderTiltR);
  ctx.quadraticCurveTo(35, -38, 10, -44);
  ctx.closePath();
  ctx.fill();

  // Shoulders (exposed skin) - cel shaded
  // Left shoulder
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(-51, -34 + shoulderTiltL, 16, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Shoulder shadow
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.ellipse(-51, -34 + shoulderTiltL, 16, 12, -0.3, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();
  // Deltoid highlight
  ctx.fillStyle = skinHighlight;
  ctx.beginPath();
  ctx.ellipse(-47, -38 + shoulderTiltL, 6, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Right shoulder
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(51, -34 + shoulderTiltR, 16, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.ellipse(51, -34 + shoulderTiltR, 16, 12, 0.3, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();
  ctx.fillStyle = skinHighlight;
  ctx.beginPath();
  ctx.ellipse(47, -38 + shoulderTiltR, 6, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Arms (foreshortened) - cel shaded
  // Left arm
  ctx.save();
  ctx.translate(-51, -27 + shoulderTiltL);
  ctx.fillStyle = skinBase;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.strokeStyle = skinBase;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo((leftGloveX + 51) * 0.6, (leftGloveY + 27 - shoulderTiltL) * 0.6);
  ctx.stroke();
  // Arm shadow line
  ctx.strokeStyle = skinShadow;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo((leftGloveX + 51) * 0.6 - 4, (leftGloveY + 27 - shoulderTiltL) * 0.6);
  ctx.stroke();
  ctx.restore();

  // Right arm
  ctx.save();
  ctx.translate(51, -27 + shoulderTiltR);
  ctx.strokeStyle = skinBase;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo((rightGloveX - 51) * 0.6, (rightGloveY + 27 - shoulderTiltR) * 0.6);
  ctx.stroke();
  ctx.strokeStyle = skinShadow;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo((rightGloveX - 51) * 0.6 + 4, (rightGloveY + 27 - shoulderTiltR) * 0.6);
  ctx.stroke();
  ctx.restore();

  // Rim light on right side of body
  ctx.strokeStyle = 'rgba(255,245,210,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(55, -32 + shoulderTiltR);
  ctx.quadraticCurveTo(58, 0, 48, 42);
  ctx.stroke();

  // Glow effects
  if (glowColor) {
    ctx.shadowColor = '#ffdd55';
    ctx.shadowBlur = 35;
  }
  if (player.blockFlashTimer > 0) {
    const flashAlpha = player.blockFlashTimer / 0.3;
    ctx.shadowColor = `rgba(255,255,200,${flashAlpha})`;
    ctx.shadowBlur = 25 * flashAlpha;
  }

  // Gloves with anime aura
  ctx.save();
  // Red aura on gloves
  const auraAlpha = 0.12 + Math.sin(gameTime * 4) * 0.05;
  ctx.shadowColor = `rgba(255,50,30,${auraAlpha})`;
  ctx.shadowBlur = 12;
  drawGlove(ctx, leftGloveX, leftGloveY, true);
  drawGlove(ctx, rightGloveX, rightGloveY, false);
  ctx.restore();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Neck - cel shaded
  ctx.fillStyle = skinBase;
  ctx.fillRect(-9, -64, 18, 18);
  ctx.fillStyle = skinShadow;
  ctx.fillRect(-9, -64, 9, 18);

  // Head (back of head)
  const headX = headOffsetX;
  const headY = -82 + headOffsetY;
  ctx.save();
  ctx.translate(headX, headY);

  // Head shape - dark short hair, cel shaded
  ctx.fillStyle = '#1a0e05';
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shadow half
  ctx.fillStyle = '#0e0804';
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 30, 0, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();

  // Individual hair strand details
  ctx.strokeStyle = 'rgba(50,30,15,0.5)';
  ctx.lineWidth = 1;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 5, -24);
    ctx.quadraticCurveTo(i * 6 + 1, -2, i * 4, 22);
    ctx.stroke();
  }
  // Stray strands at nape
  ctx.strokeStyle = 'rgba(40,25,12,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, 24);
  ctx.quadraticCurveTo(-8, 30, -5, 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 25);
  ctx.quadraticCurveTo(5, 31, 4, 35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, 26);
  ctx.quadraticCurveTo(-1, 32, -3, 36);
  ctx.stroke();

  // Hair highlight
  ctx.fillStyle = 'rgba(60,40,25,0.3)';
  ctx.beginPath();
  ctx.ellipse(5, -12, 10, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Top of hair
  ctx.fillStyle = '#1a0e05';
  ctx.beginPath();
  ctx.ellipse(0, -18, 24, 15, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Ears - cel shaded
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(-26, 2, 6, 9, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(26, 2, 6, 9, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Ear shadow
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.ellipse(-26, 2, 4, 6, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,150,110,0.5)';
  ctx.beginPath();
  ctx.ellipse(26, 2, 4, 6, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Neck base skin
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(0, 24, 13, 7, 0, 0, Math.PI);
  ctx.fill();

  // Rim light on right side of head
  ctx.strokeStyle = 'rgba(255,245,210,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 26, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();

  ctx.restore();

  // Stars for stunned
  if (player.action === 'stunned') {
    drawStarsOverHead(ctx, headX, headY - 35);
  }

  // Invincibility - golden sparkle particles
  if (player.invincible) {
    const pulse = 0.3 + 0.7 * Math.abs(Math.sin(gameTime * 8));
    ctx.save();
    // Aura
    ctx.shadowColor = `rgba(255,220,80,${pulse})`;
    ctx.shadowBlur = 30;
    ctx.strokeStyle = `rgba(255,255,200,${pulse * 0.6})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -30, 65, 85, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Sparkle particles
    for (let i = 0; i < 8; i++) {
      const angle = gameTime * 2 + i * Math.PI / 4;
      const dist = 60 + Math.sin(gameTime * 3 + i * 1.5) * 20;
      const px = Math.cos(angle) * dist;
      const py = -30 + Math.sin(angle) * dist * 0.8;
      const sparkleSize = 2 + Math.sin(gameTime * 6 + i) * 1;
      const sparkleAlpha = 0.4 + 0.4 * Math.sin(gameTime * 5 + i * 2);
      ctx.fillStyle = `rgba(255,230,100,${sparkleAlpha})`;
      // 4-pointed star sparkle
      ctx.beginPath();
      ctx.moveTo(px, py - sparkleSize);
      ctx.lineTo(px + sparkleSize * 0.3, py);
      ctx.lineTo(px, py + sparkleSize);
      ctx.lineTo(px - sparkleSize * 0.3, py);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px - sparkleSize, py);
      ctx.lineTo(px, py + sparkleSize * 0.3);
      ctx.lineTo(px + sparkleSize, py);
      ctx.lineTo(px, py - sparkleSize * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawPlayerClassic(ctx, pose, player) {
  ctx.save();
  const W = 800, H = 600;
  const baseX = 400, baseY = 480;

  const { bodyOffsetX, bodyOffsetY, bodyRotate,
          shoulderTiltL, shoulderTiltR,
          leftGloveX, leftGloveY, rightGloveX, rightGloveY,
          headOffsetX, headOffsetY, glowColor } = pose;

  ctx.translate(baseX + bodyOffsetX, baseY + bodyOffsetY);
  ctx.rotate(bodyRotate);

  // Shadow on floor
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 40, 70, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Upper back / torso (white tank top, seen from behind)
  const tankGrad = ctx.createLinearGradient(-50, -60, 50, 30);
  tankGrad.addColorStop(0, '#f0f0f0');
  tankGrad.addColorStop(0.5, '#e0e0e0');
  tankGrad.addColorStop(1, '#c8c8c8');
  ctx.fillStyle = tankGrad;
  ctx.beginPath();
  ctx.moveTo(-52, -30 + shoulderTiltL);
  ctx.quadraticCurveTo(-55, 0, -45, 40);
  ctx.lineTo(45, 40);
  ctx.quadraticCurveTo(55, 0, 52, -30 + shoulderTiltR);
  ctx.quadraticCurveTo(30, -42, 0, -40);
  ctx.quadraticCurveTo(-30, -42, -52, -30 + shoulderTiltL);
  ctx.closePath();
  ctx.fill();

  // Tank top straps
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.moveTo(-18, -60);
  ctx.quadraticCurveTo(-22, -45, -28, -35);
  ctx.lineTo(-38, -30 + shoulderTiltL);
  ctx.lineTo(-48, -28 + shoulderTiltL);
  ctx.quadraticCurveTo(-35, -42, -22, -55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, -60);
  ctx.quadraticCurveTo(22, -45, 28, -35);
  ctx.lineTo(38, -30 + shoulderTiltR);
  ctx.lineTo(48, -28 + shoulderTiltR);
  ctx.quadraticCurveTo(35, -42, 22, -55);
  ctx.closePath();
  ctx.fill();

  // Back muscle definition (subtle lines)
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1.5;
  // Spine
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.quadraticCurveTo(1, 0, 0, 35);
  ctx.stroke();
  // Shoulder blades
  ctx.beginPath();
  ctx.moveTo(-15, -20);
  ctx.quadraticCurveTo(-25, -5, -18, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15, -20);
  ctx.quadraticCurveTo(25, -5, 18, 10);
  ctx.stroke();

  // Skin color for shoulders/neck
  const skinColor = '#d4a070';
  const skinDark = '#b88050';

  // Left shoulder (exposed skin above strap)
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.ellipse(-48, -32 + shoulderTiltL, 14, 10, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Right shoulder
  ctx.beginPath();
  ctx.ellipse(48, -32 + shoulderTiltR, 14, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Left arm (foreshortened, going toward screen)
  ctx.save();
  ctx.translate(-48, -25 + shoulderTiltL);
  const lArmAngle = Math.atan2(leftGloveY - (-25 + shoulderTiltL), leftGloveX - (-48));
  // Upper arm skin
  const armGrad = ctx.createLinearGradient(0, 0, leftGloveX + 48, leftGloveY + 25 - shoulderTiltL);
  armGrad.addColorStop(0, skinColor);
  armGrad.addColorStop(1, skinDark);
  ctx.strokeStyle = armGrad;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo((leftGloveX + 48) * 0.6, (leftGloveY + 25 - shoulderTiltL) * 0.6);
  ctx.stroke();
  ctx.restore();

  // Right arm
  ctx.save();
  ctx.translate(48, -25 + shoulderTiltR);
  const rArmGrad = ctx.createLinearGradient(0, 0, rightGloveX - 48, rightGloveY + 25 - shoulderTiltR);
  rArmGrad.addColorStop(0, skinColor);
  rArmGrad.addColorStop(1, skinDark);
  ctx.strokeStyle = rArmGrad;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo((rightGloveX - 48) * 0.6, (rightGloveY + 25 - shoulderTiltR) * 0.6);
  ctx.stroke();
  ctx.restore();

  // Glow effect for special
  if (glowColor) {
    ctx.shadowColor = '#ffdd55';
    ctx.shadowBlur = 30;
  }

  // Block flash glow
  if (player.blockFlashTimer > 0) {
    const flashAlpha = player.blockFlashTimer / 0.3;
    ctx.shadowColor = `rgba(255,255,200,${flashAlpha})`;
    ctx.shadowBlur = 25 * flashAlpha;
  }

  // Gloves
  drawGlove(ctx, leftGloveX, leftGloveY, true);
  drawGlove(ctx, rightGloveX, rightGloveY, false);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Neck
  ctx.fillStyle = skinColor;
  ctx.fillRect(-8, -62, 16, 16);

  // Head (back of head - dark short hair)
  const headX = headOffsetX;
  const headY = -80 + headOffsetY;
  ctx.save();
  ctx.translate(headX, headY);

  // Head shape (back view - slightly oval)
  const headGrad = ctx.createRadialGradient(0, 0, 5, 0, -3, 28);
  headGrad.addColorStop(0, '#2a1a0a');
  headGrad.addColorStop(0.7, '#1a0e05');
  headGrad.addColorStop(1, '#0e0804');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair texture lines (back of head)
  ctx.strokeStyle = 'rgba(60,40,20,0.4)';
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 5, -22);
    ctx.quadraticCurveTo(i * 6, 0, i * 4, 20);
    ctx.stroke();
  }

  // Top of hair - slightly rounded
  ctx.fillStyle = '#2a1a0a';
  ctx.beginPath();
  ctx.ellipse(0, -16, 22, 14, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Ears (visible from behind)
  ctx.fillStyle = '#d4a070';
  ctx.beginPath();
  ctx.ellipse(-24, 2, 5, 8, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(24, 2, 5, 8, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Ear inner
  ctx.fillStyle = '#c08858';
  ctx.beginPath();
  ctx.ellipse(-24, 2, 3, 5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(24, 2, 3, 5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Neck line at base of head
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.ellipse(0, 22, 12, 6, 0, 0, Math.PI);
  ctx.fill();

  ctx.restore();

  // Stars over head when stunned
  if (player.action === 'stunned') {
    drawStarsOverHead(ctx, headX, headY - 35);
  }

  // Invincibility glow
  if (player.invincible) {
    const pulse = 0.3 + 0.7 * Math.abs(Math.sin(gameTime * 8));
    ctx.save();
    ctx.shadowColor = `rgba(255,220,80,${pulse})`;
    ctx.shadowBlur = 25;
    ctx.strokeStyle = `rgba(255,255,200,${pulse * 0.6})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -30, 60, 80, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawGlove(ctx, x, y, isLeft) {
  ctx.save();
  ctx.translate(x, y);
  if (!isLeft) ctx.scale(-1, 1);

  // Main glove body
  const gloveGrad = ctx.createRadialGradient(0, 0, 5, 0, -5, 35);
  gloveGrad.addColorStop(0, '#e63030');
  gloveGrad.addColorStop(0.6, '#c41818');
  gloveGrad.addColorStop(1, '#8a0f0f');
  ctx.fillStyle = gloveGrad;

  ctx.beginPath();
  ctx.moveTo(-28, -10);
  ctx.quadraticCurveTo(-32, -25, -20, -30);
  ctx.quadraticCurveTo(0, -35, 20, -28);
  ctx.quadraticCurveTo(32, -20, 30, 0);
  ctx.quadraticCurveTo(28, 18, 10, 22);
  ctx.quadraticCurveTo(-5, 24, -20, 18);
  ctx.quadraticCurveTo(-30, 10, -28, -10);
  ctx.closePath();
  ctx.fill();

  // Thumb
  ctx.fillStyle = '#b81515';
  ctx.beginPath();
  ctx.ellipse(-22, 5, 8, 12, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Knuckle ridges
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const kx = -12 + i * 9;
    ctx.beginPath();
    ctx.arc(kx, -22, 6, Math.PI * 0.8, Math.PI * 0.2, true);
    ctx.stroke();
  }

  // Lacing
  ctx.strokeStyle = '#f5e8d0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-15, 16);
  ctx.quadraticCurveTo(0, 20, 15, 16);
  ctx.stroke();
  // Lace X's
  for (let i = 0; i < 3; i++) {
    const lx = -8 + i * 8;
    ctx.beginPath();
    ctx.moveTo(lx - 2, 12);
    ctx.lineTo(lx + 2, 18);
    ctx.moveTo(lx + 2, 12);
    ctx.lineTo(lx - 2, 18);
    ctx.stroke();
  }

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(-5, -18, 15, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// --- HIT EFFECTS ---

export function drawHitEffects(ctx) {
  for (const e of hitEffects) {
    const progress = 1 - e.life / e.maxLife;
    const alpha = 1 - progress;
    const radius = 20 + progress * 40;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.globalAlpha = alpha;

    // White flash circle
    const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    flashGrad.addColorStop(0, 'rgba(255,255,220,0.9)');
    flashGrad.addColorStop(0.5, 'rgba(255,255,180,0.4)');
    flashGrad.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Radiating lines
    ctx.strokeStyle = `rgba(255,255,200,${alpha})`;
    ctx.lineWidth = 2;
    const numLines = 8;
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2 + progress * 0.5;
      const innerR = radius * 0.3;
      const outerR = radius * 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// --- COMIC TEXT EFFECTS ---

export function addComicText(x, y, customWord) {
  const word = customWord || COMIC_WORDS[Math.floor(Math.random() * COMIC_WORDS.length)];
  comicTexts.push({
    x: x + (Math.random() - 0.5) * 60,
    y: y - 20 + (Math.random() - 0.5) * 30,
    word,
    life: 0.5,
    maxLife: 0.5,
    rotate: (Math.random() - 0.5) * 0.4,
  });
}

export function drawComicTexts(ctx) {
  for (const t of comicTexts) {
    const progress = 1 - t.life / t.maxLife;
    const alpha = 1 - progress;
    const scale = 0.5 + progress * 1.0;

    ctx.save();
    ctx.translate(t.x, t.y - progress * 30);
    ctx.rotate(t.rotate);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(t.word, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillText(t.word, 0, 0);

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// --- PLAYER KNOCKDOWN OVERLAY ---

export function drawPlayerKnockdownOverlay(ctx, timer) {
  const W = 800, H = 600;
  // Red vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 450);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.7, 'rgba(80,0,0,0.3)');
  vig.addColorStop(1, 'rgba(120,0,0,0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

}

// --- SPEECH BUBBLE ---

export function drawSpeechBubble(ctx, text, x, y, alpha) {
  if (!text) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.font = '16px "Segoe UI", Arial, sans-serif';
  const tw = ctx.measureText(text).width;
  const padX = 14, padY = 10;
  const bw = tw + padX * 2;
  const bh = 28 + padY * 2;
  const bx = x - bw / 2;
  const by = y - bh;

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  // Bubble
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Triangular pointer at bottom center
  ctx.beginPath();
  ctx.moveTo(x - 8, by + bh);
  ctx.lineTo(x + 8, by + bh);
  ctx.lineTo(x, by + bh + 12);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, by + bh / 2 + 6);

  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- TELEGRAPH PROP DRAWING ---

export function drawTelegraphProp(ctx, opp) {
  if (opp.state !== 'telegraph') return;
  ctx.save();
  ctx.translate(400, 300);

  if (opp.telegraphType === 'sipCoffee') {
    // Coffee mug near right hand
    ctx.translate(65, -40);
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(-8, -12, 16, 18);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(-6, -10, 12, 14);
    // Handle
    ctx.strokeStyle = '#e8e0d0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(10, -3, 6, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    // Steam
    const st = gameTime * 4;
    ctx.strokeStyle = 'rgba(200,200,200,0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-4 + i * 4, -14);
      ctx.quadraticCurveTo(-4 + i * 4 + Math.sin(st + i) * 3, -22, -4 + i * 4 + Math.sin(st + i + 1) * 2, -28);
      ctx.stroke();
    }
  } else if (opp.telegraphType === 'raiseClipboard') {
    ctx.translate(58, -55);
    ctx.rotate(-0.15);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(-10, -18, 22, 30);
    ctx.fillStyle = '#f5f0e0';
    ctx.fillRect(-8, -14, 18, 24);
    // Lines on clipboard
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-5, -10 + i * 5);
      ctx.lineTo(7, -10 + i * 5);
      ctx.stroke();
    }
    // Clip
    ctx.fillStyle = '#aaa';
    ctx.fillRect(-4, -20, 10, 5);
  } else if (opp.telegraphType === 'checkPhone') {
    ctx.translate(60, -45);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.roundRect(-7, -12, 14, 22, 2);
    ctx.fill();
    ctx.fillStyle = '#4488cc';
    ctx.fillRect(-5, -9, 10, 16);
  }

  ctx.restore();
}

// --- COLOR HELPERS ---

function lightenColor(hex, amount) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, amount) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r},${g},${b})`;
}

function getHairColor(suitColor) {
  const r = parseInt(suitColor.slice(1, 3), 16);
  const g = parseInt(suitColor.slice(3, 5), 16);
  const b = parseInt(suitColor.slice(5, 7), 16);
  // Dark version of suit color with some brown
  return `rgb(${Math.max(20, Math.floor(r * 0.3 + 30))},${Math.max(15, Math.floor(g * 0.2 + 20))},${Math.max(10, Math.floor(b * 0.2 + 15))})`;
}
