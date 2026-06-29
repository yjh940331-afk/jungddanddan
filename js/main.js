/* ============================================================
   무드바이 (MOOD BY) · 동작 스크립트
   site-config.js / settings.json 내용을 화면에 그려주고,
   사회자 명단/메뉴/라이트박스를 제어합니다.
   일반적인 경우 이 파일은 수정할 필요가 없습니다.
   ============================================================ */
(function () {
  "use strict";
  var C = window.SITE_CONFIG || {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  /* 여러 줄 텍스트(배열/문자열/객체배열) → 문자열 배열로 정규화 */
  function lines(v) {
    if (Array.isArray(v)) return v.map(function (x) {
      return typeof x === "string" ? x : (x && (x.line || x.item || x.text)) || "";
    }).filter(function (s) { return s !== ""; });
    if (typeof v === "string") return v.split("\n").filter(function (s) { return s.trim() !== ""; });
    return [];
  }
  function listHtml(items) {
    return lines(items).map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("");
  }
  function ytId(v) {
    if (!v) return "";
    var s = String(v).trim();
    var m = s.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{6,})/);
    return m ? m[1] : s;
  }

  /* 무드바이 팔레트(폴백) — 사회자에 색이 지정되지 않으면 순서대로 사용 */
  var PALETTE = ["#F08A3C", "#6FA86B", "#E58BB0", "#4FA3C7", "#F2C24B", "#9B7EDE", "#D9534F", "#C8A98C", "#5BB9A6", "#E2725B"];
  function mcColor(m, i) { return (m && m.color) || PALETTE[i % PALETTE.length]; }

  /* ---------- 브랜드명 ---------- */
  $$("[data-brand]").forEach(function (el) { if (C.brand) el.textContent = C.brand; });
  if (C.company) { var fc = $("[data-footer-company]"); if (fc) fc.textContent = C.company; }

  /* ---------- 히어로 ---------- */
  if (C.hero) {
    var hb = $("[data-hero-bg]");
    if (hb && C.hero.image) hb.style.backgroundImage = "url('" + C.hero.image + "')";
    var htag = $("[data-hero-tagline]"); if (htag && C.hero.tagline) htag.textContent = C.hero.tagline;
    var hsub = $("[data-hero-sub]"); if (hsub) hsub.textContent = C.hero.sub || "";

    /* "MOOD BY ___" 형용사가 색을 바꿔가며 하나씩 떠오르는 연출 */
    var hw = $("[data-hero-word]");
    var words = lines(C.hero.words);
    if (hw && words.length) {
      var wi = 0;
      hw.textContent = words[0];
      hw.style.color = PALETTE[0];
      if (words.length > 1 && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
        window.setInterval(function () {
          hw.classList.add("swap");
          window.setTimeout(function () {
            wi = (wi + 1) % words.length;
            hw.textContent = words[wi];
            hw.style.color = PALETTE[wi % PALETTE.length];
            hw.classList.remove("swap");
          }, 500);
        }, 2200);
      }
    }
  }

  /* ---------- About ---------- */
  if (C.about) {
    if (C.about.title) $("[data-about-title]").textContent = C.about.title;
    var ab = $("[data-about-body]");
    if (ab) ab.innerHTML = lines(C.about.body).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    var fit = $("#aboutFit");
    if (fit) {
      fit.innerHTML = listHtml(C.about.fit);
      if (!lines(C.about.fit).length) { var fw = fit.closest(".about-fit"); if (fw) fw.style.display = "none"; }
    }
  }

  /* ---------- 대표 소개 ---------- */
  if (C.ceo) {
    var ceo = C.ceo;
    var ct = $("[data-ceo-title]"); if (ct) ct.textContent = ceo.title || "대표 소개";
    var cr = $("[data-ceo-role]"); if (cr) cr.textContent = ceo.role || "";
    var ci = $("[data-ceo-img]");
    if (ci) { if (ceo.image) ci.src = ceo.image; else { var cp = ci.closest(".ceo-profile"); if (cp) cp.style.display = "none"; } }
    var cb = $("[data-ceo-body]");
    if (cb) cb.innerHTML = lines(ceo.body).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
  }

  /* ---------- 비전 / 미션 / 약속 ---------- */
  if (C.vision) {
    var vl = $("#visionList"); if (vl) vl.innerHTML = listHtml(C.vision.vision);
    var mm = $("[data-mission]"); if (mm) mm.textContent = lines(C.vision.mission).join(" ");
    var pl = $("#promiseList"); if (pl) pl.innerHTML = listHtml(C.vision.promises);
  }

  /* ---------- Mood Crew ---------- */
  function cardGrid(el, items) {
    if (!el || !items) return;
    el.innerHTML = items.map(function (b, i) {
      return '<article class="trust-card reveal" style="transition-delay:' + (Math.min(i, 5) * 0.06) + 's">' +
        (b.icon ? '<div class="trust-icon">' + esc(b.icon) + "</div>" : "") +
        "<h3>" + esc(b.title || "") + "</h3>" +
        "<p>" + esc(b.text || b.desc || "") + "</p>" +
      "</article>";
    }).join("");
  }
  if (C.crew) {
    var clead = $("[data-crew-lead]"); if (clead) clead.textContent = C.crew.lead || "";
    cardGrid($("#crewWays"), C.crew.ways);
    cardGrid($("#crewDiffs"), C.crew.diffs);
  }

  /* ---------- MC 사회자 명단 ---------- */
  var MCS = (C.mcs || []).filter(function (m) { return m && m.name; });
  var mcGrid = $("#mcGrid");
  var mcFilters = $("#mcFilters");

  function mcKeywords(m) { return lines(m.keywords); }

  function buildMcFilters() {
    if (!mcFilters) return;
    var set = [];
    MCS.forEach(function (m) { mcKeywords(m).forEach(function (k) { if (set.indexOf(k) === -1) set.push(k); }); });
    var btns = ['<button class="filter active" data-mood="all">전체</button>'];
    set.forEach(function (k) { btns.push('<button class="filter" data-mood="' + esc(k) + '">' + esc(k) + "</button>"); });
    mcFilters.innerHTML = btns.join("");
    $$(".filter", mcFilters).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".filter", mcFilters).forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        renderMc(btn.dataset.mood);
      });
    });
  }

  function mcThumb(m) {
    if (m.image) return '<img src="' + esc(m.image) + '" alt="' + esc(m.name) + '" loading="lazy" />';
    if (m.youtube) return '<img src="https://img.youtube.com/vi/' + esc(ytId(m.youtube)) + '/hqdefault.jpg" alt="' + esc(m.name) + '" loading="lazy" />';
    return '<span class="mc-initial">' + esc((m.name || "?").slice(0, 2)) + "</span>";
  }

  function renderMc(mood) {
    if (!mcGrid) return;
    mcGrid.innerHTML = "";
    var shown = MCS.filter(function (m) { return !mood || mood === "all" || mcKeywords(m).indexOf(mood) !== -1; });
    if (!shown.length) { mcGrid.innerHTML = '<p class="gallery-empty">등록된 사회자가 없습니다.</p>'; return; }
    shown.forEach(function (m, i) {
      var idx = MCS.indexOf(m);
      var card = document.createElement("article");
      card.className = "mc-card reveal" + ((m.youtube || m.image) ? "" : " no-media");
      card.style.transitionDelay = ((i % 6) * 0.05) + "s";
      card.style.setProperty("--mc-c", mcColor(m, idx));
      var kw = mcKeywords(m).slice(0, 3).map(function (k) { return '<span class="mc-kw">' + esc(k) + "</span>"; }).join("");
      card.innerHTML =
        '<div class="mc-photo">' + mcThumb(m) + (m.youtube ? '<span class="play"></span>' : "") + "</div>" +
        '<div class="mc-info">' +
          '<p class="mc-name">' + esc(C.mcPrefix || "무드바이") + " " + esc(m.name) +
            (m.emoji ? '<span class="mc-emoji">' + esc(m.emoji) + "</span>" : "") + "</p>" +
          '<div class="mc-kws">' + kw + "</div>" +
          (m.strength ? '<p class="mc-strength">' + esc(m.strength) + "</p>" : "") +
        "</div>";
      card.addEventListener("click", function () { openMc(idx); });
      mcGrid.appendChild(card);
    });
    observeReveal();
  }

  /* ---------- 가격표 ---------- */
  if (C.pricing) {
    var pt = $("#pricingTable");
    if (pt && C.pricing.tiers && C.pricing.tiers.length) {
      var head = "<thead><tr><th>등급</th><th>1부</th><th>2부</th></tr></thead>";
      var rows = C.pricing.tiers.map(function (t) {
        return "<tr>" +
          '<th scope="row"><span class="pt-name">' + esc(t.name || "") + "</span>" +
            (t.desc ? '<span class="pt-desc">' + esc(t.desc) + "</span>" : "") + "</th>" +
          "<td>" + esc(t.part1 || "-") + "</td>" +
          "<td>" + esc(t.part2 || "-") + "</td>" +
        "</tr>";
      }).join("");
      pt.innerHTML = head + "<tbody>" + rows + "</tbody>";
    }
    var pn = $("[data-pricing-note]"); if (pn) pn.textContent = C.pricing.note || "";
  }

  /* ---------- Academy (무드랩) ---------- */
  if (C.academy) {
    var ac = C.academy;
    var at = $("[data-academy-title]"); if (at) at.textContent = ac.title || "무드랩 MOOD LAB";
    var asub = $("[data-academy-sub]"); if (asub) asub.textContent = ac.sub || "";
    var abd = $("[data-academy-body]");
    if (abd) abd.innerHTML = lines(ac.body).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    var afit = $("#academyFit"); if (afit) afit.innerHTML = listHtml(ac.fit);

    var pipe = $("#academyPipeline");
    if (pipe) {
      pipe.innerHTML = lines(ac.pipeline).map(function (step, i, arr) {
        return '<span class="pipe-step">' + esc(step) + "</span>" +
          (i < arr.length - 1 ? '<span class="pipe-arrow">&#8250;</span>' : "");
      }).join("");
    }
    cardGrid($("#academyCompetencies"), ac.competencies);

    var crit = $("#academyCriteria");
    if (crit) {
      var html = "";
      if (ac.talent) html += '<p class="criteria-talent"><strong>인재상</strong> ' + esc(ac.talent) + "</p>";
      if (lines(ac.selection).length) html += '<h4 class="criteria-h">선발 기준</h4><ul class="check-list">' + listHtml(ac.selection) + "</ul>";
      crit.innerHTML = html;
    }
    var acta = $("#academyCta");
    if (acta && ac.cta && ac.cta.text) {
      var href = ac.cta.url || C.instagram || "#contact";
      acta.innerHTML = '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(ac.cta.text) + "</a>";
    }
  }

  /* ---------- 진행 프로세스 ---------- */
  var processList = $("#processList");
  if (processList && C.process) {
    processList.innerHTML = C.process.map(function (s, i) {
      return '<div class="process-step reveal" style="transition-delay:' + (Math.min(i, 9) * 0.05) + 's">' +
        '<div class="num">' + (i + 1) + "</div>" +
        '<div><div class="p-title">' + esc(s.title || "") + "</div>" +
        '<div class="p-desc">' + esc(s.desc || "") + "</div></div></div>";
    }).join("");
  }

  /* ---------- Q&A 아코디언 ---------- */
  var faqList = $("#faqList");
  if (faqList && C.faq) {
    C.faq.forEach(function (item, i) {
      var row = document.createElement("div");
      row.className = "faq-item reveal";
      row.style.transitionDelay = (Math.min(i, 6) * 0.05) + "s";
      var ans = esc(item.a || "").replace(/\n/g, "<br />");
      row.innerHTML =
        '<button class="faq-q" type="button">' +
          '<span class="faq-qmark">Q</span><span class="faq-qtext">' + esc(item.q) + "</span>" +
          '<span class="faq-icon"></span>' +
        "</button>" +
        '<div class="faq-a"><div class="faq-a-inner">' + ans + "</div></div>";
      var btn = row.querySelector(".faq-q");
      var panel = row.querySelector(".faq-a");
      btn.addEventListener("click", function () {
        var open = row.classList.contains("open");
        $$(".faq-item.open").forEach(function (r) {
          r.classList.remove("open");
          r.querySelector(".faq-a").style.maxHeight = null;
        });
        if (!open) {
          row.classList.add("open");
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
      faqList.appendChild(row);
    });
  }

  /* ---------- 문의 링크 ---------- */
  function contactLinksHtml(which) {
    var links = [];
    if (which === "applicant") {
      if (C.academy && C.academy.cta && C.academy.cta.url) links.push(C.academy.cta.url);
      if (C.instagram) links.push(C.instagram);
    } else {
      if (C.instagram) links.push(C.instagram);
      if (C.kakao) links.push(C.kakao);
    }
    return links;
  }
  function fillContact(id, label, which) {
    var el = $(id); if (!el) return;
    var urls = [];
    (contactLinksHtml(which)).forEach(function (u) { if (u && urls.indexOf(u) === -1) urls.push(u); });
    el.innerHTML = urls.map(function (u, i) {
      var isInsta = /instagram\.com/.test(u);
      var txt = isInsta ? "인스타그램 DM" : (/pf\.kakao|kakao/.test(u) ? "카카오톡 문의" : "문의하기");
      var cls = i === 0 ? "primary-contact" : "secondary-contact";
      return '<a class="' + cls + '" href="' + esc(u) + '" target="_blank" rel="noopener">' + txt + "</a>";
    }).join("");
  }
  fillContact("#contactCustomer", "고객", "customer");
  fillContact("#contactApplicant", "지원", "applicant");
  if (C.booking && C.booking.note) { var bn = $("#bookingNote"); if (bn) bn.textContent = C.booking.note; }

  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- 라이트박스 (사회자 상세) ---------- */
  var lb = $("#lightbox"), lbStage = $("#lbStage");
  function openMc(index) {
    var m = MCS[index];
    if (!m || !lb) return;
    var kw = mcKeywords(m).map(function (k) { return '<span class="mc-kw">' + esc(k) + "</span>"; }).join("");
    var media = "";
    if (m.youtube) {
      media = '<div class="lb-video"><iframe src="https://www.youtube.com/embed/' + esc(ytId(m.youtube)) +
        '?rel=0" allow="encrypted-media; fullscreen" allowfullscreen></iframe></div>';
    } else if (m.image) {
      media = '<div class="lb-photo"><img src="' + esc(m.image) + '" alt="' + esc(m.name) + '" /></div>';
    }
    lbStage.innerHTML =
      '<div class="mc-detail" style="--mc-c:' + esc(mcColor(m, index)) + '">' +
        media +
        '<div class="mc-detail-body">' +
          '<p class="mc-name">' + esc(C.mcPrefix || "무드바이") + " " + esc(m.name) +
            (m.emoji ? " " + esc(m.emoji) : "") + "</p>" +
          '<div class="mc-kws">' + kw + "</div>" +
          (m.strength ? "<p>" + esc(m.strength) + "</p>" : "") +
          (m.recommend ? '<p class="mc-recommend"><strong>추천 고객</strong> ' + esc(m.recommend) + "</p>" : "") +
          (m.review ? '<p class="mc-review">&ldquo;' + esc(m.review) + "&rdquo;</p>" : "") +
        "</div>" +
      "</div>";
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLb() { if (!lb) return; lb.classList.remove("open"); lbStage.innerHTML = ""; document.body.style.overflow = ""; }
  if (lb) {
    $("#lbClose").addEventListener("click", closeLb);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && lb.classList.contains("open")) closeLb(); });
  }

  /* ---------- 헤더 스크롤 효과 + 히어로 패럴랙스 ---------- */
  var header = $("#header");
  var heroBg = $("[data-hero-bg]");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      header.classList.toggle("scrolled", y > 60);
      if (heroBg && !reduceMotion && y > 0 && y < window.innerHeight) {
        heroBg.style.transform = "scale(1.06) translateY(" + (y * 0.18) + "px)";
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- 모바일 메뉴 ---------- */
  var toggle = $("#navToggle"), nav = $("#nav");
  toggle.addEventListener("click", function () {
    nav.classList.toggle("open"); toggle.classList.toggle("open");
  });
  $$(".nav a").forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("open"); toggle.classList.remove("open"); });
  });

  /* ---------- 메뉴별 섹션 전환 ---------- */
  var panels = $$("[data-panel]");
  var panelIds = panels.map(function (panel) { return panel.id; });
  function showHome(shouldScroll) {
    panels.forEach(function (panel) { panel.classList.remove("active"); panel.hidden = true; });
    document.body.classList.remove("panel-open");
    $$(".nav a").forEach(function (link) { link.classList.remove("active"); });
    if (shouldScroll) {
      window.setTimeout(function () {
        var hero = document.getElementById("hero");
        if (hero) hero.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }, 20);
    }
  }
  function activatePanel(id, shouldScroll) {
    if (panelIds.indexOf(id) === -1) { showHome(shouldScroll); return; }
    panels.forEach(function (panel) {
      var active = panel.id === id;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
    document.body.classList.add("panel-open");
    $$(".nav a").forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + id);
    });
    observeReveal();
    if (shouldScroll) {
      window.setTimeout(function () {
        var target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }, 20);
    }
  }
  $$(".nav a[href^='#']").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href").slice(1);
      if (panelIds.indexOf(id) === -1) return;
      e.preventDefault();
      activatePanel(id, true);
      if (window.history && window.history.pushState) window.history.pushState(null, "", "#" + id);
      else window.location.hash = id;
    });
  });
  $$("a[href='#hero']").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      showHome(true);
      if (window.history && window.history.pushState) window.history.pushState(null, "", "#hero");
      else window.location.hash = "hero";
    });
  });
  window.addEventListener("hashchange", function () {
    activatePanel(window.location.hash.replace("#", ""), true);
  });

  /* ---------- 스크롤 등장 애니메이션 ---------- */
  var io;
  function observeReveal() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach(function (el) { el.classList.add("in"); }); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
    }
    $$(".reveal:not(.in)").forEach(function (el) { io.observe(el); });
  }

  /* ---------- 초기 실행 ---------- */
  var paletteRow = $("#paletteRow");
  if (paletteRow) {
    if (MCS.length) paletteRow.innerHTML = MCS.map(function (m, i) {
      return '<span class="palette-dot" title="' + esc(m.name) + '" style="background:' + esc(mcColor(m, i)) + '"></span>';
    }).join("");
    else paletteRow.style.display = "none";
  }
  buildMcFilters();
  renderMc("all");
  var initialPanel = window.location.hash.replace("#", "");
  if (panelIds.indexOf(initialPanel) !== -1) activatePanel(initialPanel, false);
  else showHome(false);
  observeReveal();
})();
