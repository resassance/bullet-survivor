import { WEAPONS } from './weapons';
import { SPECIAL_WEAPONS } from './specialWeapons';
import { BUFF_CARD_DEFS } from './buffCards';

export type ArchiveTab = 'story' | 'characters' | 'enemies' | 'weapons' | 'buffs';

export interface ArchiveEntry {
  id: string;
  tab: ArchiveTab;
  section?: string;
  title: string;
  body: string;
  unlockedByDefault: boolean;
}

const STATIC_ENTRIES: ArchiveEntry[] = [
  {
    id: 'story_note_1',
    tab: 'story',
    title: 'Записка №1: Первая ночь',
    body: 'Они пришли без предупреждения. Город замолчал за одну ночь. Мы называем их эфириалами — никто не знает почему.',
    unlockedByDefault: true,
  },
  {
    id: 'story_note_7',
    tab: 'story',
    title: 'Записка №7: Источник',
    body: '???',
    unlockedByDefault: false,
  },
  {
    id: 'story_sector_omega',
    tab: 'story',
    title: 'Сектор Ω',
    body: '???',
    unlockedByDefault: false,
  },
  {
    id: 'char_yuki',
    tab: 'characters',
    title: 'Юки — личное дело',
    body: 'Позывной "Юки". Возраст неизвестен. Единственная, кто помнит время до вторжения. Молчит об этом.',
    unlockedByDefault: true,
  },
  {
    id: 'char_ren',
    tab: 'characters',
    title: 'Рен — личное дело',
    body: 'Позывной "Рен". Бывший инженер. Собрал баррикаду лагеря из того, что осталось от старого моста.',
    unlockedByDefault: true,
  },
];

const ENEMY_ENTRIES: ArchiveEntry[] = [
  {
    id: 'enemy_normal',
    tab: 'enemies',
    section: 'обычные',
    title: 'Обычные эфириалы',
    body: 'Рядовые особи. Медленные, но идут волнами.',
    unlockedByDefault: false,
  },
  {
    id: 'enemy_elite',
    tab: 'enemies',
    section: 'элитные',
    title: 'Элитные эфириалы',
    body: 'Крупнее и живучее рядовых. Выделяются на поле боя.',
    unlockedByDefault: false,
  },
  {
    id: 'enemy_boss',
    tab: 'enemies',
    section: 'боссы',
    title: 'Боссы',
    body: 'Редкие и опасные. Способны атаковать на дистанции.',
    unlockedByDefault: false,
  },
];

const WEAPON_ENTRIES: ArchiveEntry[] = [
  ...WEAPONS.map((weapon) => ({
    id: `weapon_${weapon.id}`,
    tab: 'weapons' as const,
    section: 'обычное',
    title: weapon.name,
    body: `Урон за выстрел: ${weapon.damage}. Магазин: ${weapon.magazineSize}.`,
    unlockedByDefault: weapon.id === 'standard',
  })),
  ...SPECIAL_WEAPONS.map((weapon) => ({
    id: `weapon_special_${weapon.id}`,
    tab: 'weapons' as const,
    section: 'специальное',
    title: weapon.name,
    body: weapon.description,
    unlockedByDefault: false,
  })),
];

const BUFF_ENTRIES: ArchiveEntry[] = BUFF_CARD_DEFS.map((def) => ({
  id: `buff_${def.type}_${def.tier}`,
  tab: 'buffs' as const,
  section: `тир ${def.tier}`,
  title: `${def.name} · тир ${def.tier}`,
  body: def.description,
  unlockedByDefault: false,
}));

export const ARCHIVE_ENTRIES: ArchiveEntry[] = [
  ...STATIC_ENTRIES,
  ...ENEMY_ENTRIES,
  ...WEAPON_ENTRIES,
  ...BUFF_ENTRIES,
];

export const ARCHIVE_TABS: { id: ArchiveTab; label: string }[] = [
  { id: 'story', label: 'сюжет' },
  { id: 'characters', label: 'персонажи' },
  { id: 'enemies', label: 'враги' },
  { id: 'weapons', label: 'оружие' },
  { id: 'buffs', label: 'баффы' },
];

