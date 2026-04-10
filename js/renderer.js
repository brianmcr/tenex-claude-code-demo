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

export function drawOpponent(ctx, opp) {
  ctx.save();
  const baseX = 400, baseY = 300;

  let charScale = 1.0;
  if (opp.name === 'The Intern') charScale = 0.85;
  else if (opp.name === 'The CEO') charScale = 1.1;

  let offsetX = 0, offsetY = 0, rotate = 0, scaleX = 1, scaleY = 1;
  let leftArmAngle = 0, rightArmAngle = 0;
  let leftGloveExtend = 0, rightGloveExtend = 0;
  let eyeState = 'normal'; // normal, narrow, dizzy, closed
  let mouthState = 'neutral'; // neutral, open, smirk, ouch

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
      // CEO smirk telegraph: add red/orange glow outline as universal "incoming!" signal
      if (opp.telegraphType === 'smirk' || opp.telegraphType === 'adjustCufflinks') {
        const glowPulse = 0.4 + 0.6 * Math.abs(Math.sin(gameTime * 8));
        ctx.save();
        ctx.shadowColor = `rgba(255,100,0,${glowPulse})`;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = `rgba(255,120,30,${glowPulse * 0.6})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 55, 100, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
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
      const fallT = Math.min(1, (gameTime % 100));
      offsetY = 120;
      rotate = -0.5;
      scaleY = 0.65;
      scaleX = 1.1;
      eyeState = 'closed';
      mouthState = 'ouch';
      break;
    }
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
  if (oppName === 'The CEO') {
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

// --- PLAYER GLOVES ---

export function drawPlayer(ctx, player) {
  ctx.save();
  const W = 800, H = 600;
  let leftX = 240, leftY = 500;
  let rightX = 560, rightY = 500;
  const bob = Math.sin(gameTime * 3) * 3;
  let glowColor = null;

  switch (player.action) {
    case 'idle':
      leftY += bob;
      rightY += bob;
      break;
    case 'punchLeft':
      leftX = 370;
      leftY = 340;
      rightY += 10;
      break;
    case 'punchRight':
      rightX = 430;
      rightY = 340;
      leftY += 10;
      break;
    case 'dodgeLeft':
      leftX -= 120;
      rightX -= 120;
      break;
    case 'dodgeRight':
      leftX += 120;
      rightX += 120;
      break;
    case 'block':
      leftX = 330;
      leftY = 380;
      rightX = 470;
      rightY = 380;
      break;
    case 'special':
      leftX = 340;
      leftY = 360;
      rightX = 460;
      rightY = 360;
      glowColor = 'rgba(255,220,80,0.5)';
      break;
    case 'stunned':
      leftY = 540 + Math.sin(gameTime * 8) * 8;
      rightY = 540 + Math.cos(gameTime * 8) * 8;
      leftX += Math.sin(gameTime * 6) * 15;
      rightX += Math.cos(gameTime * 6) * 15;
      break;
  }

  // Glow effect for special
  if (glowColor) {
    ctx.shadowColor = '#ffdd55';
    ctx.shadowBlur = 30;
  }

  drawGlove(ctx, leftX, leftY, true);
  drawGlove(ctx, rightX, rightY, false);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Forearm hints (from bottom of screen)
  ctx.strokeStyle = '#c49060';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(leftX, leftY + 25);
  ctx.lineTo(200, H + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rightX, rightY + 25);
  ctx.lineTo(600, H + 30);
  ctx.stroke();

  // Shirt sleeve cuff hints
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(leftX - 8, leftY + 22);
  ctx.lineTo(leftX + 8, leftY + 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rightX - 8, rightY + 22);
  ctx.lineTo(rightX + 8, rightY + 22);
  ctx.stroke();

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

export function addComicText(x, y) {
  const word = COMIC_WORDS[Math.floor(Math.random() * COMIC_WORDS.length)];
  comicTexts.push({
    x: x + (Math.random() - 0.5) * 40,
    y: y - 20 + (Math.random() - 0.5) * 20,
    word,
    life: 0.4,
    maxLife: 0.4,
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

    ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
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

  // Screen tilt via slight rotation effect
  const tiltAmt = Math.sin(timer * 2) * 0.02;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(tiltAmt);
  ctx.translate(-W / 2, -H / 2);
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
