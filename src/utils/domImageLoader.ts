export function tryLoadDomImage(path: string, onLoaded: (path: string) => void): void {
  const image = new Image();
  image.onload = () => onLoaded(path);
  image.onerror = () => {};
  image.src = path;
}
