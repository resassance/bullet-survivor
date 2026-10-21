import type { NovelCharacterId, NovelBackgroundId } from '../gameplay/novelScenes';

/** Deliberately schematic stand-ins. Replace with transparent art in novelScenes.ts. */
export function createNovelFigure(id: NovelCharacterId): HTMLElement {
  const figure = document.createElement('div');
  figure.className = 'novel-figure';
  figure.setAttribute('aria-hidden', 'true');
  const head = id === 'yuki'
    ? '<path d="M100 118V89q0-41 40-41t40 41v29l-16-10-5-29-32 17-10 25Z" fill="currentColor" opacity=".25"/><path d="M119 87q0-23 21-23t21 23v25q-4 24-21 24t-21-24Z"/>'
    : '<path d="m106 86 8-32 28-13 30 17 6 30-19-12-37 13Z" fill="currentColor" opacity=".25"/><path d="M116 82q0-22 25-22t25 22v28q-5 26-25 26t-25-26Z"/>';
  figure.innerHTML = `<svg viewBox="0 0 280 440" fill="none" stroke="currentColor" stroke-width="1.25">
    <path d="M28 398h224M140 24v16M28 262h18m188 0h18" opacity=".28"/>
    <path d="M52 398v-33l20-162q3-32 43-45l13-20h24l15 20q38 12 43 45l19 162v33" fill="currentColor" fill-opacity=".065"/>
    ${head}
    <path d="m115 158 25 27 27-27M140 185v212M80 220l-7 121 32 6 11-112M200 220l9 121-32 6-11-112M105 398l11-94h49l11 94" opacity=".65"/>
    <path d="m104 205 72 50m-81 18h32m26 0h32M102 301h77" opacity=".4"/>
    <path d="M22 56V36h20m196 0h20v20M22 376v22h20m196 0h20v-22" opacity=".32"/>
  </svg>`;
  return figure;
}

export function createNovelBackdrop(background: NovelBackgroundId): HTMLElement {
  const backdrop = document.createElement('div');
  backdrop.className = 'novel-backdrop-placeholder';
  backdrop.setAttribute('aria-hidden', 'true');
  if (background === 'bunker_corridor') {
    backdrop.innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#afc5bb" stroke-opacity=".2">
      <path d="M0 0h1600v900H0Z" fill="#102122" stroke="none"/>
      <path d="M520 240h560v420H520Z" fill="#0b1419"/><path d="M660 340h280v320H660Z"/>
      <path d="M0 0 520 240m1080 0L1600 0M0 900l520-240m560 0 520 240M0 660h1600M260 120v660M1340 120v660M400 185v540M1200 185v540M520 240h560M400 185h800M260 120h1080"/>
      <path d="M700 130h200m-180 65h160m-160 95h160" stroke="#d6c49c" stroke-width="5" stroke-opacity=".5"/>
    </svg>`;
    return backdrop;
  }
  backdrop.innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" fill="none">
    <path d="M0 516h65V385h104v-70h75v201h96V435h54V301h100v215h78V368h101v148h72V402h62v114h81V324h45v-51h79v243h110V389h76v127h97V331h104v185h88V417h90v99h102V378h84v138h85" fill="#101e24" fill-opacity=".65" stroke="#a7b8b7" stroke-opacity=".18"/>
    <path d="M0 584h1600v316H0Z" fill="#0d171d" fill-opacity=".65"/>
    <path d="m360 900 389-316h100l391 316M800 620v36m0 35v56m0 42v87M0 584h1600M170 583V447h230v136m800 0V447h230v136" stroke="#c5c6ae" stroke-opacity=".16" stroke-width="2"/>
    <path d="M190 454 530 665H52Zm1220 0-340 211h478Z" fill="#c0d9d0" fill-opacity=".035"/>
    <path d="M170 447h230m800 0h230" stroke="#d7ba87" stroke-opacity=".6" stroke-width="3"/>
  </svg>`;
  return backdrop;
}
