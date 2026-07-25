// ============================================================
// ГЛОБАЛЬНЫЕ КОНСТАНТЫ ПРОЕКТА
// Все "магические числа" собраны здесь, чтобы не гонять их
// по десяткам файлов при тюнинге баланса/визуала.
// ============================================================

// --- КАМЕРА ---
// Референс: Nikke: Goddess of Victory — узкий FOV, камера ниже
// и ближе к персонажу, лёгкий наклон сверху вниз.
export const CAMERA = {
  FOV: 38, // узкий FOV = "телеобъективное" сжатие перспективы
  NEAR: 0.1,
  FAR: 200,
  POSITION: { x: 0, y: 4.5, z: 9.5 },
  LOOK_AT: { x: 0, y: 1.2, z: -8 }, // смотрим чуть выше и глубже центра арены
};

// --- АРЕНА / ПОЛЕ БОЯ ---
export const ARENA = {
  WIDTH: 12, // общая ширина арены по X
  PLAYER_BOUND_X: 5, // ограничение движения игрока по оси X (-5..+5)
  DEPTH: 60, // глубина арены по Z (враги спавнятся на -DEPTH)
  ENEMY_SPAWN_Z: -50,
  BULLET_DESPAWN_Z: -60,
};

// --- ТУМАН ---
export const FOG = {
  COLOR: 0x0a0a12, // тёмный, депрессивный
  DENSITY: 0.035,
};

// --- ФОН / ОКРУЖЕНИЕ ---
export const BACKGROUND_COLOR = 0x05050a;

// --- СЕТКА ПОЛА ---
export const GRID = {
  SIZE: 80,
  DIVISIONS: 40,
  COLOR_MAIN: 0x2a1f4d, // приглушённый неон-фиолет
  COLOR_SECONDARY: 0x1a1430,
  EMISSIVE_COLOR: 0x6a3ffb,
};

// --- СВЕТ ---
export const LIGHTING = {
  AMBIENT_COLOR: 0x2a1f4d,
  AMBIENT_INTENSITY: 0.6,
  DIRECTIONAL_COLOR: 0x9b7fff,
  DIRECTIONAL_INTENSITY: 1.2,
  DIRECTIONAL_POSITION: { x: 3, y: 10, z: 5 },
  RIM_COLOR: 0xff3b6e, // холодный неон + тёплый рим-лайт для контраста
  RIM_INTENSITY: 0.8,
  RIM_POSITION: { x: -5, y: 3, z: -10 },
};

// --- ИГРОК ---
export const PLAYER = {
  WIDTH: 1.6,
  HEIGHT: 2.2,
  SPAWN_Z: 0,
  MOVE_SMOOTHING: 12, // выше = резче реагирует на ввод (экспоненциальный lerp)
};

// --- ПУЛИ ---
export const BULLET = {
  POOL_SIZE: 300, // фиксированный пул — без runtime-аллокаций
  SPEED: 24, // юниты/сек вдоль -Z
  FIRE_RATE: 6, // выстрелов в секунду
  RADIUS: 0.08,
  LENGTH: 0.4, // капсула вытянута вдоль Z — вид "болта", а не шарика
  SPAWN_HEIGHT: 1.3, // высота вылета (примерно уровень груди персонажа)
  COLOR: 0xff3b6e, // неон-розовый, перекликается с рим-лайтом
};

// --- ВВОД ---
export const INPUT = {
  KEYBOARD_SPEED: 8, // юниты/сек при движении WASD/стрелками
};

// --- RENDERER ---
export const RENDERER = {
  MAX_PIXEL_RATIO: 2, // ограничиваем DPR ради производительности на мобилках
  ANTIALIAS: true,
};
