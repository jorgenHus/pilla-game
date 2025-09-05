const CACHE_NAME = 'smor-game-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/js/data/cards.js',
  '/js/data/npcs.js',
  '/js/data/places.js',
  '/js/game/card.js',
  '/js/game/deck.js',
  '/js/game/dice-roller.js',
  '/js/game/engine.js',
  '/js/game/game-flow.js',
  '/js/game/ice.js',
  '/js/game/npc.js',
  '/js/game/place.js',
  '/js/game/player-turns.js',
  '/js/game/player.js',
  '/js/game/special-effects.js',
  '/js/game/ui-display.js',
  '/aztecGamesLogo.png'
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
