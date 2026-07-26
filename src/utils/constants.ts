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
  MAX_HP: 5,
  CONTACT_DAMAGE: 1, // урон от одного касания эфириала
  INVULNERABILITY_DURATION: 0.8, // сек неуязвимости после удара — защита от мгновенного мультихита
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
  DAMAGE: 1,
};

// --- ВРАГИ (ЭФИРИАЛЫ) ---
export const ENEMY = {
  POOL_SIZE: 150,
  WIDTH: 1.4,
  HEIGHT: 1.9,
  SPEED: 3.2, // юниты/сек к игроку по Z
  SPEED_VARIANCE: 0.18, // ±18% индивидуального разброса скорости — не идут единой шеренгой
  HOMING_STRENGTH: 1.5, // базовая скорость доворота по X к целевой линии
  HOMING_VARIANCE: 0.4, // ±40% разброса силы доворота между врагами
  LANE_OFFSET_SPREAD: 3.5, // своя "полоса" относительно игрока — не сходятся в одну точку
  WOBBLE_AMPLITUDE_MIN: 0.15, // лёгкое синусоидальное виляние по X — органика вместо строя
  WOBBLE_AMPLITUDE_MAX: 0.6,
  WOBBLE_FREQUENCY_MIN: 0.5,
  WOBBLE_FREQUENCY_MAX: 1.3,
  HEALTH: 2,
  COLLISION_RADIUS: 0.6,
  SPAWN_INTERVAL: 1.4, // сек между волнами
  SPAWN_COUNT_MIN: 2,
  SPAWN_COUNT_MAX: 4,
  SPAWN_X_SPREAD: 8, // разброс по X при спавне волны — шире границ игрока, часть врагов заходит по диагонали
  SPAWN_Z_JITTER: 3, // разброс стартовой Z — волна не спавнится идеально ровной линией
  DESPAWN_Z: 15, // safety net: если враг прошёл мимо игрока не столкнувшись
};

// --- КОЛЛИЗИИ ---
export const COLLISION = {
  PLAYER_RADIUS: 0.5,
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
