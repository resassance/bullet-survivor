export interface ArchiveEntry {
  title: string;
  body: string;
  unlocked: boolean;
}

export const ARCHIVE_ENTRIES: ArchiveEntry[] = [
  {
    title: 'Записка №1: Первая ночь',
    body: 'Они пришли без предупреждения. Город замолчал за одну ночь. Мы называем их эфириалами — никто не знает почему.',
    unlocked: true,
  },
  {
    title: 'Юки — личное дело',
    body: 'Позывной "Юки". Возраст неизвестен. Единственная, кто помнит время до вторжения. Молчит об этом.',
    unlocked: true,
  },
  {
    title: 'Рен — личное дело',
    body: 'Позывной "Рен". Бывший инженер. Собрал баррикаду лагеря из того, что осталось от старого моста.',
    unlocked: true,
  },
  {
    title: 'Записка №7: Источник',
    body: '???',
    unlocked: false,
  },
  {
    title: 'Сектор Ω',
    body: '???',
    unlocked: false,
  },
];
