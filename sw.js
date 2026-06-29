/* =============================================================
   MOOD BY · 서비스워커 자폭(kill-switch)
   -------------------------------------------------------------
   예전 사이트가 기기에 설치한 서비스워커가 옛날 페이지를
   오프라인 캐시처럼 계속 보여주는 문제를 끝내기 위한 파일.

   기기에 남아있던 옛 서비스워커가 이 파일로 업데이트되면:
     1) 모든 캐시 저장소 삭제
     2) 자기 자신 등록 해제
     3) 열려있는 모든 탭 강제 새로고침
   이후 이 사이트는 더 이상 서비스워커를 쓰지 않습니다.
   ============================================================= */
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {}
      try {
        await self.registration.unregister();
      } catch (e) {}
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        try { client.navigate(client.url); } catch (e) {}
      });
    })()
  );
});

// 혹시 남아있는 fetch 가로채기를 무력화: 항상 네트워크로 직행
self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request));
});
