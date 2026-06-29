/* ============================================================
   정단땅 (JUNG DDANDDAN) · 동작 스크립트
   site-config.js 내용을 화면에 그려주고, 갤러리/메뉴/라이트박스를
   제어합니다. 일반적인 경우 이 파일은 수정할 필요가 없습니다.
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

  /* 여러 줄 텍스트(배열/문자열/객체배열) → 문자열 배열로 정규화 (CMS 출력 호환) */
  function lines(v) {
    if (Array.isArray(v)) return v.map(function (x) {
      return typeof x === "string" ? x : (x && (x.line || x.item || x.feature || x.text)) || "";
    }).filter(function (s) { return s !== ""; });
    if (typeof v === "string") return v.split("\n").filter(function (s) { return s.trim() !== ""; });
    return [];
  }
  /* 포트폴리오 항목 정규화 — 사진/영상/CMS 형식 모두 처리 */
  function normItem(it) {
    if (!it) return { type: "photo", src: "" };
    if (it.youtube || it.id) return { type: "youtube", id: it.youtube || it.id, category: it.category, caption: it.caption, poster: it.poster || it.cover };
    if (it.type === "youtube" || it.type === "video") return it;
    var src = it.src || it.image || "";
    return { type: "photo", src: src, category: it.category, caption: it.caption, poster: it.poster || src };
  }

  function hasMedia(item) {
    return !!(item && ((item.type === "youtube" && item.id) || item.src));
  }

  function categoryLabel(v) {
    return ({ wedding: "결혼식", family: "돌·가족행사", corporate: "기업·기타" })[v] || "Portfolio";
  }

  function normalizeCategory(v) {
    return ({ brightHall: "wedding", darkHall: "wedding", outdoorWedding: "wedding", event: "family", film: "corporate" })[v] || v || "wedding";
  }

  function listHtml(items) {
    return lines(items).map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("");
  }

  function normalizeAlbum(album, i) {
    var rawItems = album.images || album.items || album.photos || [];
    if (!rawItems.length && (album.image || album.src || album.youtube || album.id)) rawItems = [album];
    var items = rawItems.map(normItem).filter(hasMedia);
    var first = items[0] || {};
    var venue = album.venue || album.title || album.name || "";
    var title = venue || album.caption || categoryLabel(album.category || first.category) || ("앨범 " + (i + 1));
    return {
      title: title,
      venue: venue,
      category: normalizeCategory(album.category || first.category),
      description: album.description || album.desc || "",
      cover: album.cover || album.image || thumbOf(first),
      items: items,
    };
  }

  function buildAlbums() {
    var rawAlbums = C.portfolioAlbums || C.albums || [];
    if (rawAlbums.length) return rawAlbums.map(normalizeAlbum).filter(function (album) { return album.items.length; });

    var groups = [];
    var byKey = {};
    (C.portfolio || []).forEach(function (item) {
      var normalized = normItem(item);
      if (!hasMedia(normalized)) return;
      var title = item.album || item.venue || item.caption || categoryLabel(normalized.category);
      var key = (normalized.category || "all") + "|" + title;
      if (!byKey[key]) {
        byKey[key] = {
          title: title,
          venue: item.venue || item.hall || "",
          category: normalizeCategory(normalized.category),
          description: "",
          cover: thumbOf(normalized),
          items: [],
        };
        groups.push(byKey[key]);
      }
      byKey[key].items.push(normalized);
    });
    return groups;
  }

  var ALBUMS = buildAlbums();

  /* ---------- 기본 텍스트/이미지 채우기 ---------- */
  $$("[data-brand]").forEach(function (el) { if (C.brand) el.textContent = C.brand; });

  if (C.hero) {
    var hb = $("[data-hero-bg]");
    if (hb && C.hero.image) hb.style.backgroundImage = "url('" + C.hero.image + "')";
  }

  if (C.about) {
    if (C.about.title) $("[data-about-title]").textContent = C.about.title;
    var ab = $("[data-about-body]");
    if (ab && C.about.body) ab.innerHTML = lines(C.about.body).map(function (p) { return "<p>" + p + "</p>"; }).join("");
  }

  if (C.photographer) {
    var ph = C.photographer;
    var phTitle = $("[data-photographer-title]");
    var phRole = $("[data-photographer-role]");
    var phImg = $("[data-photographer-img]");
    var phBody = $("[data-photographer-body]");
    var phPromise = $("[data-photographer-promise]");
    var phCount = $("[data-photographer-count]");
    if (phTitle) phTitle.textContent = ph.title || ("사회자 " + (ph.name || ""));
    if (phRole) phRole.textContent = ph.role || "결혼식 전문 사회자";
    if (phImg) phImg.src = ph.image || (C.about && C.about.image) || "";
    if (phBody) {
      var phLines = lines(ph.body || ph.philosophy);
      phBody.innerHTML = phLines.map(function (p, i) {
        var isSignature = i === phLines.length - 1 && /사회자\s*정다원/.test(String(p).trim());
        return '<p' + (isSignature ? ' class="photographer-signature"' : "") + ">" + esc(p) + "</p>";
      }).join("");
    }
    if (phPromise) phPromise.textContent = ph.promise || "";
    if (phCount) phCount.textContent = ph.shootCount || ph.count || "100건+";
  }

  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- 항목 종류 판별 ---------- */
  function isVideo(item) { return item && (item.type === "video" || item.type === "youtube"); }
  // 타일(썸네일)에 보여줄 이미지 경로
  function thumbOf(item) {
    if (!item) return "";
    if (item.type === "youtube") return item.poster || ("https://img.youtube.com/vi/" + item.id + "/hqdefault.jpg");
    return item.poster || item.src;
  }

  /* ---------- 포트폴리오 갤러리 ---------- */
  var gallery = $("#gallery");
  var galleryItems = [];
  function renderGallery(filter) {
    if (!gallery || !ALBUMS.length) return;
    gallery.innerHTML = "";
    galleryItems = [];
    ALBUMS.forEach(function (album) {
      if (filter && filter !== "all" && album.category !== filter) return;
      galleryItems.push({ album: album, item: album.items[0] });
    });
    if (!galleryItems.length) {
      gallery.innerHTML = '<p class="gallery-empty">등록된 사진이 없습니다.</p>';
      return;
    }
    galleryItems.forEach(function (entry, index) {
      var item = entry.item;
      var album = entry.album;
      var coverSrc = album.cover || thumbOf(item);
      var fig = document.createElement("div");
      fig.className = "gallery-item reveal" + (isVideo(item) ? " is-video" : "");
      fig.dataset.index = index;
      fig.style.transitionDelay = ((index % 6) * 0.04) + "s";
      var venueLabel = album.venue || categoryLabel(album.category);
      fig.innerHTML =
        '<p class="gallery-venue">' + esc(venueLabel) + "</p>" +
        '<div class="gallery-photo">' +
          '<img src="' + esc(coverSrc) + '" alt="' + esc(venueLabel) + '" loading="lazy" />' +
          (isVideo(item) ? '<span class="play"></span>' : "") +
        "</div>";
      fig.addEventListener("click", function () { openGalleryItem(index); });
      gallery.appendChild(fig);
    });
    observeReveal();
  }

  /* ---------- 필터 버튼 ---------- */
  $$(".filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".filter").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      renderGallery(btn.dataset.filter);
    });
  });

  /* ---------- 가격 카드 ---------- */
  var priceGrid = $("#priceGrid");
  var productGuide = $("#productGuide");
  if (priceGrid && C.products) {
    function productGroups(product) {
      var structured = product.categories || product.optionCategories || product.sections;
      if (Array.isArray(structured) && structured.length) {
        return structured.map(function (group) {
          return {
            title: group.title || group.name || "상품 안내",
            items: lines(group.items || group.options || group.features || group.body),
          };
        }).filter(function (group) { return group.title || group.items.length; });
      }

      var groups = [];
      lines(product.features).forEach(function (raw) {
        var text = String(raw).trim();
        var heading = text.match(/^\[(.+)\]$/);
        if (heading) {
          groups.push({ title: heading[1], items: [] });
        } else if (text) {
          if (!groups.length) groups.push({ title: "상품 안내", items: [] });
          groups[groups.length - 1].items.push(text);
        }
      });
      return groups.filter(function (group) { return group.title || group.items.length; });
    }

    // 상품 1개를 PDF 스타일 표 1장으로 (전체폭 안내 배너 + 카테고리|내용 행)
    function productBlockHtml(product, index) {
      var groups = productGroups(product);
      var introRow = product.intro
        ? '<tr><td class="product-intro" colspan="2">' + esc(product.intro) + "</td></tr>"
        : "";
      var rows = groups.map(function (group) {
        return "<tr>" +
          '<th scope="row">' + esc(group.title || "상품 안내") + "</th>" +
          "<td>" + (group.items.length ? "<ul>" + listHtml(group.items) + "</ul>" : '<span class="product-table-empty">상담 시 안내드립니다.</span>') + "</td>" +
        "</tr>";
      }).join("");
      return '<article class="product-block reveal" id="product-' + index + '">' +
        '<div class="product-block-head">' +
          "<h3>[" + esc(product.name || "") + "]</h3>" +
          '<p class="pb-price">' + esc(product.price || "") + "</p>" +
        "</div>" +
        (groups.length || introRow ? '<div class="product-table-wrap">' +
          '<table class="product-table">' +
            '<colgroup><col class="pt-col-cat" /><col /></colgroup>' +
            "<tbody>" + introRow + rows + "</tbody>" +
          "</table>" +
        "</div>" : '<p class="product-empty">상세 구성은 카카오톡 채널로 문의해 주세요.</p>') +
      "</article>";
    }

    // 선택한 상품 1개만 표로 표시 (한눈에)
    function showProduct(index) {
      if (productGuide) {
        var product = C.products[index] || C.products[0];
        productGuide.innerHTML = product ? productBlockHtml(product, index) : "";
      }
      $$(".product-filter", priceGrid).forEach(function (b) {
        b.classList.toggle("active", Number(b.dataset.productIndex) === index);
      });
      observeReveal();
    }

    // 포트폴리오 필터처럼 심플한 [베이직] [프리미엄] 선택 버튼
    priceGrid.className = "filters product-filters reveal";
    priceGrid.innerHTML = C.products.map(function (p, i) {
      return '<button type="button" class="filter product-filter' + (i === 0 ? " active" : "") + '" data-product-index="' + i + '">' +
        esc(p.label || p.name || ("상품 " + (i + 1))) +
      "</button>";
    }).join("");
    $$(".product-filter", priceGrid).forEach(function (btn) {
      btn.addEventListener("click", function () {
        showProduct(Number(btn.dataset.productIndex || 0));
      });
    });

    showProduct(0);
  }

  /* ---------- 문의 링크 ---------- */
  var cl = $("#contactLinks");
  if (cl) {
    var links = [];
    if (C.instagram) links.push('<a class="primary-contact" href="' + esc(C.instagram) + '" target="_blank" rel="noopener">인스타그램 DM으로 예약 문의하기</a>');
    if (C.kakao) links.push('<a class="primary-contact" href="' + esc(C.kakao) + '" target="_blank" rel="noopener">카카오톡으로 문의하기</a>');
    cl.innerHTML = links.join("");
  }

  var trustGrid = $("#trustGrid");
  if (trustGrid && C.trustBadges) {
    trustGrid.innerHTML = C.trustBadges.map(function (b, i) {
      return '<article class="trust-card reveal" style="transition-delay:' + (Math.min(i, 5) * 0.06) + 's">' +
        '<div class="trust-icon">' + esc(b.icon || String(i + 1).padStart(2, "0")) + "</div>" +
        "<h3>" + esc(b.title || "") + "</h3>" +
        "<p>" + esc(b.text || b.desc || "") + "</p>" +
      "</article>";
    }).join("");
  }

  if (C.availability) {
    var av = C.availability;
    var avTitle = $("[data-availability-title]");
    var avStatus = $("[data-availability-status]");
    var avNote = $("[data-availability-note]");
    var avList = $("#availabilityList");
    if (avTitle && av.title) avTitle.textContent = av.title;
    if (avStatus && av.status) avStatus.textContent = av.status;
    if (avNote) avNote.textContent = av.note || "";
    if (avList) avList.innerHTML = listHtml(av.items);
  }

  if (C.partners) {
    var partners = C.partners;
    var pt = $("[data-partners-title]");
    var pl = $("[data-partners-lead]");
    var pgd = $("#partnerGrid");
    var pa = $("#partnerAction");
    if (pt && partners.title) pt.textContent = partners.title;
    if (pl) pl.textContent = partners.lead || "";
    if (pgd && partners.items) {
      pgd.innerHTML = partners.items.map(function (p, i) {
        var logo = p.logo ? '<img src="' + esc(p.logo) + '" alt="' + esc(p.name || "partner") + '" />' : '<span>' + esc(p.initial || (p.name || "?").slice(0, 2)) + "</span>";
        return '<article class="partner-card" style="transition-delay:' + (Math.min(i, 5) * 0.05) + 's">' +
          '<div class="partner-logo">' + logo + "</div>" +
          "<h3>" + esc(p.name || "") + "</h3>" +
          "<p>" + esc(p.category || p.desc || "") + "</p>" +
        "</article>";
      }).join("");
    }
    if (pa && partners.ctaText) {
      var href = partners.ctaUrl || C.instagram || C.kakao || "#contact";
      pa.innerHTML = '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(partners.ctaText) + "</a>";
    }
  }

  /* ---------- Q&A 아코디언 ---------- */
  var faqList = $("#faqList");
  if (faqList && C.faq) {
    C.faq.forEach(function (item, i) {
      var row = document.createElement("div");
      row.className = "faq-item reveal";
      row.style.transitionDelay = (Math.min(i, 6) * 0.05) + "s";
      var ans = (item.a || "").replace(/\n/g, "<br />");
      row.innerHTML =
        '<button class="faq-q" type="button">' +
          '<span class="faq-qmark">Q</span><span class="faq-qtext">' + item.q + "</span>" +
          '<span class="faq-icon"></span>' +
        "</button>" +
        '<div class="faq-a"><div class="faq-a-inner">' + ans + "</div></div>";
      var btn = row.querySelector(".faq-q");
      var panel = row.querySelector(".faq-a");
      btn.addEventListener("click", function () {
        var open = row.classList.contains("open");
        // 하나만 열리도록(아코디언) — 여러 개 동시에 열고 싶으면 아래 forEach 줄을 지우세요.
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

  /* ---------- 후기 ---------- */
  /* ---------- 예약 절차 ---------- */
  var processList = $("#processList");
  if (processList && C.process) {
    processList.innerHTML = C.process.map(function (s, i) {
      return '<div class="process-step reveal" style="transition-delay:' + (i * 0.08) + 's">' +
        '<div class="num">' + (i + 1) + "</div>" +
        '<div><div class="p-title">' + (s.title || "") + "</div>" +
        '<div class="p-desc">' + (s.desc || "") + "</div></div></div>";
    }).join("");
  }

  /* ---------- 예약 문의 안내 ---------- */
  if (C.booking && C.booking.note) {
    var bn = $("#bookingNote");
    if (bn) bn.textContent = C.booking.note;
  }

  /* ---------- 라이트박스 (사진 + 영상) ---------- */
  var lb = $("#lightbox"), lbStage = $("#lbStage");
  var activeItems = [];
  var activeAlbumTitle = "";
  var pos = 0;
  function openGalleryItem(itemIndex) {
    var entry = galleryItems[itemIndex];
    if (!entry) return;
    var album = entry.album;
    activeItems = album.items.map(function (source) {
      var item = {};
      Object.keys(source).forEach(function (key) { item[key] = source[key]; });
      item._albumTitle = album.title;
      item._albumCategory = album.category;
      return item;
    });
    activeAlbumTitle = album.venue || album.title;
    pos = album.items.indexOf(entry.item);
    if (pos < 0) pos = 0;
    showScrollLb();
    lb.classList.add("open", "scroll-mode");
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(function () {
      var target = lbStage.querySelector('[data-scroll-index="' + pos + '"]');
      if (target) target.scrollIntoView({ block: "start" });
    });
  }

  function makeScrollMedia(item) {
    var el;
    if (item.type === "youtube") {
      el = document.createElement("iframe");
      el.className = "lb-scroll-media";
      el.src = "https://www.youtube.com/embed/" + item.id + "?rel=0";
      el.allow = "encrypted-media; fullscreen";
      el.setAttribute("allowfullscreen", "");
    } else if (item.type === "video") {
      el = document.createElement("video");
      el.className = "lb-scroll-media";
      el.src = item.src;
      if (item.poster) el.poster = item.poster;
      el.controls = true;
      el.playsInline = true;
    } else {
      el = document.createElement("img");
      el.className = "lb-scroll-media";
      el.src = item.src;
      el.alt = item.caption || activeAlbumTitle || "portfolio";
      el.loading = "lazy";
    }
    return el;
  }

  function showScrollLb() {
    lbStage.innerHTML = "";   // 이전 내용(특히 영상) 정리 → 소리/재생 중단
    if (!activeItems.length) return;
    var head = document.createElement("div");
    head.className = "lb-scroll-head";
    head.innerHTML =
      "<strong>" + esc(activeAlbumTitle || "Portfolio") + "</strong>" +
      "<span>아래로 스크롤해서 보기</span>";
    lbStage.appendChild(head);

    activeItems.forEach(function (item, index) {
      var row = document.createElement("article");
      var category = item.category || item._albumCategory;
      row.className = "lb-scroll-item";
      row.dataset.scrollIndex = index;
      row.appendChild(makeScrollMedia(item));
      var capText = item.caption || "";
      if (capText) {
        var caption = document.createElement("p");
        caption.className = "lb-scroll-caption";
        caption.textContent = capText;
        row.appendChild(caption);
      }
      lbStage.appendChild(row);
    });
  }
  function closeLb() { lb.classList.remove("open", "scroll-mode"); lbStage.innerHTML = ""; activeItems = []; document.body.style.overflow = ""; }

  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", function () {});
  $("#lbNext").addEventListener("click", function () {});
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
  });

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
      // y>0 일 때만 적용 → 처음 로드 시 CSS 줌인 인트로는 그대로 살림
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
    panels.forEach(function (panel) {
      panel.classList.remove("active");
      panel.hidden = true;
    });
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
    if (panelIds.indexOf(id) === -1) {
      showHome(shouldScroll);
      return;
    }
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
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", "#" + id);
      } else {
        window.location.hash = id;
      }
    });
  });

  $$("a[href='#hero']").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      showHome(true);
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", "#hero");
      } else {
        window.location.hash = "hero";
      }
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
  renderGallery("wedding");
  var initialPanel = window.location.hash.replace("#", "");
  if (panelIds.indexOf(initialPanel) !== -1) {
    activatePanel(initialPanel, false);
  } else {
    showHome(false);
  }
  observeReveal();
})();
