
(function () {
  "use strict";

  var LS_KEY = "cho.particles";
  var enabled = localStorage.getItem(LS_KEY) !== "off";

  var canvas = document.createElement("canvas");
  canvas.id = "fxCanvas";
  canvas.setAttribute("aria-hidden", "true");
  document.documentElement.appendChild(canvas);
  var ctx = null;
  try { ctx = canvas.getContext("2d"); } catch (e) { ctx = null; }

  var dpr = 1;
  function resize() {
    if (!ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  
  function palette() {
    if (!document || !document.documentElement) return colors || [];
    var cs = getComputedStyle(document.documentElement);
    function v(n, fb) { var x = cs.getPropertyValue(n).trim(); return x || fb; }
    return [
      v("--primary", "#6750e0"),
      v("--tertiary", "#a855f7"),
      v("--secondary", "#17a982"),
      v("--text-color", "#1c1a22"),
      v("--primary-container", "#e6deff")
    ];
  }
  var colors = palette();
  var themeObs = new MutationObserver(function () { colors = palette(); });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("pagehide", function () { themeObs.disconnect(); });

  var SHAPES = ["pill", "dot", "square", "star", "ring"];
  var parts = [];
  var MAX = 420;
  var running = false;
  var last = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  function spawn(x, y, opts) {
    if (!ctx || !enabled || reduced) return;
    opts = opts || {};
    var n = opts.count || 22;
    var power = opts.power == null ? 1 : opts.power;
    var spread = opts.spread == null ? Math.PI * 2 : opts.spread;
    var baseAngle = opts.angle == null ? -Math.PI / 2 : opts.angle;
    for (var i = 0; i < n; i++) {
      if (parts.length >= MAX) break;
      var a = baseAngle + (Math.random() - 0.5) * spread;
      var sp = rand(2.2, 8.5) * power;
      var size = rand(4, 11);
      parts.push({
        x: x, y: y,
        vx: Math.cos(a) * sp + rand(-0.6, 0.6),
        vy: Math.sin(a) * sp - rand(0.4, 2.4),
        g: rand(0.16, 0.3),
        drag: rand(0.975, 0.992),
        size: size,
        shape: pick(SHAPES),
        color: pick(colors),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.32, 0.32),
        wob: rand(0, Math.PI * 2),
        vw: rand(0.14, 0.3),
        life: 1,
        decay: rand(0.0055, 0.012),
        bounce: rand(0.28, 0.5)
      });
    }
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
  }

  function drawStar(c, r) {
    c.beginPath();
    for (var i = 0; i < 5; i++) {
      var a1 = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      var a2 = a1 + Math.PI / 5;
      c.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
      c.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
    }
    c.closePath();
    c.fill();
  }

  function frame(now) {
    if (!ctx) { running = false; parts.length = 0; return; }
    var dt = Math.min((now - last) / 16.667, 2.4);
    last = now;
    var W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);

    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += p.g * dt;
      p.vx *= Math.pow(p.drag, dt);
      p.vy *= Math.pow(p.drag, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.wob += p.vw * dt;
      p.life -= p.decay * dt;

      
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      var stretch = 1 + Math.min(sp * 0.045, 0.55);
      var wobble = 1 + Math.sin(p.wob) * 0.14;

      
      if (p.y + p.size > H && p.vy > 0) {
        p.y = H - p.size;
        p.vy = -p.vy * p.bounce;
        p.vx *= 0.86;
        p.vr *= -0.6;
        p.life -= 0.04;
      }

      if (p.life <= 0 || p.x < -80 || p.x > W + 80) { parts.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha = Math.max(Math.min(p.life, 1), 0) * 0.95;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(stretch * wobble, (2 - stretch) * (2 - wobble) / 1);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      var s = p.size;

      if (p.shape === "dot") {
        ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.fill();
      } else if (p.shape === "square") {
        ctx.fillRect(-s * 0.34, -s * 0.34, s * 0.68, s * 0.68);
      } else if (p.shape === "star") {
        drawStar(ctx, s * 0.55);
      } else if (p.shape === "ring") {
        ctx.lineWidth = Math.max(1.2, s * 0.16);
        ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2); ctx.stroke();
      } else {
        
        var r = s * 0.26, w = s * 0.95, h = s * 0.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r);
        else ctx.rect(-w / 2, -h / 2, w, h);
        ctx.fill();
      }
      ctx.restore();
    }

    if (parts.length) requestAnimationFrame(frame);
    else { running = false; ctx.clearRect(0, 0, W, H); }
  }

  
  var IGNORE = "input, textarea, select, canvas, #fxCanvas";

  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(IGNORE)) return;
    var el = e.target.closest && e.target.closest("a, button, .ProjectsSection-module__2qoIza__card, .GithubCard-module__CP3e5W__card, .TelegramCard-module__SQS1Ya__card, .page-module__E0kJGG__listRow");
    var power = el ? 1.25 : 0.7;
    var count = el ? 26 : 14;
    spawn(e.clientX, e.clientY, { count: count, power: power });

    
    if (el && !el.classList.contains("page-module__E0kJGG__listRow")) {
      el.classList.remove("jelly-press");
      void el.offsetWidth;
      el.classList.add("jelly-press");
      setTimeout(function () { el.classList.remove("jelly-press"); }, 620);
    }
  }, true);

  
  window.addEventListener("load", function () {
    if (!enabled || reduced) return;
    var h1 = document.querySelector("h1");
    if (!h1) return;
    var r = h1.getBoundingClientRect();
    setTimeout(function () {
      spawn(r.left + r.width / 2, r.top + r.height / 2, { count: 30, power: 0.9 });
    }, 260);
  });

  
  window.FX = {
    burst: spawn,
    setEnabled: function (on) {
      enabled = !!on;
      localStorage.setItem(LS_KEY, on ? "on" : "off");
      if (!on) { parts.length = 0; }
    },
    isEnabled: function () { return enabled; }
  };

  
  var toggleBound = false;
  function initToggle() {
    if (toggleBound) return;
    var btn = document.getElementById("particlesBtn");
    if (!btn) return;
    toggleBound = true;
    var sync = function () { btn.classList.toggle("TopBar-module__hfKmSa__active", enabled); };
    sync();
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      window.FX.setEnabled(!enabled);
      sync();
      if (enabled) {
        var r = btn.getBoundingClientRect();
        spawn(r.left + r.width / 2, r.top + r.height / 2, { count: 18, power: 0.8 });
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initToggle);
  else initToggle();
})();
