export function createPortraitCanvas(frame: 'a' | 'b', color: string): HTMLCanvasElement {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const tilt = frame === 'b' ? 5 : -3;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.translate(-size / 2, -size / 2);

  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = color;
  ctx.fillStyle = '#1a1430';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(size * 0.34, size * 0.42);
  ctx.lineTo(size * 0.24, size * 0.14);
  ctx.lineTo(size * 0.42, size * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.66, size * 0.42);
  ctx.lineTo(size * 0.76, size * 0.14);
  ctx.lineTo(size * 0.58, size * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(size / 2, size * 0.5, size * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.22, size);
  ctx.lineTo(size * 0.3, size * 0.78);
  ctx.lineTo(size * 0.7, size * 0.78);
  ctx.lineTo(size * 0.78, size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
  return canvas;
}
