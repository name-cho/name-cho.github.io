(function () {
  "use strict";

  var D = window.SITE_DATA || {};
  var LS_THEME = "rawumi.theme";
  var LS_LANG = "rawumi.lang";
  var GH_CACHE_KEY = "rawumi.ghstats";
  var GH_TTL = 60 * 60 * 1000;
  var PAGE_LIMIT = 6;

  var state = {
    theme: localStorage.getItem(LS_THEME) || "auto",
    lang: localStorage.getItem(LS_LANG) || "en",
    expanded: false
  };

  var SKIP_REPOS = { "name-cho": 1 };

  var ICON_MAP = {
    "fa-arrow-up-right-from-square": "fa-arrow-right",
    "fa-cube": "fa-box-open",
    "fa-layer-group": "fa-folder-open",
    "fa-server": "fa-hard-drive",
    "fa-paper-plane": "fa-envelope",
    "fa-link": "fa-globe",
    "fa-palette": "fa-pen-nib",
    "fa-taxi": "fa-hard-drive",
    "fa-microchip": "fa-code",
    "fa-comments": "fa-comment-dots",
    "fa-magnifying-glass": "fa-globe",
    "fa-circle-half-stroke": "fa-moon",
    "fa-arrow-up": "fa-chevron-down"
  };

  function icon(name) {
    if (!name) return "fas fa-code";
    var parts = String(name).split(/\s+/);
    var out = parts.map(function (p) { return ICON_MAP[p] || p; });
    if (out.indexOf("fas") < 0 && out.indexOf("far") < 0 && out.indexOf("fab") < 0) out.unshift("fas");
    return out.join(" ");
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  };
  var txt = function (v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[state.lang] || v.en || "";
  };
  var t = function (key) { return txt((D.ui || {})[key]); };

  function host(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url || ""; }
  }

  /* в”Ђв”Ђ theme & language в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

  function applyTheme() {
    var root = document.documentElement;
    if (state.theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", state.theme);
    $$(".js-theme-btn").forEach(function (b) {
      b.classList.toggle("TopBar-module__hfKmSa__active", b.dataset.theme === state.theme);
    });
  }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    $$("[data-i18n]").forEach(function (el) {
      var v = t(el.dataset.i18n);
      if (v) el.textContent = v;
    });
    $$(".js-lang-btn").forEach(function (b) {
      b.classList.toggle("TopBar-module__hfKmSa__active", b.dataset.lang === state.lang);
    });
    $$("#langSeg [data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang));
    });
  }

  function setLang(lang) {
    state.lang = lang;
    localStorage.setItem(LS_LANG, lang);
    applyI18n();
    renderAll();
  }

  function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem(LS_THEME, theme);
    applyTheme();
  }

  /* в”Ђв”Ђ navigation в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

  var SECTIONS = [
    { id: "projects", icon: "fa-folder-open", key: "projectsTitle" },
    { id: "services", icon: "fa-hard-drive", key: "servicesTitle" },
    { id: "contact", icon: "fa-envelope", key: "contactTitle" }
  ];

  function renderNav() {
    var top = $("#siteNav");
    if (top) {
      top.innerHTML = SECTIONS.map(function (s) {
        return '<a href="#' + s.id + '">' + esc(t(s.key)) + "</a>";
      }).join("");
    }

    var dock = $("#dock");
    if (dock) {
      dock.innerHTML = SECTIONS.map(function (s) {
        return '<a href="#' + s.id + '"><i class="fas ' + s.icon + '"></i><span>' + esc(t(s.key)) + "</span></a>";
      }).join("") +
        '<a href="socials.html"><i class="fas fa-globe"></i><span>' + esc(t("socialsTitle")) + "</span></a>";
    }

    var foot = $("#footLinks");
    if (foot) {
      foot.innerHTML = SECTIONS.map(function (s) {
        return '<a href="#' + s.id + '">' + esc(t(s.key)) + "</a>";
      }).join("") +
        '<a href="about.html">' + esc(t("aboutTitle")) + "</a>" +
        '<a href="socials.html">' + esc(t("socialsTitle")) + "</a>" +
        '<a href="uniland.html">UniLand</a>' +
        '<a href="uniland-doc.html">' + esc(t("unilandDocs")) + "</a>";
    }

    var side = $("#sideNavList");
    if (side) {
      var items = [];
      if (D.nav) {
        if (D.nav.home) items.push(D.nav.home);
        (D.nav.groups || []).forEach(function (g) { (g.items || []).forEach(function (i) { items.push(i); }); });
      }
      var here = location.pathname.split("/").pop() || "index.html";
      side.innerHTML = items.map(function (i) {
        var active = i.href === here ? ' SideNav-module__W2m5EW__navItemActive' : "";
        return '<a class="SideNav-module__W2m5EW__navItem' + active + '" href="' + esc(i.href) + '">' +
          '<i class="fas ' + esc(i.icon || "fa-angle-right") + '"></i><span>' + esc(txt(i.label)) + "</span></a>";
      }).join("");
    }
  }

  /* в”Ђв”Ђ github sync в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

  function humanKib(kib) {
    if (!kib && kib !== 0) return "";
    var n = kib * 1024;
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(2) + " KB";
    if (n < 1073741824) return (n / 1048576).toFixed(2) + " MiB";
    return (n / 1073741824).toFixed(2) + " GiB";
  }

  function ghCacheGet() {
    try {
      var raw = localStorage.getItem(GH_CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.t || Date.now() - o.t > GH_TTL) return null;
      return o.repos;
    } catch (e) { return null; }
  }

  function ghCacheSet(repos) {
    try { localStorage.setItem(GH_CACHE_KEY, JSON.stringify({ t: Date.now(), repos: repos })); } catch (e) {}
  }

  function syncFromGithub(repos) {
    var byName = {};
    repos.forEach(function (r) { byName[String(r.name).toLowerCase()] = r; });
    var seen = {};
    var out = [];
    (D.projects || []).forEach(function (p) {
      var r = byName[String(p.name).toLowerCase()];
      if (!r) return;
      seen[String(p.name).toLowerCase()] = 1;
      p.stars = r.stargazers_count || 0;
      p.lang = r.language || p.lang;
      p.url = r.html_url;
      out.push(p);
    });
    repos.forEach(function (r) {
      if (SKIP_REPOS[String(r.name).toLowerCase()]) return;
      if (seen[String(r.name).toLowerCase()]) return;
      out.push({
        name: r.name,
        icon: "fa-code",
        lang: r.language || "",
        stars: r.stargazers_count || 0,
        url: r.html_url,
        desc: { en: r.description || "", ru: r.description || "" }
      });
    });
    var g = D.git || (D.git = {});
    var stars = 0, forks = 0;
    repos.forEach(function (r) { stars += r.stargazers_count || 0; forks += r.forks_count || 0; });
    g.stats = { stars: stars, forks: forks, repos: repos.length };
    D.projects = out;
  }

  /* в”Ђв”Ђ renderers в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

  function renderHero() {
    var hero = D.hero || {};
    var h = $("#heroHandle");
    if (h) h.textContent = hero.handle || "rawumi";

    var tag = $("#heroTagline");
    if (tag) tag.textContent = txt(hero.tagline);

    var git = D.git || {};
    var meta = $("#heroMeta");
    if (meta) {
      var s = git.stats || {};
      var repos = s.repos || (D.projects || []).length;
      meta.textContent = repos + " " + (state.lang === "ru" ? "\u0440\u0435\u043f\u043e\u0437\u0438\u0442\u043e\u0440\u0438\u0435\u0432 \u043d\u0430 GitHub" : "repositories on GitHub");
    }
  }

  function row(item, mail) {
    return '<li class="row"><a href="' + esc(item.url) + '"' + (mail ? "" : ' target="_blank" rel="noopener"') + ">" +
      '<span class="row-t">' + esc(item.title) + "</span>" +
      '<span class="row-d">' + esc(item.desc || "") + "</span>" +
      '<span class="row-m mono">' + esc(item.meta || "") + "</span>" +
      '<i class="row-go fas fa-arrow-right"></i>' +
      "</a></li>";
  }

  function renderProjects() {
    var list_el = $("#projectsGrid");
    if (!list_el) return;
    var list = (D.projects || []).slice().sort(function (a, b) {
      return (b.stars || 0) - (a.stars || 0);
    });
    var limit = state.expanded ? list.length : Math.min(PAGE_LIMIT, list.length);
    list_el.innerHTML = list.slice(0, limit).map(function (p) {
      var bits = [];
      if (p.lang && p.lang !== "\u2014") bits.push(p.lang);
      if (p.stars) bits.push("\u2605" + p.stars);
      return row({ url: p.url, title: p.name, desc: txt(p.desc), meta: bits.join(" \u00b7 ") });
    }).join("");

    var more = $("#viewMoreWrap");
    if (more) {
      if (list.length > PAGE_LIMIT) {
        more.innerHTML = '<button class="btn btn--tonal" type="button" id="viewMoreBtn">' +
          esc(state.expanded ? t("lessProjects") : t("allProjects")) +
          ' <i class="fas ' + (state.expanded ? "fa-chevron-up" : "fa-chevron-down") + '"></i></button>';
        $("#viewMoreBtn").addEventListener("click", function () {
          state.expanded = !state.expanded;
          renderProjects();
        });
      } else {
        more.innerHTML = "";
      }
    }
  }

  function renderServices() {
    var list_el = $("#servicesGrid");
    if (!list_el) return;
    list_el.innerHTML = (D.services || []).map(function (s) {
      return row({ url: s.url, title: s.name, desc: txt(s.kind), meta: host(s.url) });
    }).join("");
  }

  function renderContact() {
    var list_el = $("#contactGrid");
    if (!list_el) return;
    var wanted = ["telegram", "github", "mail", "bsky"];
    var all = D.socials || [];
    var picked = [];
    wanted.forEach(function (name) {
      var hit = all.filter(function (s) { return s.name === name; })[0];
      if (hit) picked.push(hit);
    });
    if (picked.length < 3) {
      all.forEach(function (s) { if (picked.indexOf(s) < 0 && picked.length < 4) picked.push(s); });
    }

    list_el.innerHTML = picked.map(function (s) {
      var isMail = /^mailto:/.test(s.url);
      return row({ url: s.url, title: s.name, desc: s.value, meta: isMail ? "mail" : "" }, isMail);
    }).join("");
  }

  function renderSocials() {
    var host = $("#socialsList");
    if (!host) return;
    host.innerHTML = (D.socials || []).map(function (s) {
      return '<a class="page-module__E0kJGG__listRow" href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
        '<i class="' + esc(icon(s.icon || "fas fa-globe")) + '"></i>' +
        '<span class="page-module__E0kJGG__listName">' + esc(s.name) + "</span>" +
        '<span class="page-module__E0kJGG__listDots"></span>' +
        '<span class="page-module__E0kJGG__listValue">' + esc(s.value) + "</span>" +
        "</a>";
    }).join("");
    var note = $("#socialsNote");
    var noteText = t("socialsNote");
    if (note && noteText) note.textContent = noteText;
  }

  /* в”Ђв”Ђ legacy chrome for inner pages в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

  function bindLegacyChrome() {
    var navBtn = $("#navBtn"), sideNav = $("#sideNav"), overlay = $("#sideOverlay");
    if (navBtn && sideNav) {
      var toggle = function (open) {
        sideNav.classList.toggle("SideNav-module__W2m5EW__open", open);
        if (overlay) overlay.classList.toggle("SideNav-module__W2m5EW__overlayVisible", open);
      };
      navBtn.addEventListener("click", function () {
        toggle(!sideNav.classList.contains("SideNav-module__W2m5EW__open"));
      });
      if (overlay) overlay.addEventListener("click", function () { toggle(false); });
    }

    var settingsBtn = $("#settingsBtn"), popup = $("#settingsPopup");
    if (settingsBtn && popup) {
      settingsBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        popup.classList.toggle("TopBar-module__hfKmSa__open");
      });
      document.addEventListener("click", function (e) {
        if (!popup.contains(e.target) && e.target !== settingsBtn) {
          popup.classList.remove("TopBar-module__hfKmSa__open");
        }
      });
    }

    $$(".page-module__iRtBbG__copyBtn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var code = btn.dataset.code || "";
        var done = function () {
          var label = btn.querySelector(".copyLabel");
          if (!label) return;
          var old = label.textContent;
          label.textContent = t("copied") || old;
          setTimeout(function () { label.textContent = old; }, 1400);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, done);
        else done();
      });
    });
  }

  /* в”Ђв”Ђ motion в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  function revealNodes(root) {
    if (reduceMotion) return;
    $$(".strip, .sec, .foot", root).forEach(function (el) { el.classList.add("reveal"); });
  }

  function revealCheck() {
    if (reduceMotion) return;
    var vh = window.innerHeight;
    $$(".reveal:not(.in)").forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.94) el.classList.add("in");
    });
  }

  function updateSpy() {
    var mid = window.innerHeight * 0.36;
    var current = null;
    SECTIONS.forEach(function (sec) {
      var el = document.getElementById(sec.id);
      if (el && el.getBoundingClientRect().top <= mid) current = sec.id;
    });
    $$("#siteNav a, #dock a").forEach(function (a) {
      var on = a.getAttribute("href") === "#" + current;
      a.classList.toggle("is-active", on);
      a.classList.toggle("is-current", on);
    });
  }

  function initScrollFx() {
    var onScroll = function () { revealCheck(); updateSpy(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    revealCheck();
    updateSpy();
  }

  function initRipple() {
    if (reduceMotion) return;
    document.addEventListener("pointerdown", function (e) {
      var el = e.target.closest && e.target.closest(".btn, .icon-btn, .row a, .head-links a, .foot-links a, .dock a, .page-module__E0kJGG__listRow");
      if (!el) return;
      var r = el.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2;
      var span = document.createElement("span");
      span.className = "m3-ripple";
      span.style.width = span.style.height = size + "px";
      span.style.left = (e.clientX - r.left - size / 2) + "px";
      span.style.top = (e.clientY - r.top - size / 2) + "px";
      el.classList.add("ripple-host");
      el.appendChild(span);
      el.classList.add("is-pressed");
      setTimeout(function () { el.classList.remove("is-pressed"); }, 180);
      span.addEventListener("animationend", function () { span.remove(); });
    }, { passive: true });
  }

  /* в”Ђв”Ђ boot в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

  function renderAll() {
    renderNav();
    renderHero();
    renderProjects();
    renderServices();
    renderContact();
    renderSocials();
  }

  function syncParticlesButton() {
    var btn = $("#particlesBtn");
    if (!btn || !window.FX || !window.FX.isEnabled) return;
    btn.setAttribute("aria-pressed", String(window.FX.isEnabled()));
    btn.addEventListener("click", function () {
      setTimeout(function () { btn.setAttribute("aria-pressed", String(window.FX.isEnabled())); }, 0);
    });
  }

  function boot() {
    applyTheme();
    applyI18n();

    $$(".js-theme-btn").forEach(function (b) {
      b.addEventListener("click", function () { setTheme(b.dataset.theme); });
    });
    $$(".js-lang-btn").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.lang); });
    });
    $$("#langSeg [data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.lang); });
    });

    var themeBtn = $("#themeBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        setTheme(state.theme === "light" ? "dark" : state.theme === "dark" ? "auto" : "light");
      });
    }

    var year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    renderAll();
    bindLegacyChrome();
    syncParticlesButton();
    revealNodes(document);
    initRipple();
    initScrollFx();

    if (typeof fetch === "function") {
      var cached = ghCacheGet();
      var apply = function (repos) {
        if (!repos || !repos.length) return;
        syncFromGithub(repos);
        renderHero();
        renderProjects();
      };
      if (cached) apply(cached);
      else {
        fetch("https://api.github.com/users/rawumi/repos?per_page=100", {
          headers: { Accept: "application/vnd.github+json" }
        }).then(function (r) { return r.ok ? r.json() : null; })
          .then(function (repos) { if (repos && repos.length) { ghCacheSet(repos); apply(repos); } })
          .catch(function () {});
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
