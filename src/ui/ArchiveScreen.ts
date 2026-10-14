import { ARCHIVE_ENTRIES, ARCHIVE_TABS, type ArchiveTab } from '../gameplay/archiveEntries';

export class ArchiveScreen {
  private element: HTMLDivElement;
  private tabsContainer: HTMLDivElement;
  private list: HTMLDivElement;
  private activeTab: ArchiveTab = 'story';
  private unlockedIds: Set<string> = new Set();

  constructor(container: HTMLElement, onBack: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'archive-screen';

    const content = document.createElement('div');
    content.className = 'archive-content';

    const title = document.createElement('h1');
    title.className = 'archive-title';
    title.textContent = 'архив';
    content.appendChild(title);

    this.tabsContainer = document.createElement('div');
    this.tabsContainer.className = 'archive-tabs';
    content.appendChild(this.tabsContainer);

    this.list = document.createElement('div');
    this.list.className = 'archive-list';
    content.appendChild(this.list);

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'archive-back-button';
    backButton.textContent = 'назад';
    backButton.addEventListener('click', onBack);
    content.appendChild(backButton);

    this.element.appendChild(content);
    container.appendChild(this.element);

    this.renderTabs();
  }

  public show(unlockedIds: Set<string>): void {
    this.unlockedIds = unlockedIds;
    this.renderTabs();
    this.renderList();
    this.element.classList.add('archive-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('archive-screen--visible');
  }

  private setTab(tab: ArchiveTab): void {
    this.activeTab = tab;
    this.renderTabs();
    this.renderList();
  }

  private renderTabs(): void {
    this.tabsContainer.innerHTML = '';
    for (const tab of ARCHIVE_TABS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'archive-tab';
      if (tab.id === this.activeTab) button.classList.add('archive-tab--active');
      button.textContent = tab.label;
      button.addEventListener('click', () => this.setTab(tab.id));
      this.tabsContainer.appendChild(button);
    }
  }

  private renderList(): void {
    this.list.innerHTML = '';
    const entries = ARCHIVE_ENTRIES.filter((entry) => entry.tab === this.activeTab);

    let lastSection: string | undefined;
    for (const entry of entries) {
      if (entry.section && entry.section !== lastSection) {
        lastSection = entry.section;
        const header = document.createElement('div');
        header.className = 'archive-section-header';
        header.textContent = entry.section;
        this.list.appendChild(header);
      }

      const unlocked = entry.unlockedByDefault || this.unlockedIds.has(entry.id);

      const item = document.createElement('div');
      item.className = 'archive-entry';
      if (!unlocked) item.classList.add('archive-entry--locked');

      const entryTitle = document.createElement('div');
      entryTitle.className = 'archive-entry-title';
      entryTitle.textContent = unlocked ? entry.title : '??? заблокировано';
      item.appendChild(entryTitle);

      const entryBody = document.createElement('div');
      entryBody.className = 'archive-entry-body';
      entryBody.textContent = unlocked
        ? entry.body
        : 'Найдите больше информации, чтобы разблокировать эту запись.';
      item.appendChild(entryBody);

      this.list.appendChild(item);
    }
  }
}
