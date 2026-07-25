import * as THREE from 'three';

/**
 * ВРЕМЕННЫЙ хелпер: генерирует silhouette-плейсхолдер на <canvas>,
 * пока нет финального 2D-арта персонажей/врагов.
 * Заменить на THREE.TextureLoader().load('/assets/sprites/xxx.png')
 * когда появятся настоящие спрайты — интерфейс использования тот же
 * (просто THREE.Texture на выходе).
 */
export function createSilhouettePlaceholder(options: {
  glowColor: string; // неоновый контур, напр. '#9b7fff'
  fillColor: string; // заливка силуэта, напр. '#1a1430'
  label?: string; // debug-подпись под фигурой
}): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // Простой гуманоидный силуэт: голова + туловище-трапеция
  ctx.save();
  ctx.shadowColor = options.glowColor;
  ctx.shadowBlur = 20;
  ctx.fillStyle = options.fillColor;
  ctx.strokeStyle = options.glowColor;
  ctx.lineWidth = 4;

  // голова
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.28, size * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // туловище
  ctx.beginPath();
  ctx.moveTo(size * 0.36, size * 0.42);
  ctx.lineTo(size * 0.64, size * 0.42);
  ctx.lineTo(size * 0.72, size * 0.92);
  ctx.lineTo(size * 0.28, size * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (options.label) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.label, size / 2, size - 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
