import type { DialogueLine } from '../gameplay/dialogueLines';
import type { NovelCharacterId } from '../gameplay/novelScenes';
import { VisualNovelScene } from './VisualNovelScene';

/** Short briefings share the same stage, controls and placeholders as story scenes. */
export class DialogueScreen {
  private novel: VisualNovelScene;

  constructor(novel: VisualNovelScene) { this.novel = novel; }

  public play(lines: DialogueLine[], onComplete: () => void): void {
    const characterId = (speaker: string): NovelCharacterId => speaker === 'Рен' ? 'ren' : 'yuki';
    const characters = [...new Set(lines.map(line => characterId(line.speaker)))];
    this.novel.play({
      id: 'checkpoint-briefing',
      title: 'На рубеже',
      chapter: 'КПП · Радиоэфир',
      background: 'camp_perimeter_night',
      actors: characters.map((id, index) => ({ characterId: id, slot: characters.length === 1 ? 'center' : index === 0 ? 'left' : 'right' })),
      lines: lines.map(line => ({ characterId: characterId(line.speaker), text: line.text })),
    }, onComplete);
  }
}
