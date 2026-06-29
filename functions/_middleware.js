/* =============================================================
   MOOD BY · 옛 서비스워커 자동 자폭 미들웨어 (Cloudflare Pages Function)
   -------------------------------------------------------------
   Cloudflare 전환 전 옛 사이트가 기기에 심어둔 서비스워커는
   파일명이 제각각이라(예: firebase-messaging-sw.js, pwa-sw.js,
   workbox-xxxx.js 등) 정적 파일만으로는 전부 못 잡는다.

   브라우저는 등록된 서비스워커 스크립트를 주기적으로(최대 24h)
   네트워크에서 다시 받아 업데이트를 확인한다. 이때:
     "우리가 아는 진짜 .js 파일이 아닌, 루트의 모든 .js 요청"
   에 자폭 스크립트를 돌려주면 → 이름이 무엇이든 옛 서비스워커가
   다음 확인 때 자폭 코드로 교체되어 스스로 사라진다.
   ============================================================= */

// 실제로 존재하는 루트 .js (이건 그대로 서빙)
const REAL_ROOT_JS = new Set([
  "/build.js",
  "/sw.js",
  "/service-worker.js",
  "/serviceworker.js",
]);

const KILL_SWITCH = `/* MOOD BY service-worker kill-switch (auto) */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (event) {
  event.waitUntil((async function () {
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    var clients = await self.clients.matchAll({ type: "window" });
    clients.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} });
  })());
});
self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request));
});
`;

// 진단 + 강제 복구 페이지 (/fix, /reset)
// 서버가 직접 내려주는 새 경로라 옛 캐시/프리캐시에 잡히지 않을 확률이 높다.
const FIX_PAGE = `<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>MOOD BY 복구</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif;margin:0;padding:24px;background:#f7f3ee;color:#2e2a26;line-height:1.6}
  h1{font-size:20px;margin:0 0 4px}
  .sub{color:#8a7d6c;font-size:13px;margin-bottom:18px}
  #status{font-size:16px;font-weight:600;margin:16px 0;padding:14px;border-radius:10px;background:#fff;border:1px solid #e6ddd0}
  pre{background:#27241f;color:#e8e3da;padding:14px;border-radius:10px;font-size:12px;white-space:pre-wrap;word-break:break-all;overflow:auto}
  a.btn{display:block;text-align:center;margin-top:18px;padding:15px;border-radius:40px;background:#24211f;color:#fff;text-decoration:none;font-weight:600}
  .ok{color:#1e7a44}.bad{color:#c0392b}
</style></head><body>
<h1>MOOD BY 화면 복구</h1>
<div class="sub">기기에 남아있던 옛 버전 데이터를 제거합니다.</div>
<div id="status">검사 중…</div>
<pre id="log"></pre>
<a class="btn" href="/?fixed=1">홈으로 이동</a>
<script>
(function(){
  var log=document.getElementById('log'), status=document.getElementById('status');
  var lines=[]; function p(s){lines.push(s);log.textContent=lines.join('\\n');}
  p('URL: '+location.href);
  p('UA: '+navigator.userAgent);
  (async function(){
    var swCount=0, cacheCount=0;
    try{
      if('serviceWorker' in navigator){
        var regs=await navigator.serviceWorker.getRegistrations();
        p('서비스워커 등록 수: '+regs.length);
        for(var i=0;i<regs.length;i++){
          var u=(regs[i].active&&regs[i].active.scriptURL)||(regs[i].installing&&regs[i].installing.scriptURL)||'(unknown)';
          p('  - '+u+'  scope='+regs[i].scope);
          try{await regs[i].unregister();swCount++;}catch(e){p('    unregister 실패: '+e);}
        }
      } else { p('서비스워커 미지원 브라우저'); }
    }catch(e){ p('SW 조회 오류: '+e); }
    try{
      if(window.caches&&caches.keys){
        var keys=await caches.keys();
        p('캐시 저장소: '+(keys.length?keys.join(', '):'(없음)'));
        for(var j=0;j<keys.length;j++){ await caches.delete(keys[j]); cacheCount++; }
      }
    }catch(e){ p('캐시 조회 오류: '+e); }
    try{ localStorage.clear(); sessionStorage.clear(); }catch(e){}
    var did = swCount+cacheCount;
    if(did>0){
      status.innerHTML='<span class="ok">제거 완료!</span> 서비스워커 '+swCount+'개, 캐시 '+cacheCount+'개 삭제했습니다. 아래 [홈으로 이동]을 누르세요.';
    } else {
      status.innerHTML='이 브라우저에는 제거할 옛 서비스워커/캐시가 <b>없습니다.</b> 그래도 구버전이 보이면 아래 로그를 캡처해서 보내주세요.';
    }
  })();
})();
</script></body></html>`;

export async function onRequest(context) {
  const { request, next } = context;
  const path = new URL(request.url).pathname;

  // 진단/복구 페이지
  if (path === "/fix" || path === "/reset" || path === "/fix.html") {
    return new Response(FIX_PAGE, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache, no-store, must-revalidate",
        // 지원하는 브라우저(크롬 등)에서는 이 헤더만으로도 SW·캐시·저장소가 즉시 삭제됨
        "clear-site-data": '"cache", "storage", "cookies"',
      },
    });
  }

  // 루트 바로 아래의 단일 .js 파일이면서, 우리가 아는 진짜 파일이 아니면
  // → 옛 서비스워커 스크립트로 간주하고 자폭 코드를 돌려준다.
  const isRootJs = /^\/[^/]+\.js$/.test(path);
  if (isRootJs && !REAL_ROOT_JS.has(path)) {
    return new Response(KILL_SWITCH, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // 그 외 모든 요청은 평소대로(정적 파일) 처리
  return next();
}
