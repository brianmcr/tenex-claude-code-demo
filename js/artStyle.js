let currentStyle = localStorage.getItem('artStyle') || 'classic';

export function getStyle() { return currentStyle; }

export function setStyle(s) {
  currentStyle = s;
  localStorage.setItem('artStyle', s);
}
