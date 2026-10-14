import * as THREE from 'three';

export function createSilhouetteSpriteSheet(
  options: { glowColor: string; fillColor: string },
  cols: number,
  rows: number
): THREE.CanvasTexture {
  const cellSize = 256;
  const canvas = document.createElement('canvas');
  canvas.width = cellSize * cols;
  canvas.height = cellSize * rows;
  const ctx = canvas.getContext('2d')!;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      drawSilhouetteCell(ctx, col * cellSize, row * cellSize, cellSize, options, col / cols);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function drawSilhouetteCell(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  size: number,
  options: { glowColor: string; fillColor: string },
  stepPhase: number
): void {
  const stepOffset = Math.sin(stepPhase * Math.PI * 2) * size * 0.05;

  ctx.save();
  ctx.translate(originX, originY);
  ctx.clearRect(0, 0, size, size);

  ctx.shadowColor = options.glowColor;
  ctx.shadowBlur = 20;
  ctx.fillStyle = options.fillColor;
  ctx.strokeStyle = options.glowColor;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(size / 2, size * 0.28, size * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.36 + stepOffset, size * 0.42);
  ctx.lineTo(size * 0.64 + stepOffset, size * 0.42);
  ctx.lineTo(size * 0.72 - stepOffset, size * 0.92);
  ctx.lineTo(size * 0.28 - stepOffset, size * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
