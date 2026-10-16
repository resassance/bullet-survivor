export type NovelBackgroundId =
  | 'camp_perimeter_night'
  | 'ruined_highway'
  | 'bunker_corridor'
  | 'city_outskirts_dusk';

export interface NovelBackgroundDef {
  fallbackGradient: [string, string];
  label: string;
  /** Optional final art; the schematic background remains until it loads. */
  imagePath?: string;
}

export const NOVEL_BACKGROUNDS: Record<NovelBackgroundId, NovelBackgroundDef> = {
  camp_perimeter_night: {
    fallbackGradient: ['#26353b', '#101619'],
    label: 'Периметр лагеря · ночь',
  },
  ruined_highway: {
    fallbackGradient: ['#394445', '#141d22'],
    label: 'Разрушенное шоссе',
  },
  bunker_corridor: {
    fallbackGradient: ['#243332', '#0d171a'],
    label: 'Бункер · внутренний коридор',
  },
  city_outskirts_dusk: {
    fallbackGradient: ['#51483e', '#19272d'],
    label: 'Окраина города · перед рассветом',
  },
};

export type NovelCharacterId = 'yuki' | 'ren';

export interface NovelCharacterDef {
  displayName: string;
  color: string;
  imagePath?: string;
}

export const NOVEL_CHARACTERS: Record<NovelCharacterId, NovelCharacterDef> = {
  yuki: {
    displayName: 'Юки',
    color: '#d6b78d',
  },
  ren: {
    displayName: 'Рен',
    color: '#a4c7c2',
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
  title?: string;
  chapter?: string;
  continueLabel?: string;
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
  title: 'По другую сторону удара',
  chapter: 'Этап 10 · Последний рубеж',
  continueLabel: 'К бою',
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
  title: 'Возвращаемся домой',
  chapter: 'Этап 10 · Эпилог',
  continueLabel: 'К титрам',
  background: 'city_outskirts_dusk',
  actors: [{ characterId: 'yuki', slot: 'center-left' }, { characterId: 'ren', slot: 'center-right' }],
  lines: [
    { characterId: 'ren', text: 'Последний удар вернулся к нему. Больше он не поднимется.' },
    { characterId: 'yuki', text: 'Так тихо… Я уже забыла, какой бывает тишина.' },
    { characterId: 'ren', text: 'На периметре ждут нашего сигнала. Скажем им, что путь свободен.' },
    { characterId: 'yuki', text: 'Четыре укрытия в пыль. А мы всё ещё стоим.' },
    { characterId: 'ren', text: 'Мы прикрыли друг друга. И теперь можем вернуться.' },
    { characterId: 'yuki', text: 'В лагере ещё горит костёр. Пойдём домой, Рен.' },
  ],
};

