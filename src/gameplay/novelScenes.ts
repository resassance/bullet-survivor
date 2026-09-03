export type NovelBackgroundId =
  | 'camp_perimeter_night'
  | 'ruined_highway'
  | 'bunker_corridor'
  | 'city_outskirts_dusk';

export interface NovelBackgroundDef {
  id: NovelBackgroundId;
  fallbackGradient: [string, string];
}

export const NOVEL_BACKGROUNDS: Record<NovelBackgroundId, NovelBackgroundDef> = {
  camp_perimeter_night: { id: 'camp_perimeter_night', fallbackGradient: ['#120b08', '#040308'] },
  ruined_highway: { id: 'ruined_highway', fallbackGradient: ['#1a1430', '#050308'] },
  bunker_corridor: { id: 'bunker_corridor', fallbackGradient: ['#0d1420', '#03040a'] },
  city_outskirts_dusk: { id: 'city_outskirts_dusk', fallbackGradient: ['#2a1230', '#08040c'] },
};

export type NovelCharacterId = 'yuki' | 'ren';

export interface NovelCharacterDef {
  id: NovelCharacterId;
  displayName: string;
  color: string;
}

export const NOVEL_CHARACTERS: Record<NovelCharacterId, NovelCharacterDef> = {
  yuki: { id: 'yuki', displayName: 'Юки', color: '#9b7fff' },
  ren: { id: 'ren', displayName: 'Рен', color: '#3bffb0' },
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
