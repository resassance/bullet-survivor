export interface Skill {
  id: string;
  name: string;
  description: string;
}

export const SKILLS: Skill[] = [
  { id: 'ricochet', name: 'Рикошет', description: 'Пули пробивают ещё одного эфириала' },
  { id: 'poisonBullets', name: 'Ядовитые выстрелы', description: 'Пули оставляют яд, наносящий урон со временем' },
  { id: 'vitality', name: 'Живучесть', description: 'Увеличивает максимум HP и лечит на ту же величину' },
  { id: 'regen', name: 'Регенерация', description: 'Медленно восстанавливает HP каждую секунду' },
  { id: 'magazine', name: 'Расширенный магазин', description: 'Увеличивает размер обоймы' },
  { id: 'fastReload', name: 'Быстрая перезарядка', description: 'Сокращает время перезарядки' },
  { id: 'explosiveRounds', name: 'Рывок-взрыв', description: 'Шанс, что убитый враг взорвётся и заденет соседей' },
  { id: 'aimAssist', name: 'Чутьё', description: 'Чуть подталкивает пули к ближайшим врагам' },
];

export function pickRandomSkills(count: number): Skill[] {
  const pool = [...SKILLS];
  const result: Skill[] = [];
  const take = Math.min(count, pool.length);

  for (let i = 0; i < take; i++) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool[index]);
    pool.splice(index, 1);
  }

  return result;
}
