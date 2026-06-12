import { Game } from './game.js';

const canvas = document.getElementById('game');
new Game(canvas);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline-first: ignore registration errors */
    });
  });
}
