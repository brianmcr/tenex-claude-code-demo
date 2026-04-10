let uiTime = 0;

export function updateUITime(dt) {
  uiTime += dt;
}

// --- HUD ---

export function drawHUD(ctx, player, opp) {
  const W = 800;
  const barW = 250, barH = 18, barY = 16;

  // Opponent name
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(opp.name, W / 2, 20);
  ctx.textAlign = 'left';

  // Player health bar (left side)
  drawBar(ctx, 20, barY + 12, barW, barH, player.health / player.maxHealth, '#22cc44', '#116622', 'P');

  // Opponent health bar (right side)
  drawBar(ctx, W - 20 - barW, barY + 12, barW, barH, opp.health / opp.maxHealth, '#dd3333', '#771818', 'O');

  // Stamina bar (below player health)
  drawBar(ctx, 20, barY + 36, barW * 0.8, 10, player.stamina / player.maxStamina, '#ddaa22', '#886611', null);

  // Star icons
  const starY = barY + 56;
  for (let i = 0; i < player.maxStars; i++) {
    drawStarIcon(ctx, 30 + i * 24, starY, 8, i < player.stars);
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

  // Spotlight
  const spot = ctx.createRadialGradient(W / 2, H * 0.35, 30, W / 2, H * 0.35, 350);
  spot.addColorStop(0, 'rgba(60,50,80,0.4)');
  spot.addColorStop(0.5, 'rgba(30,25,50,0.2)');
  spot.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, W, H);

  // Ring ropes hint
  ctx.strokeStyle = 'rgba(200,180,160,0.15)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 350 + i * 30);
    ctx.quadraticCurveTo(400, 340 + i * 30, 800, 350 + i * 30);
    ctx.stroke();
  }

  // Title text with shadow
  ctx.save();
  ctx.textAlign = 'center';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = 'bold 58px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CORPORATE KNOCKOUT', W / 2 + 3, 203);

  // Main title
  const titleGrad = ctx.createLinearGradient(0, 160, 0, 220);
  titleGrad.addColorStop(0, '#fff');
  titleGrad.addColorStop(0.5, '#ffdd88');
  titleGrad.addColorStop(1, '#cc8833');
  ctx.fillStyle = titleGrad;
  ctx.fillText('CORPORATE KNOCKOUT', W / 2, 200);

  // Subtitle
  ctx.font = '22px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#8888aa';
  ctx.fillText('Fight Your Way to the Top', W / 2, 245);

  // Pulsing "Press ENTER to Start"
  const pulse = 0.5 + 0.5 * Math.sin(uiTime * 3);
  ctx.font = '20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = `rgba(200,200,220,${0.3 + pulse * 0.7})`;
  ctx.fillText('Press ENTER to Start', W / 2, 400);

  // Controls
  ctx.font = '13px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(150,150,170,0.6)';
  ctx.fillText('Z / X = Punch   |   \u2190 \u2192 = Dodge   |   \u2193 = Block   |   SPACE = Special', W / 2, 520);

  ctx.restore();
}

// --- INTRO SCREEN ---

export function drawIntroScreen(ctx, opp) {
  const W = 800, H = 600;

  // Dark background with colored tint
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  const tint = ctx.createRadialGradient(300, 300, 50, 300, 300, 350);
  tint.addColorStop(0, hexToRGBA(opp.color, 0.15));
  tint.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);

  // Portrait placeholder (colored rectangle with silhouette)
  ctx.fillStyle = opp.color;
  ctx.fillRect(80, 120, 250, 340);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(80, 120, 250, 340);

  // Silhouette in portrait
  ctx.fillStyle = darkenHex(opp.color, 60);
  ctx.beginPath();
  ctx.ellipse(205, 230, 45, 50, 0, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(140, 290);
  ctx.quadraticCurveTo(140, 420, 160, 460);
  ctx.lineTo(250, 460);
  ctx.quadraticCurveTo(270, 420, 270, 290);
  ctx.closePath();
  ctx.fill();

  // Border
  ctx.strokeStyle = opp.color;
  ctx.lineWidth = 3;
  ctx.strokeRect(80, 120, 250, 340);

  // VS badge
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ff4444';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 20;
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

  // Taunt
  ctx.font = '16px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#8888aa';
  wrapText(ctx, opp.taunt, 440, 290, 300, 22);

  ctx.restore();

  // Press ENTER
  const pulse = 0.5 + 0.5 * Math.sin(uiTime * 3);
  ctx.textAlign = 'center';
  ctx.font = '20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = `rgba(200,200,220,${0.3 + pulse * 0.7})`;
  ctx.fillText('Press ENTER to Fight', 400, 530);
  ctx.textAlign = 'left';
}

// --- RESULT SCREEN ---

export function drawResultScreen(ctx, won) {
  const W = 800, H = 600;

  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

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
  ctx.fillText('KO!', W / 2, 260);
  ctx.shadowBlur = 0;

  // Win/lose text
  ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = won ? '#44dd66' : '#dd4444';
  ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE...', W / 2, 340);

  // Continue
  const pulse = 0.5 + 0.5 * Math.sin(uiTime * 3);
  ctx.font = '20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = `rgba(200,200,220,${0.3 + pulse * 0.7})`;
  ctx.fillText('Press ENTER to Continue', W / 2, 440);

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
