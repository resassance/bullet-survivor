import * as THREE from 'three';

export type CharacterPose = 'kneel' | 'crouch' | 'run' | 'reload' | 'shoot';

function muzzleFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const length = i % 2 === 0 ? 22 : 12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      Math.cos(angle) * length + Math.cos(angle + 0.35) * 4,
      Math.sin(angle) * length + Math.sin(angle + 0.35) * 4
    );
    ctx.lineTo(
      Math.cos(angle) * length + Math.cos(angle - 0.35) * 4,
      Math.sin(angle) * length + Math.sin(angle - 0.35) * 4
    );
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function polygon(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  fillOverride?: string
) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  if (fillOverride) {
    ctx.save();
    ctx.fillStyle = fillOverride;
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fill();
  }
  ctx.stroke();
}

function headAndHair(ctx: CanvasRenderingContext2D, headY: number) {
  polygon(ctx, [
    [-14, headY - 30],
    [-20, headY - 55],
    [-9, headY - 34],
  ]);
  polygon(ctx, [
    [14, headY - 30],
    [20, headY - 55],
    [9, headY - 34],
  ]);
  ctx.beginPath();
  ctx.arc(0, headY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function gun(
  ctx: CanvasRenderingContext2D,
  handX: number,
  handY: number,
  angleDeg: number,
  fillColor: string,
  glowColor: string,
  gunColor: string
) {
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.fillStyle = gunColor;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.rect(-6, -8, 46, 16);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(-4, 6, 10, 20);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = fillColor;
}

export function createCharacterPoseTexture(
  pose: CharacterPose,
  facing: 'left' | 'right' = 'left'
): THREE.CanvasTexture {
  const width = 220;
  const height = 300;
  const fillColor = '#1a1430';
  const glowColor = '#9b7fff';
  const accentColor = '#ff3b6e';
  const gunColor = '#2a2438';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.save();
  ctx.translate(width / 2, 0);
  if (facing === 'right') ctx.scale(-1, 1);

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  if (pose === 'kneel') {
    polygon(ctx, [
      [-18, 230],
      [18, 230],
      [30, 130],
      [-30, 130],
    ]);
    headAndHair(ctx, 95);
    polygon(ctx, [
      [-30, 175],
      [-14, 175],
      [-8, 285],
      [-30, 288],
    ]);
    polygon(ctx, [
      [-30, 288],
      [-8, 285],
      [4, 292],
      [-30, 296],
    ]);
    polygon(ctx, [
      [14, 175],
      [30, 175],
      [42, 250],
      [22, 260],
    ]);
    polygon(ctx, [
      [22, 260],
      [42, 250],
      [46, 268],
      [24, 276],
    ]);
    polygon(
      ctx,
      [
        [24, 145],
        [4, 150],
        [2, 165],
        [22, 162],
      ],
      accentColor
    );
    gun(ctx, 46, 158, -8, fillColor, glowColor, gunColor);
  }

  if (pose === 'crouch') {
    polygon(ctx, [
      [-20, 210],
      [20, 210],
      [28, 140],
      [-28, 140],
    ]);
    headAndHair(ctx, 110);
    polygon(ctx, [
      [-28, 180],
      [-10, 180],
      [-24, 245],
      [-42, 238],
    ]);
    polygon(ctx, [
      [10, 180],
      [28, 180],
      [40, 235],
      [22, 244],
    ]);
    polygon(ctx, [
      [-44, 236],
      [-24, 243],
      [-20, 258],
      [-46, 254],
    ]);
    polygon(ctx, [
      [22, 242],
      [42, 233],
      [48, 250],
      [26, 258],
    ]);
    polygon(
      ctx,
      [
        [-34, 165],
        [-14, 172],
        [-20, 190],
        [-38, 182],
      ],
      accentColor
    );
    gun(ctx, -38, 186, 140, fillColor, glowColor, gunColor);
  }

  if (pose === 'run') {
    ctx.save();
    ctx.rotate((-6 * Math.PI) / 180);
    polygon(ctx, [
      [-18, 200],
      [22, 195],
      [30, 120],
      [-28, 128],
    ]);
    headAndHair(ctx, 85);
    polygon(ctx, [
      [-26, 155],
      [-8, 158],
      [-34, 230],
      [-52, 220],
    ]);
    polygon(ctx, [
      [-54, 218],
      [-32, 228],
      [-26, 244],
      [-56, 236],
    ]);
    polygon(ctx, [
      [10, 150],
      [28, 150],
      [50, 205],
      [30, 216],
    ]);
    polygon(ctx, [
      [28, 214],
      [50, 203],
      [56, 220],
      [34, 228],
    ]);
    polygon(
      ctx,
      [
        [22, 138],
        [4, 132],
        [-14, 150],
        [6, 158],
      ],
      accentColor
    );
    gun(ctx, -2, 148, 168, fillColor, glowColor, gunColor);
    ctx.restore();
  }

  if (pose === 'reload') {
    polygon(ctx, [
      [-18, 230],
      [18, 230],
      [30, 130],
      [-30, 130],
    ]);
    headAndHair(ctx, 100);
    polygon(ctx, [
      [-30, 175],
      [-14, 175],
      [-8, 285],
      [-30, 288],
    ]);
    polygon(ctx, [
      [-30, 288],
      [-8, 285],
      [4, 292],
      [-30, 296],
    ]);
    polygon(ctx, [
      [14, 175],
      [30, 175],
      [42, 250],
      [22, 260],
    ]);
    polygon(ctx, [
      [22, 260],
      [42, 250],
      [46, 268],
      [24, 276],
    ]);
    gun(ctx, 18, 168, 34, fillColor, glowColor, gunColor);
    polygon(
      ctx,
      [
        [6, 205],
        [22, 214],
        [16, 236],
        [0, 228],
      ],
      accentColor
    );
  }

  if (pose === 'shoot') {
    polygon(ctx, [
      [-18, 230],
      [18, 230],
      [30, 130],
      [-30, 130],
    ]);
    headAndHair(ctx, 95);
    polygon(ctx, [
      [-30, 175],
      [-14, 175],
      [-8, 285],
      [-30, 288],
    ]);
    polygon(ctx, [
      [-30, 288],
      [-8, 285],
      [4, 292],
      [-30, 296],
    ]);
    polygon(ctx, [
      [14, 175],
      [30, 175],
      [42, 250],
      [22, 260],
    ]);
    polygon(ctx, [
      [22, 260],
      [42, 250],
      [46, 268],
      [24, 276],
    ]);
    polygon(
      ctx,
      [
        [24, 145],
        [4, 150],
        [2, 165],
        [22, 162],
      ],
      accentColor
    );
    gun(ctx, 40, 152, -8, fillColor, glowColor, gunColor);
    muzzleFlash(ctx, 88, 148, '#fff5b8');
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
