/* Enoida — shared page behaviour.
   Every block is guarded by the presence of the elements it drives, so one file serves both
   the landing pages and the notes without either needing to know what the other contains. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------ theme */
  /* The initial value is applied by a tiny inline script in the document head — before first
     paint, so a dark-theme visitor never sees a white flash. This only wires the control. */
  var THEMES = ["light", "dark", "system"];

  function currentTheme() {
    var stored = null;
    try { stored = localStorage.getItem("enoida-theme"); } catch (e) { /* private mode */ }
    return THEMES.indexOf(stored) === -1 ? "system" : stored;
  }

  function applyTheme(choice) {
    // "system" removes the attribute entirely rather than setting a third value: the CSS
    // resolves the system preference through the media query, so absence IS the system choice.
    if (choice === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", choice);
    }
    try { localStorage.setItem("enoida-theme", choice); } catch (e) { /* private mode */ }
  }

  var themeGroup = document.querySelector("[data-theme-picker]");
  if (themeGroup) {
    var buttons = Array.prototype.slice.call(themeGroup.querySelectorAll("[data-theme-value]"));

    function paint(choice) {
      buttons.forEach(function (b) {
        var on = b.getAttribute("data-theme-value") === choice;
        b.setAttribute("aria-checked", on ? "true" : "false");
        // Roving tabindex: the group is one tab stop, arrow keys move within it.
        b.tabIndex = on ? 0 : -1;
      });
    }

    buttons.forEach(function (b, i) {
      b.addEventListener("click", function () {
        var choice = b.getAttribute("data-theme-value");
        applyTheme(choice);
        paint(choice);
      });
      b.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        var step = e.key === "ArrowRight" ? 1 : -1;
        var next = buttons[(i + step + buttons.length) % buttons.length];
        var choice = next.getAttribute("data-theme-value");
        applyTheme(choice);
        paint(choice);
        next.focus();
      });
    });

    paint(currentTheme());
  }

  /* ----------------------------------------------------- sticky header rule */
  var topbar = document.getElementById("topbar");
  if (topbar) {
    var onScroll = function () {
      topbar.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------- scroll reveals */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    if (reduced.matches || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("shown"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("shown");
          io.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------- the disclosure figure */
  var panel = document.getElementById("panel");
  var fieldList = document.getElementById("fields");
  if (panel && fieldList) {
    var state = document.getElementById("panel-state");
    var foot = document.getElementById("foot-text");
    var replay = document.getElementById("replay");
    var fields = Array.prototype.slice.call(fieldList.querySelectorAll(".field"));
    var shed = fields.filter(function (f) { return f.dataset.hold === "false"; });
    var timers = [];

    // The two end-state strings live on the element rather than in this file, so the French
    // and English pages can differ without forking the script.
    var doneState = panel.getAttribute("data-done-state") || "Sent to the site";
    var doneFoot = panel.getAttribute("data-done-foot") || "";
    var liveState = panel.getAttribute("data-live-state") || "Disclosing";
    var liveFoot = panel.getAttribute("data-live-foot") || "";

    var clearTimers = function () { timers.forEach(clearTimeout); timers = []; };
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };

    var settle = function () {
      shed.forEach(function (f) { f.dataset.state = "gone"; });
      if (state) state.textContent = doneState;
      if (foot) foot.textContent = doneFoot;
      if (replay) replay.hidden = reduced.matches;
    };

    var play = function () {
      clearTimers();
      panel.classList.add("animate");
      if (state) state.textContent = liveState;
      if (foot) foot.textContent = liveFoot;
      if (replay) replay.hidden = true;

      fields.forEach(function (f) { f.dataset.state = "pending"; });
      fields.forEach(function (f, i) {
        later(function () { f.dataset.state = "in"; }, 90 * i + 220);
      });

      var afterIn = 90 * fields.length + 620;
      shed.forEach(function (f, i) {
        later(function () { f.dataset.state = "gone"; }, afterIn + 150 * i);
      });
      later(function () {
        if (state) state.textContent = doneState;
        if (foot) foot.textContent = doneFoot;
        if (replay) replay.hidden = false;
      }, afterIn + 150 * shed.length + 420);
    };

    if (reduced.matches) {
      settle();
    } else if ("IntersectionObserver" in window) {
      var pio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          pio.disconnect();
          play();
        });
      }, { threshold: 0.35 });
      pio.observe(panel);
    } else {
      play();
    }

    if (replay) replay.addEventListener("click", play);
    reduced.addEventListener("change", function (e) {
      if (e.matches) { clearTimers(); panel.classList.remove("animate"); settle(); }
    });
  }
})();
