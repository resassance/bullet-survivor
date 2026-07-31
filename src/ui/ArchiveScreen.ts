import { ARCHIVE_ENTRIES } from '../gameplay/archiveEntries';

export class ArchiveScreen {
  private element: HTMLDivElement;

  constructor(container: HTMLElement, onBack: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'archive-screen';

    const content = document.createElement('div');
    content.className = 'archive-content';

    const title = document.createElement('h1');
    title.className = 'archive-title';
    title.textContent = 'архив';
    content.appendChild(title);

    const list = document.createElement('div');
    list.className = 'archive-list';

    for (const entry of ARCHIVE_ENTRIES) {
      const item = document.createElement('div');
      item.className = 'archive-entry';
      if (!entry.unlocked) item.classList.add('archive-entry--locked');

      const entryTitle = document.createElement('div');
      entryTitle.className = 'archive-entry-title';
      entryTitle.textContent = entry.unlocked ? entry.title : '??? заблокировано';
      item.appendChild(entryTitle);

      const entryBody = document.createElement('div');
      entryBody.className = 'archive-entry-body';
      entryBody.textContent = entry.unlocked ? entry.body : 'Найдите больше информации, чтобы разблокировать эту запись.';
      item.appendChild(entryBody);

      list.appendChild(item);
    }
    content.appendChild(list);

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'archive-back-button';
    backButton.textContent = 'назад';
    backButton.addEventListener('click', onBack);
    content.appendChild(backButton);

    this.element.appendChild(content);
    container.appendChild(this.element);
  }

  public show(): void {
    this.element.classList.add('archive-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('archive-screen--visible');
  }
}
