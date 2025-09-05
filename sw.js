const CACHE_NAME = 'smor-game-v1';
const urlsToCache = [
  '/pilla-game/',
  '/pilla-game/index.html',
  '/pilla-game/css/style.css',
  '/pilla-game/js/main.js',
  '/pilla-game/js/data/cards.js',
  '/pilla-game/js/data/npcs.js',
  '/pilla-game/js/data/places.js',
  '/pilla-game/js/game/card.js',
  '/pilla-game/js/game/deck.js',
  '/pilla-game/js/game/dice-roller.js',
  '/pilla-game/js/game/engine.js',
  '/pilla-game/js/game/game-flow.js',
  '/pilla-game/js/game/ice.js',
  '/pilla-game/js/game/npc.js',
  '/pilla-game/js/game/place.js',
  '/pilla-game/js/game/player-turns.js',
  '/pilla-game/js/game/player.js',
  '/pilla-game/js/game/special-effects.js',
  '/pilla-game/js/game/ui-display.js',
  '/pilla-game/aztecGamesLogo.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
