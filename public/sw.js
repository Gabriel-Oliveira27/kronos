// Service worker mínimo do Kronos.
//
// Objetivo: satisfazer os critérios de "instalável" (PWA) do Chrome/Android.
// NÃO faz cache de conteúdo — o dashboard é autenticado e dinâmico, então um
// cache offline poderia servir páginas desatualizadas ou de outro usuário.
// O handler de `fetch` é pass-through (deixa o navegador resolver normalmente);
// sua simples presença habilita a instalação.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // pass-through intencional
});
