const keys = {};
const justPressedKeys = {};

window.addEventListener('keydown', e => {
  if (!keys[e.code]) justPressedKeys[e.code] = true;
  keys[e.code] = true;
  e.preventDefault();
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
  e.preventDefault();
});

export function isDown(code) {
  return !!keys[code];
}

export function justPressed(code) {
  return !!justPressedKeys[code];
}

export function clearJustPressed() {
  for (const k in justPressedKeys) delete justPressedKeys[k];
}
