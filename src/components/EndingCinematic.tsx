import React, { useEffect, useRef, useState } from 'react';
import { CostumeId, SaveData } from '../types/game';
import { ENDING_SCENE_LINES } from '../data/story';
import { CharacterPortrait } from './CharacterArt';
import { audioSystem } from '../systems/audioSystem';
import { haptics } from '../systems/haptics';

interface Props {
  save: SaveData;
  onContinueExploring: () => void;
}

interface Firework {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  sparkle: boolean;
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number
) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 1.6 / size;
  ctx.beginPath();
  ctx.moveTo(0, 0.35);
  ctx.bezierCurveTo(-1.1, -0.3, -0.95, -1.25, 0, -0.55);
  ctx.bezierCurveTo(0.95, -1.25, 1.1, -0.3, 0, 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Gloss highlight
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.ellipse(-0.35, -0.5, 0.18, 0.1, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGiftBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  boxColor: string,
  ribbonColor: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.4;
  ctx.fillStyle = boxColor;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h, w, h, 4);
  ctx.fill();
  ctx.stroke();
  // Lid
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 2, -h - 4, w + 4, 7, 3);
  ctx.fill();
  ctx.stroke();
  // Ribbon
  ctx.fillStyle = ribbonColor;
  ctx.fillRect(-3.5, -h - 4, 7, h + 4);
  ctx.strokeRect(-3.5, -h - 4, 7, h + 4);
  // Bow loops
  ctx.beginPath();
  ctx.ellipse(-6, -h - 7, 6, 3.8, -0.35, 0, Math.PI * 2);
  ctx.ellipse(6, -h - 7, 6, 3.8, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGroundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, jumpHeight: number) {
  const s = Math.max(0.45, 1 - jumpHeight / 95);
  ctx.save();
  ctx.fillStyle = 'rgba(20, 45, 20, 0.24)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, rx * s, 6.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 1. PAULO (SPFC) — Full storybook character with tricolor jersey, crest & waving SPFC flag */
function drawPauloCelebration(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number) {
  const jump = Math.abs(Math.sin(time * 5.6 + 1.1)) * 15;
  drawGroundShadow(ctx, x, y, 24 * scale, jump);

  ctx.save();
  ctx.translate(x, y - jump * scale);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Waving SPFC Flag (behind right shoulder)
  ctx.save();
  ctx.translate(18, -42);
  ctx.rotate(Math.sin(time * 7.5) * 0.2 + 0.14);
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, -64);
  ctx.stroke();
  // Golden finial
  ctx.fillStyle = '#ffe055';
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -66, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Wavy flag cloth
  const wave = Math.sin(time * 10) * 4;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -62);
  ctx.quadraticCurveTo(22, -66 + wave, 46, -60 - wave);
  ctx.lineTo(46, -32 - wave);
  ctx.quadraticCurveTo(22, -38 + wave, 0, -34);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#d92626';
  ctx.fillRect(0, -54, 48, 7);
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, -44, 48, 7);
  ctx.restore();
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -62);
  ctx.quadraticCurveTo(22, -66 + wave, 46, -60 - wave);
  ctx.lineTo(46, -32 - wave);
  ctx.quadraticCurveTo(22, -38 + wave, 0, -34);
  ctx.closePath();
  ctx.stroke();
  // Mini crest on flag
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.moveTo(18, -53);
  ctx.lineTo(28, -53);
  ctx.lineTo(23, -42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Legs (jeans) + sneakers
  ctx.fillStyle = '#2d5c9a';
  ctx.beginPath();
  ctx.roundRect(-13, -24, 11, 20, 4);
  ctx.roundRect(2, -24, 11, 20, 4);
  ctx.fill();
  ctx.stroke();
  // Sneakers
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-9, -3, 9, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(9, -3, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#d92626';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -2);
  ctx.lineTo(-2, -2);
  ctx.moveTo(2, -2);
  ctx.lineTo(16, -2);
  ctx.stroke();
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.6;

  // Left cheering arm
  ctx.save();
  ctx.translate(-15, -50);
  ctx.rotate(-2.2 + Math.sin(time * 9) * 0.22);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-5, 0, 10, 14, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fbd8b6';
  ctx.beginPath();
  ctx.roundRect(-4.5, 11, 9, 14, 4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 26, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Right arm holding flag
  ctx.save();
  ctx.translate(15, -48);
  ctx.rotate(-0.65 + Math.sin(time * 7.5) * 0.14);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-5, 0, 10, 14, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fbd8b6';
  ctx.beginPath();
  ctx.roundRect(-4.5, 11, 9, 13, 4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 25, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // SPFC Tricolor Jersey Torso
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-17, -56, 34, 36, 9);
  ctx.fill();
  ctx.stroke();
  // Red & Black horizontal chest bands
  ctx.fillStyle = '#d92626';
  ctx.fillRect(-15.5, -44, 31, 6);
  ctx.fillStyle = '#141414';
  ctx.fillRect(-15.5, -35, 31, 6);
  // Iconic SPFC Shield Crest
  ctx.fillStyle = '#111111';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, -47);
  ctx.lineTo(6, -47);
  ctx.lineTo(6, -40);
  ctx.lineTo(0, -32);
  ctx.lineTo(-6, -40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d92626';
  ctx.beginPath();
  ctx.moveTo(-4.5, -41);
  ctx.lineTo(-0.5, -41);
  ctx.lineTo(-0.5, -35);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-4.5, -45.5, 9, 3);

  // Neck
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.4;
  ctx.fillStyle = '#f5cda7';
  ctx.fillRect(-5, -62, 10, 8);
  ctx.strokeRect(-5, -62, 10, 8);

  // Ears
  ctx.beginPath();
  ctx.arc(-17, -75, 4.5, 0, Math.PI * 2);
  ctx.arc(17, -75, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = '#fbd8b6';
  ctx.beginPath();
  ctx.ellipse(0, -76, 17, 18.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Styled brown hair
  ctx.fillStyle = '#4a3222';
  ctx.beginPath();
  ctx.moveTo(-17, -78);
  ctx.bezierCurveTo(-18, -100, 18, -100, 17, -78);
  ctx.bezierCurveTo(12, -87, 3, -89, -5, -87);
  ctx.bezierCurveTo(-11, -85, -14, -82, -17, -78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Hair sheen
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(-2, -87, 8, Math.PI * 1.1, Math.PI * 1.75);
  ctx.stroke();

  // Eyebrows & Sparkling Happy Eyes
  ctx.strokeStyle = '#4a3222';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-10, -81);
  ctx.quadraticCurveTo(-7, -84, -3, -81);
  ctx.moveTo(3, -81);
  ctx.quadraticCurveTo(7, -84, 10, -81);
  ctx.stroke();

  ctx.fillStyle = '#221b18';
  ctx.beginPath();
  ctx.arc(-6.5, -75, 3, 0, Math.PI * 2);
  ctx.arc(6.5, -75, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-5.5, -76.2, 1.1, 0, Math.PI * 2);
  ctx.arc(7.5, -76.2, 1.1, 0, Math.PI * 2);
  ctx.fill();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(255, 143, 171, 0.55)';
  ctx.beginPath();
  ctx.ellipse(-11, -70, 3.8, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(11, -70, 3.8, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bright happy toothy smile
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-8, -67);
  ctx.quadraticCurveTo(0, -59, 8, -67);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/** 2. LULLY — Adorable fluffy black-and-white Shih Tzu with eyelashes, lush red bow & jingle bell collar */
function drawLullyCelebration(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number) {
  const jump = Math.abs(Math.sin(time * 7.0 + 1.8)) * 22;
  const earBounce = Math.sin(time * 14) * 0.12;
  const tailWag = Math.sin(time * 18) * 0.35;
  drawGroundShadow(ctx, x, y, 22 * scale, jump);

  ctx.save();
  ctx.translate(x, y - jump * scale);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Wagging fluffy curled tail
  ctx.save();
  ctx.translate(-17, -22);
  ctx.rotate(tailWag - 0.5);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-6, -8, 7, 11, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Fluffy white Shih Tzu body + soft black saddle patch
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -18, 21, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#231f26';
  ctx.beginPath();
  ctx.ellipse(9, -18, 8.5, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Cute fluffy animated paws
  const pawLift = Math.sin(time * 7.0 + 1.8) * 3;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-11, -4 - Math.max(0, pawLift), 6.5, 4.5, 0, 0, Math.PI * 2);
  ctx.ellipse(11, -4 - Math.max(0, -pawLift), 6.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Festive green velvet collar + golden jingle bell
  ctx.strokeStyle = '#4ea83b';
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(-14, -27);
  ctx.quadraticCurveTo(0, -20, 14, -27);
  ctx.stroke();
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#ffe055';
  ctx.beginPath();
  ctx.arc(0, -21, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2.5, -20.5);
  ctx.lineTo(2.5, -20.5);
  ctx.stroke();

  // Silky floppy black Shih Tzu ears (bouncing!)
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2.5;
  ctx.save();
  ctx.translate(-17, -44);
  ctx.rotate(0.2 + earBounce);
  ctx.fillStyle = '#231f26';
  ctx.beginPath();
  ctx.ellipse(-3, 8, 8, 15, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-4, 2);
  ctx.quadraticCurveTo(-2, 10, -5, 16);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(17, -44);
  ctx.rotate(-0.2 - earBounce);
  ctx.fillStyle = '#231f26';
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(3, 8, 8, 15, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(4, 2);
  ctx.quadraticCurveTo(2, 10, 5, 16);
  ctx.stroke();
  ctx.restore();

  // Fluffy round Shih Tzu head with cheek tufts
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.6;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-18, -42);
  ctx.bezierCurveTo(-20, -58, -8, -64, 0, -63);
  ctx.bezierCurveTo(8, -64, 20, -58, 18, -42);
  ctx.bezierCurveTo(21, -32, 13, -25, 0, -25);
  ctx.bezierCurveTo(-13, -25, -21, -32, -18, -42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Soft black eye-patch
  ctx.fillStyle = '#231f26';
  ctx.beginPath();
  ctx.ellipse(-9, -45, 8.2, 7.2, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Big sparkling eyes + eyelashes + catchlights
  ctx.fillStyle = '#141118';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(-9, -44.5, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#221b18';
  ctx.beginPath();
  ctx.arc(9, -44.5, 4.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-7.7, -46.2, 1.7, 0, Math.PI * 2);
  ctx.arc(-10, -43, 0.8, 0, Math.PI * 2);
  ctx.arc(10.3, -46.2, 1.7, 0, Math.PI * 2);
  ctx.arc(8, -43, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Delicate eyelashes
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -48);
  ctx.lineTo(-17.5, -51);
  ctx.moveTo(13.5, -48);
  ctx.lineTo(17.5, -51);
  ctx.moveTo(14.5, -45.5);
  ctx.lineTo(18.5, -47);
  ctx.stroke();

  // Sweet rosy cheeks
  ctx.fillStyle = 'rgba(255, 143, 171, 0.72)';
  ctx.beginPath();
  ctx.ellipse(-13.5, -37, 3.8, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(13.5, -37, 3.8, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cute shiny nose & happy smile with tongue
  ctx.fillStyle = '#221b18';
  ctx.beginPath();
  ctx.ellipse(0, -39, 3.4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(1, -39.8, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-4.8, -34.5);
  ctx.quadraticCurveTo(0, -30.5, 4.8, -34.5);
  ctx.stroke();
  ctx.fillStyle = '#ff758f';
  ctx.beginPath();
  ctx.moveTo(-2.5, -33.2);
  ctx.quadraticCurveTo(0, -28.5, 2.5, -33.2);
  ctx.fill();
  ctx.stroke();

  // Lush layered red Christmas bow on top of head!
  ctx.fillStyle = '#e63946';
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -61);
  ctx.bezierCurveTo(-11, -73, -18, -66, -11, -57);
  ctx.closePath();
  ctx.moveTo(0, -61);
  ctx.bezierCurveTo(11, -73, 18, -66, 11, -57);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff6b81';
  ctx.beginPath();
  ctx.arc(0, -61.5, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/** 3. LUCKY BOY — Chubby all-white Shih Tzu hero (supports equipped costume + joyful hug expression!) */
function drawLuckyCelebration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  time: number,
  runProgress: number,
  costume: CostumeId
) {
  const isRunning = runProgress < 1;
  const jump = Math.abs(Math.sin(time * (isRunning ? 14 : 6.4))) * (isRunning ? 24 : 18);
  const earFlop = Math.sin(time * (isRunning ? 16 : 9)) * 0.14;
  const tailWag = Math.sin(time * 20) * 0.4;
  drawGroundShadow(ctx, x, y, 25 * scale, jump);

  ctx.save();
  ctx.translate(x, y - jump * scale);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Wagging fluffy white tail
  ctx.save();
  ctx.translate(-21, -21);
  ctx.rotate(tailWag - 0.55);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-7, -7, 7.5, 11.5, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Animated paws
  const stride = Math.sin(time * (isRunning ? 16 : 6.4)) * (isRunning ? 7 : 3);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-12 + stride, -4, 7.5, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(12 - stride, -4, 7.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chubby fluffy all-white Shih Tzu body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -19, 24, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // SPFC Costume Jersey on Lucky if equipped!
  if (costume === 'spfc') {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -19, 23, 16, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#d92626';
    ctx.fillRect(-24, -22, 48, 5);
    ctx.fillStyle = '#141414';
    ctx.fillRect(-24, -14, 48, 5);
    ctx.restore();
    ctx.stroke();
  }

  // Fluttering Red & Cream Striped Dr. Seuss Scarf
  const scarfWave = Math.sin(time * 11) * 5;
  ctx.fillStyle = '#d92626';
  ctx.beginPath();
  ctx.moveTo(-16, -29);
  ctx.quadraticCurveTo(-30, -26 + scarfWave, -36, -15 + scarfWave);
  ctx.lineTo(-27, -11 + scarfWave);
  ctx.quadraticCurveTo(-22, -20 + scarfWave, -10, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Scarf wrap around neck
  ctx.beginPath();
  ctx.roundRect(-14, -33, 30, 8.5, 4);
  ctx.fill();
  ctx.stroke();
  // Cream Seuss stripes on scarf
  ctx.strokeStyle = '#fff9eb';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-6, -32);
  ctx.lineTo(-5, -25.5);
  ctx.moveTo(4, -32);
  ctx.lineTo(4, -25.5);
  ctx.moveTo(12, -32);
  ctx.lineTo(11, -25.5);
  ctx.stroke();

  // Fluffy white floppy ears
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.6;
  ctx.save();
  ctx.translate(-12, -48);
  ctx.rotate(0.24 + earFlop);
  ctx.fillStyle = '#fffef9';
  ctx.beginPath();
  ctx.ellipse(-4, 9, 8.5, 14.5, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(22, -48);
  ctx.rotate(-0.24 - earFlop);
  ctx.fillStyle = '#fffef9';
  ctx.beginPath();
  ctx.ellipse(4, 9, 8.5, 14.5, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Fluffy round Shih Tzu head (facing slightly right toward Jujuba)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-13, -46);
  ctx.bezierCurveTo(-15, -63, -3, -70, 6, -69);
  ctx.bezierCurveTo(16, -70, 27, -63, 25, -46);
  ctx.bezierCurveTo(28, -35, 19, -28, 6, -28);
  ctx.bezierCurveTo(-7, -28, -16, -35, -13, -46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Cute fluffy tuft on top of head
  ctx.beginPath();
  ctx.moveTo(0, -68);
  ctx.quadraticCurveTo(6, -77, 12, -68);
  ctx.fill();
  ctx.stroke();

  // Expressive Eyes: Sparkling open while running, Joyful happy curved "^ ^" eyes when hugging Jujuba!
  if (!isRunning && Math.sin(time * 2.4) > -0.35) {
    ctx.strokeStyle = '#221b18';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-1, -48, 4.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(15, -48, 4.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#221b18';
    ctx.beginPath();
    ctx.arc(-1, -49, 4.6, 0, Math.PI * 2);
    ctx.arc(15, -49, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0.4, -50.6, 1.8, 0, Math.PI * 2);
    ctx.arc(16.4, -50.6, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rosy cheeks
  ctx.fillStyle = 'rgba(255, 143, 171, 0.78)';
  ctx.beginPath();
  ctx.ellipse(-6, -42, 4, 2.3, 0, 0, Math.PI * 2);
  ctx.ellipse(20, -42, 4, 2.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Button nose & joyful puppy smile with pink tongue
  ctx.fillStyle = '#221b18';
  ctx.beginPath();
  ctx.ellipse(8, -43, 3.8, 2.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(9.1, -44, 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(2.5, -38.5);
  ctx.quadraticCurveTo(8, -33.5, 13.5, -38.5);
  ctx.stroke();
  ctx.fillStyle = '#f46d75';
  ctx.beginPath();
  ctx.moveTo(5.2, -37.2);
  ctx.quadraticCurveTo(8, -30.5, 10.8, -37.2);
  ctx.fill();
  ctx.stroke();

  // Optional Costume Accessories on Lucky!
  if (costume === 'santa') {
    ctx.fillStyle = '#d92626';
    ctx.beginPath();
    ctx.moveTo(-10, -64);
    ctx.quadraticCurveTo(6, -90, 26, -68);
    ctx.quadraticCurveTo(8, -70, -10, -64);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-12, -68, 36, 7, 3.5);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(26, -68, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (costume === 'pilot') {
    ctx.fillStyle = '#6f4e37';
    ctx.beginPath();
    ctx.roundRect(-10, -64, 34, 7, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#a8e6ff';
    ctx.strokeStyle = '#d99316';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(-1, -60, 5.5, 0, Math.PI * 2);
    ctx.arc(15, -60, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (costume === 'starlight') {
    ctx.fillStyle = '#ffe055';
    ctx.strokeStyle = '#221b18';
    ctx.lineWidth = 2;
    drawStarShape(ctx, 6, -77, 5, 10, 4.5);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/** 4. PRINCESA JUJUBA — Radiant golden-blonde princess in royal Christmas gown with star tiara */
function drawJujubaCelebration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  time: number,
  hugging: boolean
) {
  const jump = hugging ? Math.abs(Math.sin(time * 6.4 + 0.35)) * 12 : Math.sin(time * 3) * 2;
  drawGroundShadow(ctx, x, y, 28 * scale, Math.max(0, jump));

  ctx.save();
  ctx.translate(x, y - Math.max(0, jump) * scale);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Flowing golden-blonde back hair with wavy storybook curls
  ctx.fillStyle = '#ffd942';
  ctx.beginPath();
  ctx.moveTo(-22, -74);
  ctx.bezierCurveTo(-30, -54, -28, -32, -18, -26);
  ctx.lineTo(18, -26);
  ctx.bezierCurveTo(28, -32, 30, -54, 22, -74);
  ctx.bezierCurveTo(18, -96, -18, -96, -22, -74);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Hair golden shine streaks
  ctx.strokeStyle = '#fff3a1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-17, -64);
  ctx.quadraticCurveTo(-21, -48, -14, -36);
  ctx.moveTo(17, -64);
  ctx.quadraticCurveTo(21, -48, 14, -36);
  ctx.stroke();

  // Royal Rose-Pink Christmas Gown
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.6;
  const gownGrad = ctx.createLinearGradient(0, -52, 0, -4);
  gownGrad.addColorStop(0, '#f06292');
  gownGrad.addColorStop(1, '#d8366c');
  ctx.fillStyle = gownGrad;
  ctx.beginPath();
  ctx.moveTo(-12, -52);
  ctx.lineTo(12, -52);
  ctx.bezierCurveTo(18, -32, 26, -16, 28, -5);
  ctx.quadraticCurveTo(0, 1, -28, -5);
  ctx.bezierCurveTo(-26, -16, -18, -32, -12, -52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden sash waist & twinkling stars on skirt
  ctx.fillStyle = '#ffe055';
  ctx.beginPath();
  ctx.roundRect(-12, -41, 24, 5.5, 2.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff4a8';
  for (const [sx, sy] of [
    [-12, -20],
    [0, -26],
    [12, -19],
    [-4, -13],
    [7, -12],
  ]) {
    drawStarShape(ctx, sx, sy, 4, 3.8, 1.5);
    ctx.fill();
  }

  // Fluffy white snow-fur trim along hem & royal collar
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-29, -8, 58, 7.5, 4);
  ctx.fill();
  ctx.stroke();

  // Puffed princess sleeves & warm waving arms
  const armWave = Math.sin(time * 7.5) * 0.2;
  // Left arm reaching warmly toward Lucky!
  ctx.save();
  ctx.translate(-14, -49);
  ctx.rotate(hugging ? 0.55 + armWave * 0.6 : 0.85);
  ctx.fillStyle = '#ff85ad';
  ctx.beginPath();
  ctx.ellipse(0, 3, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe7c8';
  ctx.beginPath();
  ctx.roundRect(-3.8, 8, 7.6, 15, 3.8);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 24, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Right arm waving joyfully!
  ctx.save();
  ctx.translate(14, -49);
  ctx.rotate(-2.15 + armWave);
  ctx.fillStyle = '#ff85ad';
  ctx.beginPath();
  ctx.ellipse(0, 3, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe7c8';
  ctx.beginPath();
  ctx.roundRect(-3.8, 8, 7.6, 15, 3.8);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 24, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Fluffy collar + golden royal brooch
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-13, -51);
  ctx.quadraticCurveTo(0, -45, 13, -51);
  ctx.stroke();
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#ffd447';
  ctx.beginPath();
  ctx.arc(0, -47.5, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Neck
  ctx.fillStyle = '#ffe0bd';
  ctx.fillRect(-4.5, -59, 9, 8);
  ctx.strokeRect(-4.5, -59, 9, 8);

  // Expressive Princess Head
  ctx.fillStyle = '#ffe7c8';
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, -72, 16.5, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Golden sweeping bangs
  ctx.fillStyle = '#ffeb75';
  ctx.beginPath();
  ctx.moveTo(-17, -75);
  ctx.quadraticCurveTo(-8, -93, 6, -89);
  ctx.quadraticCurveTo(17, -86, 17.5, -73);
  ctx.quadraticCurveTo(9, -83, -1, -80);
  ctx.quadraticCurveTo(-10, -79, -17, -75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden Star Tiara / Crown!
  ctx.fillStyle = '#ffd447';
  ctx.beginPath();
  ctx.moveTo(-12, -88);
  ctx.lineTo(-8, -98);
  ctx.lineTo(0, -93);
  ctx.lineTo(8, -98);
  ctx.lineTo(12, -88);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff9c4';
  drawStarShape(ctx, 0, -98, 5, 7.5, 3.3);
  ctx.fill();
  ctx.stroke();

  // Sparkling Princess Eyes with Eyelashes
  ctx.fillStyle = '#221b18';
  ctx.beginPath();
  ctx.arc(-6.2, -71, 3.4, 0, Math.PI * 2);
  ctx.arc(6.2, -71, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-5, -72.3, 1.3, 0, Math.PI * 2);
  ctx.arc(7.4, -72.3, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(-9.5, -73.5);
  ctx.lineTo(-12.5, -75.5);
  ctx.moveTo(9.5, -73.5);
  ctx.lineTo(12.5, -75.5);
  ctx.stroke();

  // Rosy cheeks & warm radiant smile
  ctx.fillStyle = 'rgba(255, 143, 171, 0.65)';
  ctx.beginPath();
  ctx.ellipse(-10.5, -66, 3.8, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(10.5, -66, 3.8, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9184a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-5.5, -62.5);
  ctx.quadraticCurveTo(0, -57.5, 5.5, -62.5);
  ctx.stroke();

  ctx.restore();
}

/** 5. PROFESSOR PINHÃO — Whimsical steampunk owl with brass glasses & striped Seuss top hat */
function drawPinhaoCelebration(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number) {
  const hop = Math.abs(Math.sin(time * 6.0 + 2.6)) * 13;
  const wingFlap = Math.sin(time * 12) * 0.28;
  drawGroundShadow(ctx, x, y, 20 * scale, hop);

  ctx.save();
  ctx.translate(x, y - hop * scale);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Cute orange owl feet
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath();
  ctx.ellipse(-8, -3, 6.5, 3.8, 0, 0, Math.PI * 2);
  ctx.ellipse(8, -3, 6.5, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Flapping wings
  ctx.save();
  ctx.translate(-17, -28);
  ctx.rotate(0.5 + wingFlap);
  ctx.fillStyle = '#8b5434';
  ctx.beginPath();
  ctx.ellipse(-5, 6, 7.5, 14, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(17, -28);
  ctx.rotate(-0.5 - wingFlap);
  ctx.fillStyle = '#8b5434';
  ctx.beginPath();
  ctx.ellipse(5, 6, 7.5, 14, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Plump feathered owl body + cream scalloped belly
  ctx.fillStyle = '#a46a47';
  ctx.beginPath();
  ctx.ellipse(0, -24, 20, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe599';
  ctx.beginPath();
  ctx.ellipse(0, -21, 13, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Feather marks on belly
  ctx.strokeStyle = '#c07e52';
  ctx.lineWidth = 1.8;
  for (const [fx, fy] of [
    [-5, -24],
    [5, -24],
    [0, -18],
    [-5, -13],
    [5, -13],
  ]) {
    ctx.beginPath();
    ctx.arc(fx, fy, 3, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  // Owl head
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = '#c07e52';
  ctx.beginPath();
  ctx.arc(0, -48, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Golden brass spectacles
  ctx.fillStyle = '#fff9eb';
  ctx.strokeStyle = '#d99316';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-7.5, -49, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(7.5, -49, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-1, -49);
  ctx.lineTo(1, -49);
  ctx.stroke();

  // Sparkling owl eyes
  ctx.fillStyle = '#221b18';
  ctx.beginPath();
  ctx.arc(-7.5, -49, 3.2, 0, Math.PI * 2);
  ctx.arc(7.5, -49, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6.4, -50.2, 1.2, 0, Math.PI * 2);
  ctx.arc(8.6, -50.2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Smiling orange beak
  ctx.fillStyle = '#ff9f1c';
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.lineTo(-4.5, -39);
  ctx.lineTo(4.5, -39);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Iconic Red-and-White Striped Dr. Seuss Top Hat!
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-11, -63);
  ctx.lineTo(-7, -86);
  ctx.lineTo(12, -83);
  ctx.lineTo(11, -63);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d92626';
  ctx.fillRect(-9.5, -77, 20, 4.5);
  ctx.fillRect(-10, -69, 20.5, 4.5);
  ctx.beginPath();
  ctx.ellipse(0, -63, 18, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/** 6. LULA (REDIMIDO!) — Warm smiling inventor in festive green Christmas coat, Santa hat & holding his gift! */
function drawLulaCelebration(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number) {
  const jump = Math.abs(Math.sin(time * 5.1 + 0.7)) * 12;
  drawGroundShadow(ctx, x, y, 25 * scale, jump);

  ctx.save();
  ctx.translate(x, y - jump * scale);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Boots
  ctx.fillStyle = '#3b2458';
  ctx.beginPath();
  ctx.ellipse(-10, -4, 9, 5.5, 0, 0, Math.PI * 2);
  ctx.ellipse(10, -4, 9, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Festive Green Christmas Coat with Fluffy White Trim & Golden Buttons
  ctx.fillStyle = '#4ea83b';
  ctx.beginPath();
  ctx.moveTo(-15, -54);
  ctx.lineTo(15, -54);
  ctx.lineTo(24, -10);
  ctx.quadraticCurveTo(0, -4, -24, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Fluffy white coat trim
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-25, -13, 50, 7, 3.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-3.5, -52, 7, 40);
  ctx.strokeRect(-3.5, -52, 7, 40);
  // Golden coat buttons
  ctx.fillStyle = '#ffe055';
  for (const by of [-42, -31, -20]) {
    ctx.beginPath();
    ctx.arc(0, by, 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Right arm waving joyfully!
  ctx.save();
  ctx.translate(15, -48);
  ctx.rotate(-2.15 + Math.sin(time * 7.2) * 0.24);
  ctx.fillStyle = '#4ea83b';
  ctx.beginPath();
  ctx.roundRect(-5, 0, 10, 22, 4.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-6, 18, 12, 5, 2.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c38ef5';
  ctx.beginPath();
  ctx.arc(0, 26, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Left arm holding his treasured Christmas Gift Box!
  ctx.save();
  ctx.translate(-15, -46);
  ctx.rotate(0.42 + Math.sin(time * 5.1) * 0.08);
  ctx.fillStyle = '#4ea83b';
  ctx.beginPath();
  ctx.roundRect(-5, 0, 10, 21, 4.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c38ef5';
  ctx.beginPath();
  ctx.arc(0, 23, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Gift Box held happily in Lula's hand
  drawGiftBox(ctx, -26, -19, 20, 16, '#f46d75', '#ffe055');

  // Cozy purple striped scarf
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.roundRect(-15, -57, 30, 8, 4);
  ctx.fill();
  ctx.stroke();

  // Expressive Lavender Storybook Face (redeemed & heartwarming!)
  ctx.fillStyle = '#c38ef5';
  ctx.beginPath();
  ctx.moveTo(-17, -75);
  ctx.bezierCurveTo(-19, -92, -8, -98, 0, -97);
  ctx.bezierCurveTo(8, -98, 19, -92, 17, -75);
  ctx.bezierCurveTo(17, -62, 10, -55, 0, -55);
  ctx.bezierCurveTo(-10, -55, -17, -62, -17, -75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wild purple Seuss hair tufts peeking out
  ctx.strokeStyle = '#4c1d95';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-17, -82);
  ctx.lineTo(-23, -86);
  ctx.moveTo(17, -82);
  ctx.lineTo(23, -86);
  ctx.stroke();

  // Santa Hat with bouncing fluffy white pom-pom & pushed-up steampunk goggles!
  const pomBounce = Math.sin(time * 10) * 3.5;
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = '#d92626';
  ctx.beginPath();
  ctx.moveTo(-16, -89);
  ctx.quadraticCurveTo(0, -118, 22, -96 + pomBounce);
  ctx.quadraticCurveTo(6, -96, -16, -89);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // White Santa hat rim & pom-pom
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-18, -94, 36, 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(23, -96 + pomBounce, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Brass steampunk goggles resting on hat rim!
  ctx.fillStyle = '#ffe055';
  ctx.strokeStyle = '#8c5807';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(-7.5, -90, 5.2, 0, Math.PI * 2);
  ctx.arc(7.5, -90, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Gentle Happy Eyebrows & Warm Glowing Golden Eyes!
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-12, -80);
  ctx.quadraticCurveTo(-7.5, -84, -3, -80);
  ctx.moveTo(3, -80);
  ctx.quadraticCurveTo(7.5, -84, 12, -80);
  ctx.stroke();

  ctx.fillStyle = '#ffe55c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-7.5, -74, 4.4, 3.8, 0, 0, Math.PI * 2);
  ctx.ellipse(7.5, -74, 4.4, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#221b18';
  ctx.beginPath();
  ctx.arc(-7.5, -74, 2, 0, Math.PI * 2);
  ctx.arc(7.5, -74, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6.6, -75.2, 0.9, 0, Math.PI * 2);
  ctx.arc(8.4, -75.2, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Warm rosy cheeks & big heartfelt smile!
  ctx.fillStyle = 'rgba(255, 143, 171, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-12, -68, 3.6, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(12, -68, 3.6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#221b18';
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(-8.5, -65);
  ctx.quadraticCurveTo(0, -56, 8.5, -65);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export const EndingCinematic: React.FC<Props> = ({ save, onContinueExploring }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState<'reunion' | 'dialogue' | 'message'>('reunion');
  const [lineIdx, setLineIdx] = useState(0);

  const totalStars = Object.values(save.levelStats).reduce((s, st) => s + (st?.stars || 0), 0);
  const totalPaws = Object.values(save.levelStats).reduce(
    (s, st) => s + (st?.goldenPaws?.filter(Boolean).length || 0),
    0
  );

  // Live 60FPS Storybook Christmas Celebration Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fireworks: Firework[] = [];
    const skyStars = Array.from({ length: 58 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.56,
      r: 1.2 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
    }));
    const snow = Array.from({ length: 90 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 800,
      r: 1.8 + Math.random() * 3.4,
      spd: 22 + Math.random() * 40,
      drift: Math.random() * Math.PI * 2,
    }));

    const fwColors = ['#ffe055', '#f46d75', '#6fd3f7', '#86db58', '#ff9ebb', '#ff9f43'];
    const spawnFirework = (w: number, h: number) => {
      const cx = w * (0.1 + Math.random() * 0.8);
      const cy = h * (0.1 + Math.random() * 0.3);
      const col = fwColors[Math.floor(Math.random() * fwColors.length)];
      const col2 = fwColors[(Math.floor(Math.random() * fwColors.length) + 2) % fwColors.length];
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2 + Math.random() * 0.14;
        const spd = 55 + Math.random() * 155;
        fireworks.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          color: i % 3 === 0 ? col2 : col,
          life: 0.95 + Math.random() * 0.7,
          maxLife: 1.65,
          size: 2.5 + Math.random() * 3.4,
          sparkle: i % 2 === 0,
        });
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(parent.clientWidth * dpr);
      canvas.height = Math.floor(parent.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let fwTimer = 0.25;
    let lastTs = performance.now();
    let rafId = 0;

    const reunionTimer = window.setTimeout(() => {
      setStep((cur) => (cur === 'reunion' ? 'dialogue' : cur));
    }, 4600);

    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      time += dt;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const isPortrait = h > w * 1.1;

      fwTimer -= dt;
      if (fwTimer <= 0) {
        fwTimer = 0.8 + Math.random() * 0.55;
        spawnFirework(w, h);
      }

      // 1. Magical Starry Christmas Night-to-Dawn Storybook Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#12346b');
      sky.addColorStop(0.45, '#3b97dc');
      sky.addColorStop(0.85, '#9fe5ff');
      sky.addColorStop(1, '#e6faff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Twinkling background stars
      for (const st of skyStars) {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(time * 2.4 + st.phase));
        ctx.fillStyle = `rgba(255, 249, 210, ${a.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dual Aurora Borealis Ribbons
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(134, 245, 198, 0.25)';
      ctx.lineWidth = 42;
      ctx.beginPath();
      ctx.moveTo(-20, h * 0.22 + Math.sin(time * 0.9) * 18);
      ctx.bezierCurveTo(w * 0.3, h * 0.1, w * 0.65, h * 0.32, w + 20, h * 0.16 + Math.cos(time * 0.9) * 16);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 224, 85, 0.24)';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(-20, h * 0.29 + Math.cos(time) * 15);
      ctx.bezierCurveTo(w * 0.36, h * 0.18, w * 0.68, h * 0.38, w + 20, h * 0.24 + Math.sin(time) * 15);
      ctx.stroke();
      ctx.restore();

      // Fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const f = fireworks[i];
        f.life -= dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 115 * dt;
        if (f.life <= 0) {
          fireworks.splice(i, 1);
          continue;
        }
        const alpha = Math.max(0, f.life / f.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        if (f.sparkle) {
          drawStarShape(ctx, f.x, f.y, 4, f.size * 1.4, f.size * 0.5);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // 2. Radiant Enchanted Christmas Star Rising into the Sky!
      const starTargetY = isPortrait ? h * 0.17 : h * 0.16;
      const starY = Math.max(starTargetY, h * 0.44 - time * 58);
      ctx.save();
      ctx.translate(w / 2, starY);
      const glowR = 62 + Math.sin(time * 4.5) * 9;
      const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, glowR);
      halo.addColorStop(0, 'rgba(255, 252, 195, 0.96)');
      halo.addColorStop(0.45, 'rgba(255, 224, 85, 0.42)');
      halo.addColorStop(1, 'rgba(255, 224, 85, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Rotating light rays behind star
      ctx.save();
      ctx.rotate(time * 0.35);
      ctx.strokeStyle = 'rgba(255, 245, 165, 0.5)';
      ctx.lineWidth = 3;
      for (let r = 0; r < 8; r++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(0, 42 + Math.sin(time * 5 + r) * 6);
        ctx.stroke();
      }
      ctx.restore();

      // Hand-inked Golden Enchanted Star
      ctx.rotate(Math.sin(time * 2) * 0.08);
      ctx.fillStyle = '#ffe45e';
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 3;
      drawStarShape(ctx, 0, 0, 5, 24, 11);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fffce0';
      drawStarShape(ctx, 0, 0, 5, 12, 5.5);
      ctx.fill();
      ctx.restore();

      // 3. Soft Distant Storybook Snow Hills
      const groundY = isPortrait ? h * 0.63 : h * 0.68;
      ctx.fillStyle = '#9be06e';
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-10, groundY + 14);
      ctx.quadraticCurveTo(w * 0.24, groundY - 62, w * 0.54, groundY + 4);
      ctx.quadraticCurveTo(w * 0.82, groundY - 54, w + 10, groundY + 12);
      ctx.lineTo(w + 10, h);
      ctx.lineTo(-10, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Giant Big Golden Book Christmas Tree behind the cast!
      const treeScale = Math.min(1.22, Math.max(0.72, w / 660));
      ctx.save();
      ctx.translate(w / 2, groundY - 4);
      ctx.scale(treeScale, treeScale);
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      // Trunk
      ctx.fillStyle = '#8b623f';
      ctx.fillRect(-18, -36, 36, 40);
      ctx.strokeRect(-18, -36, 36, 40);
      // 3 Layered Whimsical Boughs
      const tiers = [
        { y: -32, w: 122, h: 74, col: '#529e38' },
        { y: -88, w: 96, h: 68, col: '#5fb041' },
        { y: -138, w: 68, h: 76, col: '#6ec24c' },
      ];
      for (const t of tiers) {
        ctx.fillStyle = t.col;
        ctx.beginPath();
        ctx.moveTo(0, t.y - t.h);
        ctx.quadraticCurveTo(-t.w * 0.48, t.y - t.h * 0.28, -t.w, t.y);
        ctx.quadraticCurveTo(0, t.y + 18, t.w, t.y);
        ctx.quadraticCurveTo(t.w * 0.48, t.y - t.h * 0.28, 0, t.y - t.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Pink Seuss Tinsel Garlands
      ctx.strokeStyle = '#e47bb8';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-54, -142);
      ctx.quadraticCurveTo(0, -120, 54, -142);
      ctx.moveTo(-84, -90);
      ctx.quadraticCurveTo(0, -66, 84, -90);
      ctx.moveTo(-108, -38);
      ctx.quadraticCurveTo(0, -12, 108, -38);
      ctx.stroke();

      // Golden Christmas Bells (Big Golden Book touch!)
      for (const [bx, by, bs] of [
        [-28, -94, 0.85],
        [0, -88, 1.05],
        [28, -94, 0.85],
      ]) {
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(bs, bs);
        ctx.rotate(Math.sin(time * 4 + bx) * 0.08);
        ctx.fillStyle = '#ffe055';
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(-12, 16, -15, 22);
        ctx.quadraticCurveTo(0, 27, 15, 22);
        ctx.quadraticCurveTo(12, 16, 10, 0);
        ctx.quadraticCurveTo(0, -8, -10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Twinkling Colorful Ornaments on the Tree
      const ornaments = [
        [-36, -154],
        [26, -158],
        [-64, -104],
        [62, -106],
        [-18, -124],
        [22, -122],
        [-82, -52],
        [-34, -46],
        [36, -48],
        [82, -52],
      ];
      ornaments.forEach(([ox, oy], idx) => {
        const col = fwColors[(idx + Math.floor(time * 2.5)) % fwColors.length];
        ctx.fillStyle = col;
        ctx.strokeStyle = '#221b18';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ox, oy, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(ox - 2, oy - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Presents nestled at tree base
      drawGiftBox(ctx, -64, 4, 28, 22, '#f46d75', '#ffe055');
      drawGiftBox(ctx, 64, 4, 30, 24, '#6fd3f7', '#e63946');
      drawGiftBox(ctx, -32, 6, 22, 18, '#ffe055', '#5ea93f');
      ctx.restore();

      // Main Foreground Storybook Green Meadow with Soft Snow Trim
      ctx.fillStyle = '#69b543';
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(-10, groundY + 14);
      ctx.quadraticCurveTo(w * 0.5, groundY - 28, w + 10, groundY + 14);
      ctx.lineTo(w + 10, h);
      ctx.lineTo(-10, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cozy snowy blanket patch in front of the tree
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, groundY + 14, w * 0.44, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. DETAILED ANIMATED CAST CELEBRATING TOGETHER!
      const charScale = isPortrait
        ? Math.min(0.95, Math.max(0.68, w / 430))
        : Math.min(1.22, Math.max(0.84, w / 860));

      const runProgress = Math.min(1, time / 2.25);
      const hugging = runProgress >= 1;

      const pauloX = w * (isPortrait ? 0.11 : 0.14);
      const lullyX = w * (isPortrait ? 0.25 : 0.27);
      const luckyStartX = w * 0.06;
      const luckyEndX = w * (isPortrait ? 0.42 : 0.43);
      const luckyX = luckyStartX + (luckyEndX - luckyStartX) * runProgress;
      const jujubaX = w * (isPortrait ? 0.56 : 0.54);
      const pinhaoX = w * (isPortrait ? 0.72 : 0.71);
      const lulaX = w * (isPortrait ? 0.87 : 0.85);

      const feetY = groundY + 12;

      // Draw back-to-front for natural depth
      drawPauloCelebration(ctx, pauloX, feetY + 2, charScale, time);
      drawPinhaoCelebration(ctx, pinhaoX, feetY + 2, charScale, time);
      drawLulaCelebration(ctx, lulaX, feetY + 4, charScale, time);
      drawLullyCelebration(ctx, lullyX, feetY + 8, charScale * 1.04, time);
      drawJujubaCelebration(ctx, jujubaX, feetY + 6, charScale * 1.06, time, hugging);
      drawLuckyCelebration(ctx, luckyX, feetY + 10, charScale * 1.08, time, runProgress, save.equippedCostume);

      // Rising Drawn Hearts & Golden Sparkles between Lucky Boy & Princesa Jujuba!
      if (hugging) {
        for (let k = 0; k < 4; k++) {
          const cycle = (time * 0.75 + k * 0.25) % 1;
          const hx = (luckyEndX + jujubaX) * 0.5 + Math.sin(time * 3.5 + k * 1.7) * 28 * charScale;
          const hy = feetY - 76 * charScale - cycle * 95 * charScale;
          ctx.globalAlpha = Math.sin(cycle * Math.PI);
          drawHeart(
            ctx,
            hx,
            hy,
            (9 + (k % 2) * 3) * charScale,
            k % 2 === 0 ? '#ff4d79' : '#ff8fab'
          );
        }
        ctx.globalAlpha = 1;
      }

      // 5. Gentle Falling Snowflakes (Foreground)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      for (const s of snow) {
        s.y += s.spd * dt;
        s.x += Math.sin(time * 1.1 + s.drift) * 18 * dt;
        if (s.y > h) {
          s.y = -8;
          s.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(((s.x % w) + w) % w, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(reunionTimer);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [save.equippedCostume]);

  const nextLine = () => {
    haptics.dpad();
    audioSystem.playSfx('click');
    if (lineIdx + 1 < ENDING_SCENE_LINES.length) {
      setLineIdx(lineIdx + 1);
    } else {
      audioSystem.playSfx('win');
      haptics.collect();
      setStep('message');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Fullscreen Live Animated Christmas Celebration Scene */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      {/* Top Festive Banner */}
      <div
        style={{
          position: 'absolute',
          top: 'max(14px, env(safe-area-inset-top))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          textAlign: 'center',
          width: '92%',
        }}
      >
        <div
          className="seuss-title"
          style={{
            display: 'inline-block',
            background: '#fffdf5',
            border: '3.5px solid #221b18',
            borderRadius: 99,
            padding: '6px 22px',
            color: '#c91d1d',
            fontSize: 'clamp(1.05rem, 3.6vw, 1.75rem)',
            boxShadow: '0 5px 0 #221b18',
          }}
        >
          🎄 FELIZ NATAL EM JUBALÂNDIA! 🎄
        </div>
      </div>

      {/* Bottom Interactive Story / Celebration Card */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 15,
          padding: '10px 14px max(16px, env(safe-area-inset-bottom))',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {step === 'reunion' && (
          <div
            className="seuss-card"
            onClick={() => setStep('dialogue')}
            style={{ width: 'min(660px, 96vw)', padding: '12px 18px', textAlign: 'center', cursor: 'pointer' }}
          >
            <div className="seuss-title" style={{ color: '#c91d1d', fontSize: '1.12rem', marginBottom: 4 }}>
              ✨ O Grande Reencontro de Natal! ✨
            </div>
            <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: '0.94rem', color: '#221b18' }}>
              Lucky Boy corre para abraçar a Princesa Jujuba enquanto a Estrela Encantada ilumina o céu e Paulo (SPFC), Lully, Professor Pinhão e Lula comemoram juntos!
            </p>
            <button type="button" className="seuss-btn seuss-btn-gold" style={{ padding: '7px 16px', fontSize: '0.9rem' }}>
              Ouvir a Comemoração ▶
            </button>
          </div>
        )}

        {step === 'dialogue' && (
          <div
            className="seuss-card"
            onClick={nextLine}
            style={{
              width: 'min(700px, 96vw)',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <CharacterPortrait
              character={ENDING_SCENE_LINES[lineIdx].speaker}
              size={74}
              costume={ENDING_SCENE_LINES[lineIdx].speaker === 'lucky' ? save.equippedCostume : 'classic'}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="seuss-title" style={{ color: '#c91d1d', fontSize: '1.12rem', marginBottom: 4 }}>
                {ENDING_SCENE_LINES[lineIdx].speakerName}
              </div>
              <p style={{ fontSize: 'clamp(0.88rem, 2.2vw, 1.04rem)', lineHeight: 1.42, margin: '0 0 9px', fontWeight: 800, color: '#221b18' }}>
                "{ENDING_SCENE_LINES[lineIdx].text}"
              </p>
              <button type="button" className="seuss-btn seuss-btn-gold" style={{ padding: '6px 14px', fontSize: '0.86rem' }}>
                {lineIdx + 1 < ENDING_SCENE_LINES.length ? 'Continuar ▶' : 'Ver Mensagem Final 🎄'}
              </button>
            </div>
          </div>
        )}

        {step === 'message' && (
          <div
            className="seuss-card scrollable-panel"
            style={{ width: 'min(700px, 96vw)', maxHeight: '52vh', padding: '16px 20px', textAlign: 'center' }}
          >
            <p
              style={{
                fontSize: 'clamp(0.92rem, 2.3vw, 1.1rem)',
                lineHeight: 1.5,
                fontWeight: 800,
                color: '#221b18',
                margin: '0 0 12px',
              }}
            >
              Naquela noite, todos descobriram que o maior herói de Jubalândia não precisava de uma espada, de uma
              armadura ou de uma coroa.
              <br />
              <span style={{ color: '#c91d1d' }}>
                Bastavam quatro patinhas, uma barriguinha e um coração cheio de amor.
              </span>
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                background: '#f2e4c4',
                border: '2.5px solid #221b18',
                borderRadius: 14,
                padding: 10,
                marginBottom: 12,
                fontWeight: 900,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#5b4c3f' }}>Estrelas</div>
                <div style={{ fontSize: 17, color: '#c98a00' }}>★ {totalStars}/36</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#5b4c3f' }}>Patinhas</div>
                <div style={{ fontSize: 17, color: '#c91d1d' }}>🐾 {totalPaws}/36</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#5b4c3f' }}>Petiscos</div>
                <div style={{ fontSize: 17, color: '#2f7a24' }}>🦴 {save.totalTreats}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#5b4c3f' }}>Trajes</div>
                <div style={{ fontSize: 17, color: '#2272a3' }}>👕 {save.unlockedCostumes.length}/6</div>
              </div>
            </div>

            <button type="button" className="seuss-btn seuss-btn-primary" onClick={onContinueExploring}>
              🗺️ Continuar Explorando Jubalândia
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
