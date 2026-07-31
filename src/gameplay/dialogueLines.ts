export interface DialogueLine {
  speaker: string;
  text: string;
  color: string;
}

export const COMBAT_SUBTITLES: DialogueLine[] = [
  { speaker: 'Юки', text: 'Их становится больше... держись!', color: '#9b7fff' },
  { speaker: 'Юки', text: 'Патроны на исходе, прикрой меня!', color: '#9b7fff' },
  { speaker: 'Рен', text: 'Не останавливайся, мы почти прорвались!', color: '#3bffb0' },
  { speaker: 'Рен', text: 'Слева ещё одна волна!', color: '#3bffb0' },
  { speaker: 'Юки', text: 'Что бы это ни было... оно не должно пройти.', color: '#9b7fff' },
];

export const INTRO_DIALOGUES: DialogueLine[][] = [
  [
    { speaker: 'Рен', text: 'Готова?', color: '#3bffb0' },
    { speaker: 'Юки', text: 'Всегда готова.', color: '#9b7fff' },
  ],
  [
    { speaker: 'Юки', text: 'Чувствуешь? Их там много.', color: '#9b7fff' },
    { speaker: 'Рен', text: 'Значит, будет весело.', color: '#3bffb0' },
  ],
  [
    { speaker: 'Рен', text: 'Дальше только хуже.', color: '#3bffb0' },
    { speaker: 'Юки', text: 'Я знаю. Идём.', color: '#9b7fff' },
  ],
];

export const VICTORY_DIALOGUES: DialogueLine[][] = [
  [
    { speaker: 'Юки', text: 'Ну и ночка выдалась...', color: '#9b7fff' },
    { speaker: 'Рен', text: 'Это ещё не конец.', color: '#3bffb0' },
    { speaker: 'Юки', text: 'Знаю. Идём дальше.', color: '#9b7fff' },
  ],
  [
    { speaker: 'Рен', text: 'Ты в порядке?', color: '#3bffb0' },
    { speaker: 'Юки', text: 'Бывало и хуже.', color: '#9b7fff' },
    { speaker: 'Рен', text: 'Не ври мне.', color: '#3bffb0' },
    { speaker: 'Юки', text: 'Идём. Времени нет.', color: '#9b7fff' },
  ],
  [
    { speaker: 'Юки', text: 'Их всё больше с каждым разом.', color: '#9b7fff' },
    { speaker: 'Рен', text: 'Значит, мы всё делаем правильно.', color: '#3bffb0' },
  ],
];

export function pickRandomSubtitle(): DialogueLine {
  return COMBAT_SUBTITLES[Math.floor(Math.random() * COMBAT_SUBTITLES.length)];
}

export function pickIntroDialogue(stage: number): DialogueLine[] {
  return INTRO_DIALOGUES[(stage - 1) % INTRO_DIALOGUES.length];
}

export function pickVictoryDialogue(stage: number): DialogueLine[] {
  return VICTORY_DIALOGUES[(stage - 1) % VICTORY_DIALOGUES.length];
}
