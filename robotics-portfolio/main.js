/* ==========================================================================
   Intelligence Designed To Evolve — count-up stats + mobile menu
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Stats count-up
     ------------------------------------------------------------------------ */

  var values = Array.prototype.slice.call(
    document.querySelectorAll(".stat-value")
  );

  function format(el, n) {
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var suffix = el.dataset.suffix || "";
    return n.toFixed(decimals) + suffix;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function countUp(el, index) {
    if (el.dataset.counted === "true") return;
    el.dataset.counted = "true";

    var target = parseFloat(el.dataset.target || "0");

    if (reduceMotion) {
      el.textContent = format(el, target);
      return;
    }

    var duration = 1500 + index * 80;
    var startDelay = 480 + index * 90;

    window.setTimeout(function () {
      var t0 = null;

      function frame(now) {
        if (t0 === null) t0 = now;
        var p = Math.min((now - t0) / duration, 1);
        el.textContent = format(el, target * easeOutCubic(p));
        if (p < 1) window.requestAnimationFrame(frame);
        else el.textContent = format(el, target);
      }

      window.requestAnimationFrame(frame);
    }, startDelay);
  }

  function startCounters() {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            countUp(el, values.indexOf(el));
            io.unobserve(el);
          });
        },
        { threshold: 0.25 }
      );

      values.forEach(function (el) {
        io.observe(el);
      });
    } else {
      values.forEach(countUp);
    }
  }

  /* When the loading screen is present, wait for it so the numbers are not
     already counted up by the time the page is revealed. */
  if (document.getElementById("loader")) {
    window.addEventListener("loader:done", startCounters, { once: true });
  } else {
    startCounters();
  }

  /* ------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------ */

  var burger = document.querySelector(".burger");
  var menu = document.getElementById("mobile-menu");
  var overlay = document.querySelector(".menu-overlay");

  if (burger && menu && overlay) {
    var openMenu = function () {
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Close menu");
      menu.hidden = false;
      overlay.hidden = false;
      document.body.classList.add("menu-open");
    };

    var closeMenu = function () {
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
      menu.hidden = true;
      overlay.hidden = true;
      document.body.classList.remove("menu-open");
    };

    var isOpen = function () {
      return burger.getAttribute("aria-expanded") === "true";
    };

    burger.addEventListener("click", function () {
      if (isOpen()) closeMenu();
      else openMenu();
    });

    overlay.addEventListener("click", closeMenu);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) closeMenu();
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 720 && isOpen()) closeMenu();
    });
  }
})();
