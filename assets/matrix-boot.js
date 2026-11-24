import { createRain } from "./matrix-rain.js";

const KEY = "rawumi.matrix";
const canvas = document.getElementById("rain");
const button = document.getElementById("matrixBtn");

const options = () => {
  const cs = getComputedStyle(document.documentElement);
  const ink = cs.getPropertyValue("--ink").trim() || "#e6e6e6";
  return {
    color: ink,
    glowColor: ink,
    fontSize: 13,
    lineHeight: 18,
    density: 1,
    speed: 0.9,
    interval: 90,
    decay: 0.95,
    radius: 150,
    glowDecay: 0.62,
    glowBrightness: 1,
    characters: "АИСДПЕЛХУЙ01<>=+*-#$",
    mask: true,
    pointer: true
  };
};

const enabled = () => localStorage.getItem(KEY) !== "off";

let rain = null;

function start() {
  if (!canvas || rain) return;
  canvas.hidden = false;
  rain = createRain(canvas, options());
}

function stop() {
  if (rain) {
    rain.destroy();
    rain = null;
  }
  if (canvas) canvas.hidden = true;
}

function syncButton() {
  if (button) button.setAttribute("aria-pressed", String(enabled()));
}

function apply() {
  if (enabled()) start();
  else stop();
  syncButton();
}

if (canvas) {
  apply();

  if (button) {
    button.addEventListener("click", () => {
      const next = !enabled();
      localStorage.setItem(KEY, next ? "on" : "off");
      apply();
    });
  }

  new MutationObserver(() => {
    if (!rain) return;
    stop();
    start();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!rain) return;
    stop();
    start();
  });
}

window.MATRIX = {
  isEnabled: enabled,
  enable: () => { localStorage.setItem(KEY, "on"); apply(); },
  disable: () => { localStorage.setItem(KEY, "off"); apply(); }
};
