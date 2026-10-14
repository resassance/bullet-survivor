export type NovelBackgroundId =
  | 'camp_perimeter_night'
  | 'ruined_highway'
  | 'bunker_corridor'
  | 'city_outskirts_dusk';

export interface NovelBackgroundDef {
  id: NovelBackgroundId;
  fallbackGradient: [string, string];
  imagePath: string;
}

export const NOVEL_BACKGROUNDS: Record<NovelBackgroundId, NovelBackgroundDef> = {
  camp_perimeter_night: {
    id: 'camp_perimeter_night',
    fallbackGradient: ['#120b08', '#040308'],
    imagePath: '/assets/novel/backgrounds/camp_perimeter_night.jpg',
  },
  ruined_highway: {
    id: 'ruined_highway',
    fallbackGradient: ['#1a1430', '#050308'],
    imagePath: '/assets/novel/backgrounds/ruined_highway.jpg',
  },
  bunker_corridor: {
    id: 'bunker_corridor',
    fallbackGradient: ['#0d1420', '#03040a'],
    imagePath: '/assets/novel/backgrounds/bunker_corridor.jpg',
  },
  city_outskirts_dusk: {
    id: 'city_outskirts_dusk',
    fallbackGradient: ['#2a1230', '#08040c'],
    imagePath: '/assets/novel/backgrounds/city_outskirts_dusk.jpg',
  },
};

export type NovelCharacterId = 'yuki' | 'ren';

export interface NovelCharacterDef {
  id: NovelCharacterId;
  displayName: string;
  color: string;
  imagePath: string;
}

export const NOVEL_CHARACTERS: Record<NovelCharacterId, NovelCharacterDef> = {
  yuki: {
    id: 'yuki',
    displayName: 'Юки',
    color: '#9b7fff',
    imagePath: '/assets/novel/characters/yuki.png',
  },
  ren: {
    id: 'ren',
    displayName: 'Рен',
    color: '#3bffb0',
    imagePath: '/assets/novel/characters/ren.png',
  },
};

export type NovelSlot = 'left' | 'center' | 'right' | 'center-left' | 'center-right';

export interface NovelActorPlacement {
  characterId: NovelCharacterId;
  slot: NovelSlot;
}

export interface NovelLine {
  characterId: NovelCharacterId;
  text: string;
}

export interface NovelScene {
  id: string;
  background: NovelBackgroundId;
  actors: NovelActorPlacement[];
  lines: NovelLine[];
}

export const NOVEL_SCENES: NovelScene[] = [
  {
    id: 'stage-1-aftermath',
    background: 'camp_perimeter_night',
    actors: [
      { characterId: 'ren', slot: 'left' },
      { characterId: 'yuki', slot: 'right' },
    ],
    lines: [
      { characterId: 'yuki', text: 'Первая волна позади. Но это ведь только начало, да?' },
      { characterId: 'ren', text: 'Судя по докладам из бункера — да. Дальше будет плотнее.' },
      { characterId: 'yuki', text: 'Тогда не будем терять время.' },
    ],
  },
  {
    id: 'stage-2-aftermath',
    background: 'ruined_highway',
    actors: [
      { characterId: 'yuki', slot: 'center' },
    ],
    lines: [
      { characterId: 'yuki', text: 'Шоссе разбито на километры вперёд. Ничего живого.' },
      { characterId: 'yuki', text: 'Кроме них.' },
    ],
  },
  {
    id: 'stage-3-aftermath',
    background: 'bunker_corridor',
    actors: [
      { characterId: 'ren', slot: 'center-left' },
      { characterId: 'yuki', slot: 'center-right' },
    ],
    lines: [
      { characterId: 'ren', text: 'Связь с бункером есть, но сигнал слабый.' },
      { characterId: 'yuki', text: 'Значит, они тоже держатся.' },
      { characterId: 'ren', text: 'Будем на это надеяться.' },
    ],
  },
];

export function pickNovelScene(stage: number): NovelScene {
  return NOVEL_SCENES[(stage - 1) % NOVEL_SCENES.length];
}

export const FINAL_BOSS_REN_SCENE: NovelScene = {
  id: 'stage-10-ren-arrives',
  background: 'city_outskirts_dusk',
  actors: [{ characterId: 'yuki', slot: 'left' }, { characterId: 'ren', slot: 'right' }],
  lines: [
    { characterId: 'yuki', text: 'Его щит треснул… Но этот удар я не выдержу.' },
    { characterId: 'ren', text: 'Юки! Я прикрою тебя.' },
    { characterId: 'yuki', text: 'Рен? Ты успел…' },
    { characterId: 'ren', text: 'Мы связаны зеркально. Уходи в противоположный угол — я окажусь перед ударом.' },
    { characterId: 'ren', text: 'Он целится вверх слева? Выбирай низ справа. И следи, чтобы я успел добраться.' },
    { characterId: 'yuki', text: 'Поняла. Четыре укрытия, четыре отражения. Вместе.' },
  ],
};

export const FINAL_BOSS_VICTORY_SCENE: NovelScene = {
  id: 'stage-10-victory',
  background: 'city_outskirts_dusk',
  actors: [{ characterId: 'yuki', slot: 'center-left' }, { characterId: 'ren', slot: 'center-right' }],
  lines: [
    { characterId: 'ren', text: 'Держись рядом. Его сила возвращается к нему.' },
    { characterId: 'yuki', text: 'Тишина… Мы справились?' },
    { characterId: 'ren', text: 'Всё кончено. Ты больше не одна.' },
    { characterId: 'yuki', text: 'Тогда возвращаемся домой.' },
  ],
};

