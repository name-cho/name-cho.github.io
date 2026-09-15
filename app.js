
(function () {
  "use strict";

  var D = window.SITE_DATA;
  var LS_THEME = "cho.theme";
  var LS_LANG = "cho.lang";

  var state = {
    theme: localStorage.getItem(LS_THEME) || "auto",
    lang: localStorage.getItem(LS_LANG) || "en",
    navOpen: false,
    navGroups: {},
    popupOpen: false,
    sortOpen: false,
    sort: "stars",
    expanded: false
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  
  function t(key) {
    var v = D.ui[key];
    if (!v) return key;
    return v[state.lang] || v.en;
  }
  function tr(obj) {
    if (!obj) return "";
    return obj[state.lang] || obj.en || "";
  }
  function applyI18n() {
    $$("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      var v = t(k);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.placeholder = v;
      else el.textContent = v;
    });
    $$("[data-i18n-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-label")));
    });
    document.documentElement.lang = state.lang === "ru" ? "ru" : "en";
    document.title = tr(D.meta.title);
    var md = $('meta[name="description"]');
    if (md) md.setAttribute("content", tr(D.meta.description));
  }

  
  function applyTheme() {
    var root = document.documentElement;
    if (state.theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", state.theme);
    $$(".js-theme-btn").forEach(function (b) {
      b.classList.toggle("TopBar-module__hfKmSa__active", b.dataset.theme === state.theme);
    });
  }

  
  function currentPage() {
    var p = location.pathname.split("/").pop();
    if (!p || p === "") p = "index.html";
    return p;
  }

  function renderNav() {
    var nav = $("#sideNavList");
    if (!nav) return;
    var cur = currentPage();
    var html = "";

    html += '<a class="SideNav-module__W2m5EW__navItem' +
      (cur === (D.nav.home.href || "index.html") ? " SideNav-module__W2m5EW__navItemActive" : "") +
      '" href="' + D.nav.home.href + '">' +
      '<i class="fas ' + D.nav.home.icon + '"></i><span>' + tr(D.nav.home.label) + "</span></a>";

    (D.nav.groups || []).forEach(function (g, gi) {
      var hasActive = (g.items || []).some(function (it) { return it.href === cur; });
      if (state.navGroups[gi] === undefined) state.navGroups[gi] = hasActive;
      html += '<div class="SideNav-module__W2m5EW__navGroup">' +
        '<button class="SideNav-module__W2m5EW__navItem SideNav-module__W2m5EW__navGroupToggle' +
        (hasActive ? " SideNav-module__W2m5EW__navItemActive" : "") + '" type="button" data-group="' + gi + '">' +
        '<i class="fas ' + (g.icon || "fa-folder-open") + '"></i><span>' + esc(g.label) + "</span>" +
        '<i class="fas fa-chevron-right SideNav-module__W2m5EW__chevron"></i></button>' +
        '<div class="SideNav-module__W2m5EW__navSubList">';
      (g.items || []).forEach(function (it) {
        html += '<a class="SideNav-module__W2m5EW__navSubItem' +
          (it.href === cur ? " SideNav-module__W2m5EW__navSubItemActive" : "") +
          '" href="' + it.href + '">' + tr(it.label) + "</a>";
      });
      html += "</div></div>";
    });

    nav.innerHTML = html;
    $$(".SideNav-module__W2m5EW__navGroupToggle", nav).forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var gi = parseInt(b.dataset.group, 10);
        state.navGroups[gi] = !state.navGroups[gi];
        syncNavGroups();
        var sub = b.parentNode.querySelector(".SideNav-module__W2m5EW__navSubList");
        if (sub && state.navGroups[gi]) jelly(sub);
      });
    });
    syncNavGroups();
  }

  function syncNavGroups() {
    $$(".SideNav-module__W2m5EW__navGroup").forEach(function (grp, gi) {
      var open = !!state.navGroups[gi];
      var sub = grp.querySelector(".SideNav-module__W2m5EW__navSubList");
      var chev = grp.querySelector(".SideNav-module__W2m5EW__chevron");
      if (sub) sub.classList.toggle("SideNav-module__W2m5EW__navSubListOpen", open);
      if (chev) chev.classList.toggle("SideNav-module__W2m5EW__chevronOpen", open);
    });
  }

  
  function jelly(el, cls) {
    cls = cls || "jelly-wobble";
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function syncNavOpen() {
    var sn = $("#sideNav");
    var ov = $("#sideOverlay");
    var btn = $("#navBtn");
    if (sn) sn.classList.toggle("SideNav-module__W2m5EW__open", state.navOpen);
    if (ov) ov.classList.toggle("SideNav-module__W2m5EW__overlayVisible", state.navOpen);
    if (btn) {
      btn.classList.toggle("TopBar-module__hfKmSa__settingsBtnActive", state.navOpen);
      var icon = btn.querySelector("i");
      if (icon) icon.className = "fas " + (state.navOpen ? "fa-xmark" : "fa-bars");
      btn.setAttribute("aria-label", state.navOpen ? "Close navigation" : "Open navigation");
    }
  }

  
  function syncPopup() {
    var p = $("#settingsPopup");
    var b = $("#settingsBtn");
    if (p) p.classList.toggle("TopBar-module__hfKmSa__open", state.popupOpen);
    if (b) b.classList.toggle("TopBar-module__hfKmSa__settingsBtnActive", state.popupOpen);
    var tip = $("#settingsTooltip");
    if (tip) tip.classList.toggle("TopBar-module__hfKmSa__tooltipHidden", state.popupOpen);
  }

  
  var SIZE_UNITS = { b: 1, kb: 1000, kib: 1024, mb: 1000000, mib: 1048576, gb: 1e9, gib: 1073741824 };
  function sizeBytes(s) {
    if (s == null) return 0;
    if (typeof s === "number") return s;
    var m = String(s).replace(/\s/g, "").replace(",", ".").match(/^([\d.]+)([a-zA-Z]*)$/);
    if (!m) return 0;
    var n = parseFloat(m[1]);
    if (isNaN(n)) return 0;
    return n * (SIZE_UNITS[m[2].toLowerCase()] || 1);
  }

  var SORTS = [
    { id: "stars",   icon: "fa-star",            key: "sortStars" },
    { id: "updated", icon: "fa-clock",           key: "sortUpdated" },
    { id: "alpha",   icon: "fa-arrow-down-a-z",  key: "sortAlpha" },
    { id: "size",    icon: "fa-weight-hanging",  key: "sortSize" },
    { id: "commits", icon: "fa-code-commit",     key: "sortCommits" }
  ];

  function byName(a, b) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); }

  function sortedProjects() {
    var list = D.projects.slice();
    if (state.sort === "updated") {
      list.sort(function (a, b) { return new Date(b.updated) - new Date(a.updated) || byName(a, b); });
    } else if (state.sort === "alpha") {
      list.sort(byName);
    } else if (state.sort === "size") {
      list.sort(function (a, b) { return sizeBytes(b.size) - sizeBytes(a.size) || byName(a, b); });
    } else if (state.sort === "commits") {
      list.sort(function (a, b) { return (b.commits || 0) - (a.commits || 0) || byName(a, b); });
    } else {
      
      list.sort(function (a, b) {
        return (b.stars || 0) - (a.stars || 0) || (b.commits || 0) - (a.commits || 0) || byName(a, b);
      });
    }
    return list;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function relTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (state.lang === "ru") {
      if (days <= 0) return "сегодня";
      if (days === 1) return "вчера";
      if (days < 30) return days + " дн. назад";
      if (days < 365) return Math.floor(days / 30) + " мес. назад";
      return Math.floor(days / 365) + " г. назад";
    }
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return days + " days ago";
    if (days < 365) return Math.floor(days / 30) + " months ago";
    return Math.floor(days / 365) + " years ago";
  }

  function metaRow(p) {
    return '<div class="ProjectsSection-module__2qoIza__meta">' +
      '<span class="ProjectsSection-module__2qoIza__metaItem"><i class="fas fa-star"></i>' + (p.stars || 0) + "</span>" +
      '<span class="ProjectsSection-module__2qoIza__metaItem"><i class="fas fa-code-branch"></i>' + (p.forks || 0) + "</span>" +
      '<span class="ProjectsSection-module__2qoIza__metaItem"><i class="fas ' + (p.icon || "fa-code") + '"></i>' + esc(p.lang || "—") + "</span>" +
      '<span class="ProjectsSection-module__2qoIza__metaItem"><i class="fas fa-hard-drive"></i>' + esc(p.size || "—") + "</span>" +
      '<span class="ProjectsSection-module__2qoIza__metaItem"><i class="fas fa-clock"></i>' + esc(relTime(p.updated)) + "</span>" +
      "</div>";
  }

  function cardHTML(p, index, featured) {
    var cls = "ProjectsSection-module__2qoIza__card" + (featured ? " ProjectsSection-module__2qoIza__cardFeatured" : "");
    var h = '<a class="' + cls + '" href="' + esc(p.url) + '" target="_blank" rel="noopener" style="--card-index:' + index + '">';
    if (featured) {
      h += '<div class="ProjectsSection-module__2qoIza__featuredBadge"><i class="fas fa-star"></i>' + esc(t("featured")) + "</div>";
      h += '<div class="ProjectsSection-module__2qoIza__name">' + esc(p.name) + "</div>";
      h += '<div class="ProjectsSection-module__2qoIza__descriptionFull">' + esc(tr(p.desc)) + "</div>";
    } else {
      h += '<div class="ProjectsSection-module__2qoIza__name">' + esc(p.name) + "</div>";
      h += '<div class="ProjectsSection-module__2qoIza__description">' + esc(tr(p.desc)) + "</div>";
    }
    h += metaRow(p) + "</a>";
    return h;
  }

  function gridHTML() {
    var list = sortedProjects();
    if (state.expanded || list.length <= 3) {
      var all = "";
      list.forEach(function (p, i) { all += cardHTML(p, i, i === 0); });
      return { grid: all, more: list.length > 3 ? toggleLink(true) : "" };
    }
    var h = cardHTML(list[0], 0, true);
    h += '<div class="ProjectsSection-module__2qoIza__divider" aria-hidden="true"></div>';
    h += '<div class="ProjectsSection-module__2qoIza__stack">';
    h += cardHTML(list[1], 1, false);
    h += cardHTML(list[2], 2, false);
    h += "</div>";
    return { grid: h, more: toggleLink(false) };
  }

  function toggleLink(isExpanded) {
    return '<a href="#" class="ProjectsSection-module__2qoIza__viewMore" id="viewMoreBtn">' +
      esc(isExpanded ? t("viewLess") : t("viewMore")) + "</a>";
  }

  function prefersReducedMotion() {
    try {
      return typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { return false; }
  }

  var CLS = {
    grid: "ProjectsSection-module__2qoIza__grid",
    entering: "ProjectsSection-module__2qoIza__gridEntering",
    leaving: "ProjectsSection-module__2qoIza__gridLeaving",
    expanded: "ProjectsSection-module__2qoIza__gridExpanded"
  };

  function renderGrid(animate) {
    var grid = $("#projectsGrid");
    var moreWrap = $("#viewMoreWrap");
    if (!grid) return;
    var data = gridHTML();

    var paint = function () {
      grid.innerHTML = data.grid;
      grid.classList.toggle(CLS.expanded, state.expanded || D.projects.length <= 3);
      if (moreWrap) moreWrap.innerHTML = data.more;
      var btn = $("#viewMoreBtn");
      if (btn) btn.addEventListener("click", function (e) {
        e.preventDefault();
        state.expanded = !state.expanded;
        renderGrid(true);
      });
      if (animate) {
        grid.classList.remove(CLS.leaving);
        grid.classList.add(CLS.entering);
        setTimeout(function () { grid.classList.remove(CLS.entering); }, 700);
      }
    };

    if (animate && !prefersReducedMotion()) {
      grid.classList.remove(CLS.entering);
      grid.classList.add(CLS.leaving);
      setTimeout(paint, 240);
    } else {
      paint();
    }
  }

  function renderSortMenu() {
    var root = $("#sortRoot");
    if (!root) return;
    var cur = SORTS.filter(function (s) { return s.id === state.sort; })[0] || SORTS[0];
    var h = '<button type="button" class="ProjectsSection-module__2qoIza__sortTrigger" id="sortTrigger" aria-haspopup="listbox" aria-expanded="false" data-i18n-label="myProjects" aria-label="' + esc(t("myProjects")) + '">' +
      '<i class="fas ' + cur.icon + ' ProjectsSection-module__2qoIza__sortTriggerIcon"></i><span>' + esc(t(cur.key)) + "</span>" +
      '<i class="fas fa-chevron-down ProjectsSection-module__2qoIza__sortChevron" id="sortChevron"></i></button>' +
      '<ul class="ProjectsSection-module__2qoIza__sortMenu" id="sortMenu" role="listbox">';
    SORTS.forEach(function (s) {
      var on = s.id === state.sort;
      h += '<li role="presentation"><button type="button" role="option" aria-selected="' + (on ? "true" : "false") + '" data-sort="' + s.id + '"' +
        ' class="ProjectsSection-module__2qoIza__sortOption' + (on ? " ProjectsSection-module__2qoIza__sortOptionActive" : "") + '">' +
        '<i class="fas ' + s.icon + ' ProjectsSection-module__2qoIza__sortOptionIcon"></i><span>' + esc(t(s.key)) + "</span>" +
        (on ? '<i class="fas fa-check ProjectsSection-module__2qoIza__sortOptionCheck"></i>' : "") + "</button></li>";
    });
    h += "</ul>";
    root.innerHTML = h;

    $("#sortTrigger").addEventListener("click", function (e) {
      e.stopPropagation();
      state.sortOpen = !state.sortOpen;
      syncSort();
    });
    $$("#sortMenu [data-sort]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        state.sort = b.dataset.sort;
        state.sortOpen = false;
        renderSortMenu();
        renderGrid(true);
      });
    });
    syncSort();
  }

  function syncSort() {
    document.body.classList.toggle("sort-open", state.sortOpen);
    var m = $("#sortMenu");
    var c = $("#sortChevron");
    var trg = $("#sortTrigger");
    if (m) m.classList.toggle("ProjectsSection-module__2qoIza__sortMenuOpen", state.sortOpen);
    if (c) c.classList.toggle("ProjectsSection-module__2qoIza__sortChevronOpen", state.sortOpen);
    if (trg) {
      trg.classList.toggle("ProjectsSection-module__2qoIza__sortTriggerActive", state.sortOpen);
      trg.setAttribute("aria-expanded", state.sortOpen ? "true" : "false");
    }
  }

  
  function renderGitCard() {
    var card = $("#gitCard");
    if (!card) return;
    var src = D.git;
    card.setAttribute("href", src.url);
    card.setAttribute("aria-label", "GitHub profile");
    var av = $("#gitAvatar");
    if (av) {
      av.classList.remove("GithubCard-module__CP3e5W__skeleton");
      av.innerHTML = '<img src="' + esc(src.avatar) + '" alt="" onerror="this.onerror=null;this.src=&quot;' + (window.AVATAR_FALLBACK || "") + '&quot;">';
    }
    var login = $("#gitLogin");
    if (login) { login.classList.remove("GithubCard-module__CP3e5W__skeletonText"); login.textContent = src.login; }
    var bio = $("#gitBio");
    if (bio) { bio.classList.remove("GithubCard-module__CP3e5W__skeletonText"); bio.textContent = tr(src.bio); }
    var st = $$("#gitCard .GithubCard-module__CP3e5W__stat span");
    if (st[0]) { st[0].classList.remove("GithubCard-module__CP3e5W__skeletonText"); st[0].textContent = src.stats.stars; }
    if (st[1]) { st[1].classList.remove("GithubCard-module__CP3e5W__skeletonText"); st[1].textContent = src.stats.forks; }
    var repoRow = $("#gitTopRepo");
    if (repoRow && src.topRepo) {
      repoRow.innerHTML = '<i class="fas fa-star"></i>' +
        '<a class="GithubCard-module__CP3e5W__topRepoName" href="' + esc(src.topRepo.url) + '" target="_blank" rel="noopener">' + esc(src.topRepo.name) + "</a>" +
        '<span class="GithubCard-module__CP3e5W__topRepoLang">' + esc(src.topRepo.lang) + "</span>" +
        '<span class="GithubCard-module__CP3e5W__topRepoStars">' + (src.topRepo.stars || 0) + "</span>";
      repoRow.style.display = "flex";
    }
  }

  
  var GH_CACHE_KEY = "cho.ghstats";
  var GH_TTL = 5 * 60 * 1000;

  function ghCacheGet() {
    try {
      var raw = localStorage.getItem(GH_CACHE_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (!c || !c.ts || Date.now() - c.ts > GH_TTL || !c.repos) return null;
      return c.repos;
    } catch (e) { return null; }
  }

  function ghCacheSet(repos) {
    try {
      localStorage.setItem(GH_CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        repos: repos.map(function (r) {
          return {
            name: r.name, stargazers_count: r.stargazers_count, forks_count: r.forks_count,
            language: r.language, size: r.size, pushed_at: r.pushed_at, updated_at: r.updated_at,
            html_url: r.html_url, description: r.description
          };
        })
      }));
    } catch (e) { /* private mode: live without cache */ }
  }

  function humanKib(kib) {
    var n = (kib || 0) * 1024;
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(2) + " KB";
    if (n < 1073741824) return (n / 1048576).toFixed(2) + " MiB";
    return (n / 1073741824).toFixed(2) + " GiB";
  }

  var LANG_ICONS = {
    python: "fa-code", javascript: "fa-code", typescript: "fa-code", rust: "fa-terminal",
    shell: "fa-terminal", html: "fa-globe", css: "fa-palette", kotlin: "fa-mobile-screen-button",
    java: "fa-code", glsl: "fa-wand-magic-sparkles", "visual basic .net": "fa-taxi",
    c: "fa-microchip", "c++": "fa-microchip", "c#": "fa-code", go: "fa-code", php: "fa-code"
  };

  function syncFromGithub(repos) {
    var byName = {};
    repos.forEach(function (r) { byName[String(r.name).toLowerCase()] = r; });
    var seen = {};
    var out = [];
    D.projects.forEach(function (p) {
      var r = byName[p.name.toLowerCase()];
      if (!r) return;
      seen[p.name.toLowerCase()] = 1;
      p.stars = r.stargazers_count || 0;
      p.forks = r.forks_count || 0;
      p.lang = r.language || p.lang || "—";
      p.size = humanKib(r.size);
      p.updated = r.pushed_at || r.updated_at || p.updated;
      p.url = r.html_url;
      out.push(p);
    });
    repos.forEach(function (r) {
      if (seen[String(r.name).toLowerCase()]) return;
      out.push({
        name: r.name,
        icon: LANG_ICONS[String(r.language || "").toLowerCase()] || "fa-code",
        lang: r.language || "—",
        stars: r.stargazers_count || 0,
        forks: r.forks_count || 0,
        size: humanKib(r.size),
        commits: 0,
        updated: r.pushed_at || r.updated_at || "",
        url: r.html_url,
        desc: {
          en: r.description || "Public repository.",
          ru: r.description || "Публичный репозиторий."
        }
      });
    });
    var g = D.git;
    var stars = 0, forks = 0, top = null;
    repos.forEach(function (r) {
      stars += r.stargazers_count || 0;
      forks += r.forks_count || 0;
      if (!top || (r.stargazers_count || 0) > (top.stargazers_count || 0)) top = r;
    });
    g.stats = { stars: stars, forks: forks, repos: repos.length };
    if (top) g.topRepo = { name: top.name, lang: top.language || "—", stars: top.stargazers_count || 0, url: top.html_url };
    var summary = out.map(function (p) { return p.name + ":" + p.stars + ":" + p.forks + ":" + p.updated; }).join("|");
    var changed = summary !== D.projectsSummary;
    D.projectsSummary = summary;
    D.projects = out;
    return changed;
  }

  var ghSyncedOnce = false;
  function liveStats() {
    if (typeof fetch !== "function") return;
    var render = function (repos) {
      if (!repos || !repos.length) return;
      var changed = syncFromGithub(repos);
      if (changed && ghSyncedOnce) renderGrid(true);
      else if (changed) renderGrid(false);
      ghSyncedOnce = true;
      renderGitCard();
    };
    var cached = ghCacheGet();
    if (cached) { render(cached); return; }
    fetch("https://api.github.com/users/name-cho/repos?per_page=100",
          { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (repos) {
        if (!repos || !repos.length) return;
        ghCacheSet(repos);
        render(repos);
      })
      .catch(function () { /* offline or rate-limited: snapshot stays */ });
  }

  function renderContact() {
    var c = D.contact;
    var name = $("#tgName"); if (name) name.textContent = c.name;
    var desc = $("#tgDesc"); if (desc) desc.textContent = tr(c.description);
    var us = $("#tgUsernames");
    if (us) {
      us.innerHTML = c.links.map(function (l) {
        return '<a href="' + esc(l.url) + '" class="TelegramCard-module__SQS1Ya__usernameLink" target="_blank" rel="noopener" aria-label="Telegram ' + esc(l.handle) + '">@' + esc(l.handle.replace(/^@/, "")) + "</a>";
      }).join("");
    }
    var lab = $("#tgBadgeLabel"); if (lab) lab.textContent = c.badge.label;
    var val = $("#tgBadgeValue"); if (val) val.textContent = c.badge.value;
    var more = $("#moreSocials");
    if (more) {
      more.setAttribute("href", c.more.url);
      more.innerHTML = '<span>' + esc(tr(c.more.label)) + '</span><i class="fas fa-arrow-right"></i>';
    }
  }

  function renderSocials() {
    var list = $("#socialsList");
    if (!list) return;
    list.innerHTML = D.socials.map(function (s) {
      return '<a class="page-module__E0kJGG__listRow" href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
        '<i class="' + esc(s.icon) + '"></i>' +
        '<span class="page-module__E0kJGG__listName">' + esc(s.name) + "</span>" +
        '<span class="page-module__E0kJGG__listDots"></span>' +
        '<span class="page-module__E0kJGG__listValue">' + esc(s.value) + "</span></a>";
    }).join("");
  }

  
  function renderCopyButtons() {
    var btns = $$(".page-module__iRtBbG__copyBtn");
    btns.forEach(function (b) {
      var label = $(".copyLabel", b);
      if (label) label.textContent = b.dataset.copied === "1" ? t("copied") : t("copy");
      if (b.dataset.bound === "1") return;
      b.dataset.bound = "1";
      b.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var text = b.getAttribute("data-code") || "";
        var done = function () {
          b.dataset.copied = "1";
          b.classList.add("copied");
          var l = $(".copyLabel", b);
          if (l) l.textContent = t("copied");
          var i = b.querySelector("i");
          if (i) { i.className = "fas fa-check"; }
          if (window.FX) {
            var r = b.getBoundingClientRect();
            window.FX.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 14, power: 0.7 });
          }
          setTimeout(function () {
            b.dataset.copied = "";
            b.classList.remove("copied");
            var l2 = $(".copyLabel", b);
            if (l2) l2.textContent = t("copy");
            if (i) i.className = "fas fa-copy";
          }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        } else {
          fallbackCopy(text, done);
        }
      });
    });
  }

  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done();
    } catch (e) {  }
  }

  
  function initTocSpy() {
    $$(".page-module__iRtBbG__toc").forEach(spyOneToc);
  }

  
  function keepTocScroll(toc) {
    
    if (toc.dataset.locked === "1") return;
    toc.dataset.locked = "1";
    var prev = toc.style.overflowY;
    
    var lock = "hidden";
    try { if (window.CSS && CSS.supports && CSS.supports("overflow-y", "clip")) lock = "clip"; } catch (e) {}
    toc.style.overflowY = lock;
    var release = function () {
      toc.style.overflowY = prev || "";
      delete toc.dataset.locked;
      toc.removeEventListener("wheel", once);
      toc.removeEventListener("touchmove", once);
    };
    var once = function () { release(); };
    toc.addEventListener("wheel", once, { passive: true });
    toc.addEventListener("touchmove", once, { passive: true });
    setTimeout(release, 2500);
  }

  function spyOneToc(toc) {
    if (!toc) return;
    var links = $$(".page-module__iRtBbG__tocLink", toc);
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var targets = Object.keys(map).map(function (id) { return document.getElementById(id); })
      .filter(function (el) { return !!el; });
    if (!targets.length) return;

    var setCurrent = function (id) {
      links.forEach(function (a) { a.classList.remove("tocActive"); });
      if (map[id]) map[id].classList.add("tocActive");
    };

    if ("IntersectionObserver" in window) {
      var visible = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
        var best = null, bestVal = 0;
        Object.keys(visible).forEach(function (k) {
          if (visible[k] > bestVal) { bestVal = visible[k]; best = k; }
        });
        if (best) setCurrent(best);
      }, { rootMargin: "-96px 0px -60% 0px", threshold: [0, 0.15, 0.4, 0.8, 1] });
      targets.forEach(function (el) { io.observe(el); });
    } else {
      window.addEventListener("scroll", function () {
        var y = window.scrollY + 140, cur = targets[0].id;
        targets.forEach(function (el) { if (el.offsetTop <= y) cur = el.id; });
        setCurrent(cur);
      });
    }

    
    links.forEach(function (a) {
      a.addEventListener("mousedown", function (e) { e.preventDefault(); });
      a.addEventListener("click", function () {
        keepTocScroll(toc);
        var el = document.getElementById(a.getAttribute("href").slice(1));
        if (el && window.FX) {
          var r = el.getBoundingClientRect();
          setTimeout(function () {
            window.FX.burst(Math.min(r.left + 40, window.innerWidth - 40), r.top + 20,
              { count: 16, power: 0.75, angle: -Math.PI / 2, spread: Math.PI });
          }, 320);
        }
      });
    });
  }

  
  function initDocsEntrance() {
    var items = $$(".page-module__iRtBbG__section, .page-module__iRtBbG__codeBlock.exampleBlock");
    if (!items.length || !("IntersectionObserver" in window)) return;
    items.forEach(function (el) { el.style.opacity = "0"; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.style.opacity = "";
        el.classList.add("jelly-rise");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  }

  
  function initJelly() {
    $$(".TopBar-module__hfKmSa__optionBtn, .ProjectsSection-module__2qoIza__sortOption, " +
      ".page-module__bkK2cG__button").forEach(function (el) {
      if (el.dataset.jellyBound === "1") return;
      el.dataset.jellyBound = "1";
      el.addEventListener("click", function () { jelly(el, "jelly-press"); });
    });
  }

  
  function bind() {
    var burger = $("#navBtn");
    var overlay = $("#sideOverlay");
    if (burger) burger.addEventListener("click", function (e) {
      e.stopPropagation();
      state.navOpen = !state.navOpen;
      if (state.navOpen) {
        (D.nav.groups || []).forEach(function (g, gi) { state.navGroups[gi] = true; });
        syncNavGroups();
      }
      syncNavOpen();
    });
    if (overlay) overlay.addEventListener("click", function () {
      state.navOpen = false; syncNavOpen();
    });

    var sb = $("#settingsBtn");
    if (sb) sb.addEventListener("click", function (e) {
      e.stopPropagation();
      state.popupOpen = !state.popupOpen;
      syncPopup();
    });

    $$(".js-theme-btn").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        state.theme = b.dataset.theme;
        localStorage.setItem(LS_THEME, state.theme);
        applyTheme();
      });
    });
    $$(".js-lang-btn").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        state.lang = b.dataset.lang;
        localStorage.setItem(LS_LANG, state.lang);
        renderAll();
      });
    });

    document.addEventListener("click", function () {
      if (state.popupOpen) { state.popupOpen = false; syncPopup(); }
      if (state.sortOpen) { state.sortOpen = false; syncSort(); }
    });
    window.addEventListener("scroll", function () {
      if (state.sortOpen) { state.sortOpen = false; syncSort(); }
    }, { passive: true });
    var gridEl = $("#projectsGrid");
    if (gridEl) gridEl.addEventListener("pointerover", function () {
      if (state.sortOpen) { state.sortOpen = false; syncSort(); }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        state.popupOpen = false; state.sortOpen = false; state.navOpen = false;
        syncPopup(); syncSort(); syncNavOpen();
      }
    });
    var pop = $("#settingsPopup");
    if (pop) pop.addEventListener("click", function (e) { e.stopPropagation(); });
    var sr = $("#sortRoot");
    if (sr) sr.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  function renderAll() {
    applyI18n();
    applyTheme();
    $$(".js-lang-btn").forEach(function (b) {
      b.classList.toggle("TopBar-module__hfKmSa__active", b.dataset.lang === state.lang);
    });
    renderNav();
    renderGitCard();
    renderContact();
    renderSortMenu();
    renderGrid(false);
    renderSocials();
    renderCopyButtons();
    initJelly();
    var h1 = $("#heroHandle"); if (h1) h1.textContent = D.hero.handle;
    var tag = $("#heroTagline"); if (tag) tag.textContent = tr(D.hero.tagline);
    var note = $("#snapshotNote"); if (note) note.textContent = tr(D.ui.liveNote);
  }

  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    
    var pg = document.querySelector("[data-page]");
    if (pg && pg.dataset.page === "projects") state.expanded = true;
    bind();
    renderAll();
    liveStats();
    initTocSpy();
    initDocsEntrance();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
