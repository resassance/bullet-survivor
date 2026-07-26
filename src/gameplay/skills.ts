export interface Skill {
  id: string;
  name: string;
  description: string;
}

export const SKILLS: Skill[] = [
  { id: 'ricochet', name: 'Рикошет', description: 'Пули пробивают ещё одного эфириала' },
  { id: 'poisonBullets', name: 'Ядовитые выстрелы', description: 'Пули оставляют яд, наносящий урон со временем' },
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
