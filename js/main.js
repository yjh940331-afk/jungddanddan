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
  function titleHtml(v) {
    return esc(v).replace(/(하나의 큰)\s+(팔레트입니다\.)/, "$1<br>$2");
  }
  function ytId(v) {
    if (!v) return "";
    var s = String(v).trim();
    var m = s.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{6,})/);
    return m ? m[1] : s;
  }
  function absUrl(v) {
    if (!v) return "";
    try { return new URL(v, window.location.origin).href; }
    catch (e) { return v; }
  }
  function setMeta(selector, content) {
    if (!content) return;
    var el = $(selector);
    if (el) el.setAttribute("content", content);
  }

  /* 무드바이 팔레트(폴백) — 사회자에 색이 지정되지 않으면 순서대로 사용 */
  var PALETTE = ["#F08A3C", "#6FA86B", "#E58BB0", "#4FA3C7", "#F2C24B", "#9B7EDE", "#D9534F", "#C8A98C", "#5BB9A6", "#E2725B"];
  function mcColor(m, i) { return (m && m.color) || PALETTE[i % PALETTE.length]; }

  /* ---------- 브랜드명 ---------- */
  $$("[data-brand]").forEach(function (el) { if (C.brand) el.textContent = C.brand; });
  if (C.company) { var fc = $("[data-footer-company]"); if (fc) fc.textContent = C.company; }
  if (C.seo) {
    if (C.seo.title) {
      document.title = C.seo.title;
      setMeta("meta[property='og:title']", C.seo.title);
    }
    if (C.seo.description) {
      setMeta("meta[name='description']", C.seo.description);
      setMeta("meta[property='og:description']", C.seo.description);
    }
    if (C.seo.image) {
      setMeta("meta[property='og:image']", absUrl(C.seo.image));
      setMeta("meta[name='twitter:image']", absUrl(C.seo.image));
    }
  }

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
      if (words.length > 1 && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
        var switchingWord = false;
        var wordFallbackTimer = null;
        var wordHoldMs = 4600;
        var wordLeaveMs = 760;
        var wordSettleMs = 640;
        var swapHeroWord = function () {
          if (switchingWord) return;
          switchingWord = true;
          hw.classList.add("is-leaving");

          var finishLeave = function () {
            hw.removeEventListener("transitionend", onLeave);
            if (wordFallbackTimer) window.clearTimeout(wordFallbackTimer);
            wordFallbackTimer = null;
            wi = (wi + 1) % words.length;
            hw.textContent = words[wi];
            hw.classList.remove("is-leaving");
            hw.classList.add("is-entering");
            window.requestAnimationFrame(function () {
              window.requestAnimationFrame(function () {
                hw.classList.remove("is-entering");
                window.setTimeout(function () {
                  switchingWord = false;
                }, wordSettleMs);
              });
            });
          };

          var onLeave = function (e) {
            if (e.target !== hw || e.propertyName !== "opacity") return;
            finishLeave();
          };
          hw.addEventListener("transitionend", onLeave);
          wordFallbackTimer = window.setTimeout(finishLeave, wordLeaveMs + 120);
        };
        window.setInterval(function () {
          if (document.hidden) return;
          swapHeroWord();
        }, wordHoldMs);
      }
    }
    var moodStage = $("#heroMoodStage");
    if (moodStage && words.length) {
      var stageHidden = window.getComputedStyle && window.getComputedStyle(moodStage).display === "none";
      var noMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!stageHidden && noMotion) {
        moodStage.innerHTML = '<span class="floating-mood static" style="--c:' + esc(PALETTE[0]) + '">' + esc(words[0]) + "</span>";
      } else if (!stageHidden) {
        var mi = 0;
        var spawnMood = function () {
          var word = words[mi % words.length];
          var node = document.createElement("span");
          node.className = "floating-mood";
          node.textContent = word;
          node.style.setProperty("--c", PALETTE[mi % PALETTE.length]);
          node.style.setProperty("--x", (18 + ((mi * 23) % 58)) + "%");
          node.style.setProperty("--y", (18 + ((mi * 31) % 56)) + "%");
          node.style.setProperty("--r", ((mi % 5) - 2) + "deg");
          moodStage.appendChild(node);
          mi += 1;
          window.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 5600);
        };
        spawnMood();
        window.setInterval(spawnMood, 1450);
      }
    }
  }

  /* ---------- 홈 에디토리얼 ---------- */
  if (C.home) {
    var ht = $("[data-home-title]"); if (ht && C.home.title) ht.textContent = C.home.title;
    var he = $("[data-home-eyebrow]"); if (he && C.home.eyebrow) he.textContent = C.home.eyebrow;
    var hbdy = $("[data-home-body]"); if (hbdy && C.home.body) hbdy.textContent = C.home.body;
    if (C.home.palette) {
      var palette = C.home.palette;
      var pet = $("[data-palette-eyebrow]"); if (pet && palette.eyebrow) pet.textContent = palette.eyebrow;
      var ptt = $("[data-palette-title]"); if (ptt && palette.title) ptt.innerHTML = titleHtml(palette.title);
      var pbt = $("[data-palette-body]"); if (pbt && palette.body) pbt.textContent = palette.body;
      var pnt = $("[data-palette-note]"); if (pnt && palette.note) pnt.textContent = palette.note;
      var pim = $("[data-palette-image]");
      if (pim && palette.image) pim.src = palette.image;
    }

    var hs = $("#homeStats");
    if (hs && C.home.stats && C.home.stats.length) {
      hs.innerHTML = C.home.stats.map(function (s) {
        var n = String(s.number || "").replace(/[^\d.]/g, "");
        return '<div class="home-stat reveal">' +
          '<div class="stat-value"><strong class="count-up" data-count="' + esc(n || "0") + '">' + esc(s.number || "0") + "</strong>" +
          '<span class="stat-suffix">' + esc(s.suffix || "") + "</span></div>" +
          '<p>' + esc(s.label || "") + "</p>" +
        "</div>";
      }).join("");
    }

    var hg = $("#homeGallery");
    if (hg && C.home.gallery && C.home.gallery.length) {
      hg.innerHTML = C.home.gallery.map(function (g, i) {
        return '<article class="editorial-card reveal" style="transition-delay:' + (i * 0.08) + 's">' +
          (g.image ? '<img src="' + esc(g.image) + '" alt="' + esc(g.title || C.brand || "MOOD BY") + '" loading="lazy" />' : "") +
          '<div class="editorial-card-copy">' +
            (g.label ? '<span>' + esc(g.label) + "</span>" : "") +
            '<strong>' + esc(g.title || "") + "</strong>" +
            (g.text ? '<p>' + esc(g.text) + "</p>" : "") +
          "</div>" +
        "</article>";
      }).join("");
    }

    var mq = $("#moodMarquee");
    var moodWords = lines(C.home.marquee);
    if (mq && moodWords.length) {
      var repeated = moodWords.concat(moodWords).concat(moodWords);
      mq.innerHTML = repeated.map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("");
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
    var cg = $(".ceo-grid");
    var ct = $("[data-ceo-title]"); if (ct) ct.textContent = ceo.title || "대표 소개";
    var cr = $("[data-ceo-role]"); if (cr) cr.textContent = ceo.role || "";
    var ci = $("[data-ceo-img]");
    if (ci) {
      if (ceo.image) ci.src = ceo.image;
      else {
        var cp = ci.closest(".ceo-profile");
        if (cp) cp.style.display = "none";
        if (cg) cg.classList.add("no-photo");
      }
    }
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
  var portfolioGrid = $("#portfolioGrid");

  function mcKeywords(m) { return lines(m.keywords); }
  function mcPortfolio(m) {
    var items = [];
    if (m && m.youtube) {
      items.push({
        type: "youtube",
        title: "대표 진행 영상",
        youtube: m.youtube,
        text: m.strength || ""
      });
    }
    if (m && Array.isArray(m.portfolio)) {
      m.portfolio.forEach(function (item) {
        if (!item) return;
        if (item.title || item.image || item.youtube || item.url) items.push(item);
      });
    }
    return items;
  }
  function portfolioKind(item) {
    var url = String((item && item.url) || "");
    if (item && item.youtube) return "youtube";
    if (/instagram\.com/.test(url)) return "instagram";
    if (item && item.image && !url) return "photo";
    return (item && item.type) || "link";
  }
  function portfolioHref(item) {
    if (!item) return "";
    if (item.url) return item.url;
    if (item.youtube) return "https://www.youtube.com/watch?v=" + ytId(item.youtube);
    return "";
  }
  function portfolioCover(item, m) {
    if (item && item.image) return item.image;
    if (item && item.youtube) return "https://img.youtube.com/vi/" + ytId(item.youtube) + "/hqdefault.jpg";
    return (m && m.image) || "";
  }
  function portfolioCard(item, m, i) {
    var kind = portfolioKind(item);
    var href = portfolioHref(item);
    var cover = portfolioCover(item, m);
    var label = kind === "youtube" ? "YouTube" : (kind === "instagram" ? "Instagram" : (kind === "photo" ? "Photo" : "Link"));
    var title = item.title || (kind === "instagram" ? "인스타그램 포트폴리오" : "포트폴리오");
    var meta = item.meta || item.venue || item.date || "";
    var text = item.text || item.caption || "";
    var inner =
      '<div class="mc-portfolio-thumb">' +
        (cover ? '<img src="' + esc(cover) + '" alt="' + esc(title) + '" loading="lazy" />' : '<span>' + esc(label) + "</span>") +
        (kind === "youtube" || kind === "instagram" ? '<em class="mc-portfolio-play"></em>' : "") +
      "</div>" +
      '<div class="mc-portfolio-copy">' +
        '<span>' + esc(label) + "</span>" +
        "<strong>" + esc(title) + "</strong>" +
        (meta ? "<small>" + esc(meta) + "</small>" : "") +
        (text ? "<p>" + esc(text) + "</p>" : "") +
      "</div>";
    if (href) {
      return '<a class="mc-portfolio-item" style="--motion-i:' + (i % 8) + '" href="' + esc(href) + '" target="_blank" rel="noopener">' + inner + "</a>";
    }
    return '<div class="mc-portfolio-item" style="--motion-i:' + (i % 8) + '">' + inner + "</div>";
  }

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
    var firstPortfolio = mcPortfolio(m)[0];
    if (m.image) return '<img src="' + esc(m.image) + '" alt="' + esc(m.name) + '" loading="lazy" />';
    if (m.youtube) return '<img src="https://img.youtube.com/vi/' + esc(ytId(m.youtube)) + '/hqdefault.jpg" alt="' + esc(m.name) + '" loading="lazy" />';
    if (firstPortfolio && portfolioCover(firstPortfolio, m)) return '<img src="' + esc(portfolioCover(firstPortfolio, m)) + '" alt="' + esc(m.name) + '" loading="lazy" />';
    return '<span class="mc-initial">' +
      (m.emoji ? '<em>' + esc(m.emoji) + "</em>" : "") +
      '<strong>' + esc((m.name || "?").slice(0, 2)) + "</strong>" +
    "</span>";
  }

  function renderMc(mood) {
    if (!mcGrid) return;
    mcGrid.innerHTML = "";
    var shown = MCS.filter(function (m) { return !mood || mood === "all" || mcKeywords(m).indexOf(mood) !== -1; });
    if (!shown.length) { mcGrid.innerHTML = '<p class="gallery-empty">등록된 사회자가 없습니다.</p>'; return; }
    shown.forEach(function (m, i) {
      var idx = MCS.indexOf(m);
      var portfolio = mcPortfolio(m);
      var card = document.createElement("article");
      card.className = "mc-card reveal" + ((m.youtube || m.image || portfolio.length) ? "" : " no-media") + (portfolio.length ? " has-portfolio" : "");
      card.style.transitionDelay = ((i % 6) * 0.05) + "s";
      card.style.setProperty("--mc-c", mcColor(m, idx));
      var moodKeys = mcKeywords(m);
      var kw = moodKeys.slice(0, 3).map(function (k) { return '<span class="mc-kw">' + esc(k) + "</span>"; }).join("");
      var tone = moodKeys.slice(0, 2).join(" · ");
      card.innerHTML =
        '<div class="mc-photo">' + mcThumb(m) + (m.youtube ? '<span class="play"></span>' : "") +
          (portfolio.length ? '<span class="mc-portfolio-pill">기록 ' + portfolio.length + "</span>" : "") +
        "</div>" +
        '<div class="mc-info">' +
          (tone ? '<p class="mc-tone">' + esc(tone) + "</p>" : "") +
          '<p class="mc-name">' + esc(C.mcPrefix || "무드바이") + " " + esc(m.name) +
            (m.emoji ? '<span class="mc-emoji">' + esc(m.emoji) + "</span>" : "") + "</p>" +
          '<div class="mc-kws">' + kw + "</div>" +
          (m.strength ? '<p class="mc-strength">' + esc(m.strength) + "</p>" : "") +
        "</div>";
      card.addEventListener("click", function () { openMc(idx); });
      mcGrid.appendChild(card);
    });
    observeReveal();
    enhanceTilt(mcGrid);
  }

  function renderPortfolioPanel() {
    var copy = C.portfolioSection || {};
    var titleEl = $("[data-portfolio-title]");
    var leadEl = $("[data-portfolio-lead]");
    if (titleEl) titleEl.textContent = copy.title || "MC별 포트폴리오";
    if (leadEl) leadEl.textContent = copy.lead || "실제 예식 진행 영상과 현장 기록을 사회자별로 모아볼 수 있습니다.";
    if (!portfolioGrid) return;

    var entries = [];
    MCS.forEach(function (m, mcIndex) {
      var items = mcPortfolio(m);
      items.forEach(function (item, itemIndex) {
        entries.push({ m: m, mcIndex: mcIndex, item: item, itemIndex: itemIndex, total: items.length });
      });
    });

    if (!entries.length) {
      portfolioGrid.className = "portfolio-board";
      portfolioGrid.innerHTML = '<p class="portfolio-empty reveal">아직 등록된 포트폴리오가 없습니다. 관리자 페이지에서 MC별 영상과 사진을 추가할 수 있습니다.</p>';
      return;
    }

    portfolioGrid.className = "portfolio-board" + (entries.length === 1 ? " is-single" : "");
    portfolioGrid.innerHTML = entries.map(function (entry, i) {
      var m = entry.m;
      var item = entry.item || {};
      var kind = portfolioKind(item);
      var href = portfolioHref(item);
      var cover = portfolioCover(item, m);
      var label = kind === "youtube" ? "YouTube" : (kind === "instagram" ? "Instagram" : (kind === "photo" ? "Photo" : "Link"));
      var keys = mcKeywords(m).slice(0, 2).join(" · ");
      var title = item.title || (kind === "instagram" ? "인스타그램 진행 기록" : "진행 포트폴리오");
      var meta = item.meta || item.venue || item.date || label;
      var text = item.text || item.caption || m.strength || "";
      var mediaInner =
        (cover ? '<img src="' + esc(cover) + '" alt="' + esc(title) + '" loading="lazy" />' : '<span>' + esc(label) + "</span>") +
        (kind === "youtube" || kind === "instagram" ? '<em class="portfolio-play"></em>' : "");
      var media = href
        ? '<a class="portfolio-media" href="' + esc(href) + '" target="_blank" rel="noopener">' + mediaInner + "</a>"
        : '<button class="portfolio-media portfolio-media-button" type="button" data-mc="' + entry.mcIndex + '">' + mediaInner + "</button>";
      return '<article class="portfolio-card reveal" style="--mc-c:' + esc(mcColor(m, entry.mcIndex)) + '; --motion-i:' + (i % 12) + '">' +
          '<div class="portfolio-card-head">' +
            '<span class="portfolio-kind">' + esc(label) + "</span>" +
            '<span class="portfolio-count">' + (entry.itemIndex + 1) + " / " + entry.total + "</span>" +
          "</div>" +
          media +
          '<div class="portfolio-copy">' +
            '<p class="portfolio-mc">' + esc(C.mcPrefix || "무드바이") + " " + esc(m.name || "") + (m.emoji ? " " + esc(m.emoji) : "") + "</p>" +
            "<h3>" + esc(title) + "</h3>" +
            (keys ? '<p class="portfolio-tone">' + esc(keys) + "</p>" : "") +
            (meta ? '<p class="portfolio-meta">' + esc(meta) + "</p>" : "") +
            (text ? "<p>" + esc(text) + "</p>" : "") +
            '<button class="portfolio-profile" type="button" data-mc="' + entry.mcIndex + '">사회자 상세 보기</button>' +
          "</div>" +
        "</article>";
    }).join("");

    $$(".portfolio-profile, .portfolio-media-button", portfolioGrid).forEach(function (btn) {
      btn.addEventListener("click", function () { openMc(parseInt(btn.dataset.mc, 10)); });
    });
    observeReveal();
    enhanceTilt(portfolioGrid);
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
    var portfolio = mcPortfolio(m);
    var featured = portfolio[0];
    var media = "";
    if (m.youtube) {
      media = '<div class="lb-video"><iframe src="https://www.youtube.com/embed/' + esc(ytId(m.youtube)) +
        '?rel=0" allow="encrypted-media; fullscreen" allowfullscreen></iframe></div>';
    } else if (m.image) {
      media = '<div class="lb-photo"><img src="' + esc(m.image) + '" alt="' + esc(m.name) + '" /></div>';
    } else if (featured && featured.youtube) {
      media = '<div class="lb-video"><iframe src="https://www.youtube.com/embed/' + esc(ytId(featured.youtube)) +
        '?rel=0" allow="encrypted-media; fullscreen" allowfullscreen></iframe></div>';
    } else if (featured && portfolioCover(featured, m)) {
      media = '<div class="lb-photo"><img src="' + esc(portfolioCover(featured, m)) + '" alt="' + esc(featured.title || m.name) + '" /></div>';
    }
    var portfolioHtml = portfolio.length ? (
      '<div class="mc-portfolio">' +
        '<div class="mc-portfolio-head"><span>Portfolio</span><strong>진행 영상과 현장 기록</strong></div>' +
        '<div class="mc-portfolio-grid">' + portfolio.map(function (item, i) { return portfolioCard(item, m, i); }).join("") + "</div>" +
      "</div>"
    ) : "";
    lbStage.innerHTML =
      '<div class="mc-detail' + (media ? "" : " no-media") + (portfolio.length ? " has-portfolio" : "") + '" style="--mc-c:' + esc(mcColor(m, index)) + '">' +
        media +
        '<div class="mc-detail-body">' +
          '<p class="mc-name">' + esc(C.mcPrefix || "무드바이") + " " + esc(m.name) +
            (m.emoji ? " " + esc(m.emoji) : "") + "</p>" +
          '<div class="mc-kws">' + kw + "</div>" +
          (m.strength ? "<p>" + esc(m.strength) + "</p>" : "") +
          (m.recommend ? '<p class="mc-recommend"><strong>추천 고객</strong> ' + esc(m.recommend) + "</p>" : "") +
          (m.review ? '<p class="mc-review">&ldquo;' + esc(m.review) + "&rdquo;</p>" : "") +
          portfolioHtml +
        "</div>" +
      "</div>";
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove("open");
    lb.classList.remove("scroll-mode");
    if (lbStage) lbStage.innerHTML = "";
    document.body.style.overflow = "";
  }
  if (lb) {
    var lbClose = $("#lbClose");
    if (lbClose) {
      lbClose.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
      lbClose.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeLb();
      });
    }
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && lb.classList.contains("open")) closeLb(); });
  }

  /* ---------- 헤더 스크롤 효과 + 히어로 패럴랙스 ---------- */
  var header = $("#header");
  var heroBg = $("[data-hero-bg]");
  var progress = $("#scrollProgress");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var scrollScenes = [];
  var lastScrollY = window.scrollY || 0;
  var ticking = false;
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function updateScrollScenes(y) {
    if (!scrollScenes.length || reduceMotion) return;
    var vh = window.innerHeight || document.documentElement.clientHeight || 1;
    var max = Math.max(1, document.documentElement.scrollHeight - vh);
    document.documentElement.style.setProperty("--page-progress", clamp(y / max, 0, 1).toFixed(4));
    document.body.classList.toggle("scrolling-down", y > lastScrollY + 2);
    document.body.classList.toggle("scrolling-up", y < lastScrollY - 2);
    lastScrollY = y;
    scrollScenes.forEach(function (scene) {
      var r = scene.getBoundingClientRect();
      var p = clamp((vh - r.top) / (vh + Math.max(1, r.height)), 0, 1);
      var focus = clamp(1 - Math.abs(p - 0.5) * 2.15, 0, 1);
      scene.style.setProperty("--scene-progress", p.toFixed(4));
      scene.style.setProperty("--scene-focus", focus.toFixed(4));
      scene.style.setProperty("--scene-shift", ((0.5 - p) * 42).toFixed(2) + "px");
      scene.style.setProperty("--scene-shift-soft", ((0.5 - p) * 22).toFixed(2) + "px");
      scene.style.setProperty("--scene-shift-reverse", ((p - 0.5) * 22).toFixed(2) + "px");
      scene.style.setProperty("--scene-brightness", (0.94 + focus * 0.08).toFixed(3));
      scene.style.setProperty("--scene-scale", (1.015 + focus * 0.025).toFixed(4));
      scene.style.setProperty("--scene-clip", ((1 - focus) * 9).toFixed(2) + "%");
      scene.classList.toggle("scene-active", focus > 0.16);
    });
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      header.classList.toggle("scrolled", y > 60);
      if (progress) {
        var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        progress.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
      }
      if (heroBg && !reduceMotion && y > 0 && y < window.innerHeight) {
        heroBg.style.transform = "scale(1.06) translateY(" + (y * 0.18) + "px)";
      }
      updateScrollScenes(y);
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
  $$("[data-panel-link]").forEach(function (link) {
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

  function animateCount(el) {
    if (!el || el.dataset.done) return;
    el.dataset.done = "1";
    var target = parseFloat(el.dataset.count || "0");
    if (!isFinite(target) || target <= 0 || reduceMotion) {
      el.textContent = el.dataset.count || el.textContent;
      return;
    }
    var start = performance.now();
    var duration = 1150;
    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString("ko-KR");
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function observeCounters() {
    var counters = $$(".count-up:not([data-watched])");
    if (!counters.length) return;
    if (!("IntersectionObserver" in window)) { counters.forEach(animateCount); return; }
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          animateCount(en.target);
          cio.unobserve(en.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { el.dataset.watched = "1"; cio.observe(el); });
  }

  function enhanceTilt(root) {
    if (reduceMotion) return;
    $$(".preview-card, .editorial-card, .trust-card, .mc-card, .portfolio-card, .contact-card", root || document).forEach(function (el) {
      if (el.dataset.tiltBound) return;
      el.dataset.tiltBound = "1";
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--tilt-x", (y * -5).toFixed(2) + "deg");
        el.style.setProperty("--tilt-y", (x * 5).toFixed(2) + "deg");
        el.style.setProperty("--spot-x", ((x + 0.5) * 100).toFixed(1) + "%");
        el.style.setProperty("--spot-y", ((y + 0.5) * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () {
        el.style.removeProperty("--tilt-x");
        el.style.removeProperty("--tilt-y");
        el.style.removeProperty("--spot-x");
        el.style.removeProperty("--spot-y");
      });
    });
  }

  function initDynamicMotion() {
    observeCounters();
    enhanceTilt();
    initScrollScenes();
    var hero = $("#hero");
    if (hero && !reduceMotion) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    }
  }

  function initScrollScenes() {
    if (reduceMotion) return;
    scrollScenes = $$(".hero, .mood-palette-section, .home-editorial, .mood-marquee, .home-preview, .content-panel");
    if (!scrollScenes.length) return;
    document.documentElement.classList.add("motion-ready");
    scrollScenes.forEach(function (scene, i) {
      scene.classList.add("scroll-scene");
      scene.style.setProperty("--scene-i", i);
    });
    $$(".palette-signature, .home-stat, .editorial-card, .preview-card, .trust-card, .process-step, .mc-card, .portfolio-card, .contact-card").forEach(function (el, i) {
      el.style.setProperty("--motion-i", Math.min(i % 12, 11));
    });
    updateScrollScenes(window.scrollY || 0);
    window.addEventListener("resize", function () { updateScrollScenes(window.scrollY || 0); }, { passive: true });
  }

  /* ---------- 초기 실행 ---------- */
  var paletteRow = $("#paletteRow");
  if (paletteRow) {
    if (MCS.length) paletteRow.innerHTML = MCS.map(function (m, i) {
      return '<span class="palette-dot" title="' + esc(m.name) + '" style="background:' + esc(mcColor(m, i)) + '"></span>';
    }).join("");
    else paletteRow.style.display = "none";
  }
  var paletteSignatures = $("#paletteSignatures");
  if (paletteSignatures) {
    paletteSignatures.innerHTML = MCS.slice(0, 10).map(function (m, i) {
      var keys = mcKeywords(m).slice(0, 2).join(" · ");
      return '<button class="palette-signature" type="button" style="--mc-c:' + esc(mcColor(m, i)) + '" data-mood="' + esc(keys) + '">' +
        '<span>' + esc(m.emoji || "") + "</span>" +
        '<strong>' + esc(m.name) + "</strong>" +
        (keys ? '<em>' + esc(keys) + "</em>" : "") +
      "</button>";
    }).join("");
    $$(".palette-signature", paletteSignatures).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mood = (btn.dataset.mood || "").split(" · ")[0] || "all";
        activatePanel("mc", true);
        window.setTimeout(function () {
          var match = $$(".filter", mcFilters).filter(function (el) { return el.dataset.mood === mood; })[0];
          if (match) match.click();
        }, 120);
      });
    });
  }
  var paletteOrbit = $("#paletteOrbit");
  if (paletteOrbit && MCS.length) {
    paletteOrbit.innerHTML = "";
    MCS.slice(0, 10).forEach(function (m, i, arr) {
      var dot = document.createElement("span");
      var angle = (-90 + (360 / arr.length) * i) * Math.PI / 180;
      dot.style.background = mcColor(m, i);
      dot.style.left = (50 + Math.cos(angle) * 43).toFixed(2) + "%";
      dot.style.top = (50 + Math.sin(angle) * 43).toFixed(2) + "%";
      dot.title = m.name;
      paletteOrbit.appendChild(dot);
    });
  }
  buildMcFilters();
  renderMc("all");
  renderPortfolioPanel();
  var initialPanel = window.location.hash.replace("#", "");
  if (panelIds.indexOf(initialPanel) !== -1) activatePanel(initialPanel, true);
  else showHome(false);
  observeReveal();
  initDynamicMotion();
})();
