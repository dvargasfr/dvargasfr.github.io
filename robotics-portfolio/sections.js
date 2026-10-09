/* ==========================================================================
   Scroll content behaviour — loader, HLS backgrounds, GSAP entrance +
   parallax, in-view reveals, 3D project helix, marquee, modal, nav.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var hasGsap = typeof window.gsap !== "undefined";
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ======================================================================
     Section 1 — Loading screen
     ====================================================================== */

  function initLoader(done) {
    var loader = $("#loader");
    if (!loader) return done();

    var countEl = $("#loader-count");
    var barEl = $("#loader-bar");
    var wordEl = $("#loader-word");
    var words = ["Robótica", "IA", "Innovación"];
    var wordIndex = 0;

    var wordTimer = window.setInterval(function () {
      wordEl.classList.add("is-out");
      window.setTimeout(function () {
        wordIndex = (wordIndex + 1) % words.length;
        wordEl.textContent = words[wordIndex];
        wordEl.classList.remove("is-out");
        /* restart the enter animation */
        wordEl.style.animation = "none";
        void wordEl.offsetWidth;
        wordEl.style.animation = "";
      }, 250);
    }, 900);

    var DURATION = 2700;
    var t0 = null;

    function finish() {
      window.clearInterval(wordTimer);
      window.setTimeout(function () {
        loader.classList.add("is-done");
        done();
        window.setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 600);
      }, 400);
    }

    function tick(now) {
      if (t0 === null) t0 = now;
      var p = Math.min((now - t0) / DURATION, 1);
      var count = Math.floor(p * 100);
      countEl.textContent = String(count).padStart(3, "0");
      barEl.style.transform = "scaleX(" + p + ")";
      if (p < 1) window.requestAnimationFrame(tick);
      else finish();
    }

    window.requestAnimationFrame(tick);
  }

  /* ======================================================================
     whileInView reveals (Framer Motion equivalent)
     ====================================================================== */

  var revealIO = null;

  function observeReveal(el) {
    if (revealIO) revealIO.observe(el);
    else el.classList.add("is-in");
  }

  function initReveals() {
    if (!reduceMotion && "IntersectionObserver" in window) {
      revealIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-in");
            revealIO.unobserve(e.target);
          });
        },
        { rootMargin: "0px 0px -100px 0px", threshold: 0 }
      );
    }

    $$(".rv").forEach(observeReveal);
  }

  /* ======================================================================
     Projects — 3D scroll helix (all projects from the portfolio data.json)

     Same construction as a CSS spiral gallery: every card is rotated a fixed
     step around the Y axis, pushed out by the radius and dropped one step
     lower. A sticky stage holds the helix; scrolling rotates the whole helix
     and lifts it so each project comes to the front in turn.
     ====================================================================== */

  var DATA_URL = "data.json";
  var IMG_DIR = "assets/img/portfolio/";

  /* Images listed in data.json are looked up as resized JPEGs first
     (<IMG_DIR>/<name>.jpg, thumbnails in <IMG_DIR>/thumbs/<name>.jpg); if that
     file doesn't exist the original file name from data.json is used as-is. */
  function imgName(name) {
    return name.replace(/\.\w+$/, ".jpg");
  }

  /* <img> tag that falls back to the original file if the .jpg is missing */
  function imgTag(src, fallback, alt, extra) {
    return (
      '<img src="' + src + '" data-fb="' + fallback + '" alt="' + alt + '" ' +
      (extra || "") +
      " onerror=\"if(this.dataset.fb&&this.src.indexOf(this.dataset.fb)<0){this.src=this.dataset.fb}\" />"
    );
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function initProjects() {
    var section = $("#experience");
    var helix = $("#hx-helix");
    if (!section || !helix) return;

    var stage = $(".hx-stage", section);
    var info = $(".hx-info", section);
    var yearEl = $(".hx-year", section);
    var barEl = $(".hx-progress span", section);
    var sortBtns = $$(".hx-sort-btn", section);

    var STEP = 36; /* degrees between cards: 10 per turn */
    var PER_ITEM = 0.3; /* viewport heights of scroll per project */

    var data = null;
    var projects = [];
    var cards = [];
    var order = "desc";
    var geo = { w: 300, h: 225, r: 520, dy: 110 };
    var target = 0;
    var current = 0;
    var active = -1;
    var ticking = false;
    var isStatic = reduceMotion;

    if (isStatic) section.classList.add("is-static");

    /* Flatten jobs -> one ordered list of projects */
    function buildList() {
      var list = [];
      Object.keys(data).forEach(function (role) {
        var job = data[role];
        job.proyectos.forEach(function (p) {
          list.push({
            role: role,
            company: job.empresa,
            period: job.periodo,
            title: p.titulo,
            date: p.fecha,
            id: p.id,
            desc: p.desc,
            image: p.imagen || null,
            video: p.video_id || null,
          });
        });
      });
      list.sort(function (a, b) {
        return order === "desc" ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
      });
      return list;
    }

    function thumbOf(p) {
      if (p.image) return IMG_DIR + "thumbs/" + imgName(p.image);
      if (p.video) return "https://i.ytimg.com/vi/" + p.video + "/hqdefault.jpg";
      return null;
    }

    function cardHtml(p, i) {
      var thumb = thumbOf(p);
      var face = thumb
        ? imgTag(thumb, p.image ? IMG_DIR + p.image : "", "", 'loading="lazy" decoding="async"') +
          (p.video ? '<span class="hx-play" aria-hidden="true">&#9654;</span>' : "")
        : '<span class="hx-ph"><span class="hx-ph-year">' + p.id.slice(0, 4) +
          '</span><span class="hx-ph-title">' + escapeHtml(p.title) +
          '</span><span class="hx-ph-co">' + escapeHtml(p.company) + "</span></span>";

      return (
        '<button type="button" class="hx-card" data-i="' + i + '" aria-label="' +
        escapeHtml(p.title + " — " + p.date) + '">' +
        '<span class="hx-face">' + face + "</span>" +
        '<span class="hx-cap"><span>' + escapeHtml(p.date) + "</span>" +
        escapeHtml(p.title) + "</span>" +
        "</button>"
      );
    }

    function measure() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var mobile = vw < 760;
      var w = mobile ? Math.min(Math.max(vw * 0.5, 170), 260) : Math.min(Math.max(vw * 0.21, 220), 340);

      /* Desktop: centre the helix in the space between the text column and
         the right edge of the frame, and keep its side cards inside it */
      if (mobile) {
        section.style.removeProperty("--hx-x");
      } else {
        var frameX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--frame-x")) || 0;
        var sideRight = frameX + Math.min(460, vw * 0.36);
        var avail = vw - frameX - sideRight;
        section.style.setProperty("--hx-x", Math.round(sideRight + avail / 2) + "px");
        w = Math.max(Math.min(w, avail / 3.2), 180);
      }
      var h = Math.round(w * 0.72);
      geo = {
        w: Math.round(w),
        h: h,
        /* chord between neighbours (2r·sin(step/2)) must clear the card */
        r: Math.round((w * 1.12) / (2 * Math.sin((STEP / 2) * (Math.PI / 180)))),
        dy: Math.round(h * 0.42),
      };
      helix.style.setProperty("--w", geo.w + "px");
      helix.style.setProperty("--h", geo.h + "px");
      stage.style.perspective = Math.round(geo.r * 2.4) + "px";

      if (!isStatic) {
        section.style.height =
          Math.round(vh + Math.max(projects.length - 1, 0) * vh * PER_ITEM) + "px";
      }

      cards.forEach(function (card, i) {
        card.style.transform = isStatic
          ? ""
          : "rotateY(" + i * STEP + "deg) translate3d(0," + i * geo.dy + "px," + geo.r + "px)";
      });
    }

    function render() {
      projects = buildList();
      helix.innerHTML = projects.map(cardHtml).join("");
      cards = $$(".hx-card", helix);
      active = -1;
      measure();
      readScroll();
      current = target;
      update();
      if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
    }

    function setInfo(i) {
      var p = projects[i];
      if (!p || !info) return;
      info.classList.remove("is-in");
      void info.offsetWidth;
      $(".hx-count", info).textContent =
        String(i + 1).padStart(2, "0") + " / " + String(projects.length).padStart(2, "0");
      $(".hx-role", info).textContent = p.role + " · " + p.company;
      $(".hx-title", info).textContent = p.title;
      $(".hx-date", info).textContent = p.date;
      $(".hx-desc", info).textContent = p.desc;
      $(".hx-open", info).dataset.i = i;
      info.classList.add("is-in");
      if (yearEl) yearEl.textContent = p.id.slice(0, 4);
      cards.forEach(function (c, k) {
        c.classList.toggle("is-active", k === i);
      });
    }

    function update() {
      var n = projects.length;
      if (!n || isStatic) return;
      var pos = current * (n - 1); /* fractional index at the front */
      var rot = pos * STEP;
      var lift = pos * geo.dy;
      helix.style.transform =
        "translate3d(0," + -lift + "px," + -geo.r + "px) rotateY(" + -rot + "deg)";

      var span = window.innerHeight * 0.75;
      cards.forEach(function (card, i) {
        var facing = (Math.cos(((i - pos) * STEP * Math.PI) / 180) + 1) / 2;
        var vy = Math.abs((i - pos) * geo.dy) / span;
        var o = (0.12 + 0.88 * Math.pow(facing, 1.6)) * Math.max(0, 1 - vy * vy);
        card.style.opacity = o.toFixed(3);
        card.style.pointerEvents = o > 0.35 ? "auto" : "none";
      });

      if (barEl) barEl.style.transform = "scaleX(" + current + ")";
      var idx = Math.round(pos);
      if (idx !== active) {
        active = idx;
        setInfo(idx);
      }
    }

    function readScroll() {
      var total = section.offsetHeight - window.innerHeight;
      var top = section.getBoundingClientRect().top;
      target = total > 0 ? Math.min(Math.max(-top / total, 0), 1) : 0;
    }

    /* Smoothed scroll follow (eases the helix towards the scroll target) */
    function loop() {
      var d = target - current;
      current = Math.abs(d) < 0.0002 ? target : current + d * 0.12;
      update();
      if (current !== target) window.requestAnimationFrame(loop);
      else ticking = false;
    }

    function onScroll() {
      if (isStatic || !projects.length) return;
      readScroll();
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(loop);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      measure();
      onScroll();
    });

    /* Jump the page so project i sits at the front */
    function scrollToProject(i) {
      var total = section.offsetHeight - window.innerHeight;
      var y = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: y + (total * i) / Math.max(projects.length - 1, 1),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }

    helix.addEventListener("click", function (e) {
      var card = e.target.closest ? e.target.closest(".hx-card") : null;
      if (!card) return;
      var i = +card.dataset.i;
      if (isStatic || i === active) openModal(i);
      else scrollToProject(i);
    });

    var openBtn = $(".hx-open", section);
    if (openBtn) {
      openBtn.addEventListener("click", function () {
        openModal(+openBtn.dataset.i || 0);
      });
    }

    sortBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.dataset.order === order || !data) return;
        order = btn.dataset.order;
        sortBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-checked", String(on));
        });
        render();
      });
    });

    /* ---------- Project modal ---------- */

    var modal = $("#pj-modal");
    var modalIndex = 0;
    var lastFocus = null;

    function fillModal(i) {
      var p = projects[i];
      if (!p) return;
      modalIndex = i;
      var media = $(".pj-media", modal);
      if (p.video) {
        media.innerHTML =
          '<div class="pj-video"><iframe src="https://www.youtube.com/embed/' + p.video +
          '" title="' + escapeHtml(p.title) +
          '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
      } else if (p.image) {
        media.innerHTML = imgTag(IMG_DIR + imgName(p.image), IMG_DIR + p.image, escapeHtml(p.title));
      } else {
        media.innerHTML = "";
      }
      media.hidden = !p.video && !p.image;
      $(".pj-meta", modal).textContent = p.role + " · " + p.company;
      $(".pj-title", modal).textContent = p.title;
      $(".pj-date", modal).textContent =
        p.date + " · " + (i + 1) + " / " + projects.length;
      $(".pj-desc", modal).textContent = p.desc;
    }

    function openModal(i) {
      if (!modal || !projects[i]) return;
      lastFocus = document.activeElement;
      fillModal(i);
      modal.hidden = false;
      void modal.offsetWidth;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      $(".pj-close", modal).focus();
    }

    function closeModal() {
      if (!modal || modal.hidden) return;
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      $(".pj-media", modal).innerHTML = ""; /* stops any playing video */
      window.setTimeout(function () {
        modal.hidden = true;
      }, 300);
      if (!isStatic) scrollToProject(modalIndex);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    function stepModal(d) {
      var n = projects.length;
      fillModal((modalIndex + d + n) % n);
    }

    if (modal) {
      $(".pj-close", modal).addEventListener("click", closeModal);
      $(".pj-backdrop", modal).addEventListener("click", closeModal);
      $(".pj-prev", modal).addEventListener("click", function () {
        stepModal(-1);
      });
      $(".pj-next", modal).addEventListener("click", function () {
        stepModal(1);
      });
      document.addEventListener("keydown", function (e) {
        if (modal.hidden) return;
        if (e.key === "Escape") closeModal();
        else if (e.key === "ArrowLeft") stepModal(-1);
        else if (e.key === "ArrowRight") stepModal(1);
      });
    }

    function useData(json) {
      data = json;
      render();
    }

    var bundled = window.PORTFOLIO_DATA || null;

    /* Prefer the live data.json (single source of truth when served from
       the repo root); fall back to the bundled copy when it can't be fetched
       (file://, or a server rooted at this folder). */
    if (location.protocol === "file:" && bundled) {
      useData(bundled);
    } else {
      fetch(DATA_URL)
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          return res.json();
        })
        .then(useData)
        .catch(function (err) {
          if (bundled) return useData(bundled);
          console.error("Error:", err);
          helix.innerHTML = '<p class="hx-error">Error al cargar datos.</p>';
        });
    }
  }

  /* ======================================================================
     Legibility — first screen fades out, scroll frame contracts in
     ====================================================================== */

  function initFrame() {
    var frame = $(".scroll-frame");
    var page = $(".page");
    var content = $(".scroll-content");
    if (!frame || !content) return;

    /* Frame side inset: content width (1200) + breathing room, never less
       than the CSS gutter */
    var setInset = function () {
      var x = Math.max((window.innerWidth - 1320) / 2, Math.min(48, window.innerWidth * 0.03), 10);
      document.documentElement.style.setProperty("--frame-x", x + "px");
    };
    setInset();
    window.addEventListener("resize", setInset);

    if (!hasGsap || !window.ScrollTrigger || reduceMotion) return;

    gsap.fromTo(
      frame,
      { "--fp": 0 },
      {
        "--fp": 1,
        ease: "none",
        scrollTrigger: {
          trigger: content,
          start: "top bottom",
          end: "top 15%",
          scrub: 0.4,
        },
      }
    );

    /* Hero copy leaves before it can drift over the bright top of the video */
    if (page) {
      gsap.to(page, {
        opacity: 0,
        y: -80,
        scale: 0.97,
        ease: "none",
        scrollTrigger: {
          trigger: page,
          start: "top top",
          end: "60% top",
          scrub: 0.3,
        },
      });
    }
  }

  /* ======================================================================
     Section 7 — Marquee
     ====================================================================== */

  function initMarquee() {
    var track = $("#marquee-track");
    if (!track) return;

    var phrase = "ROBÓTICA • IA • XR • I+D • INNOVACIÓN • ";
    var run = new Array(10).fill(phrase).join("");

    track.innerHTML = "";
    for (var i = 0; i < 2; i++) {
      var span = document.createElement("span");
      span.textContent = run;
      track.appendChild(span);
    }

    if (!hasGsap || reduceMotion) return;

    gsap.to(track, {
      xPercent: -50,
      duration: 140,
      ease: "none",
      repeat: -1,
    });
  }

  /* ======================================================================
     Navbar — visibility, shadow, active link, smooth scrolling
     ====================================================================== */

  function initNav() {
    var nav = $("#site-nav");

    /* Smooth scroll for every in-page jump link */
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest("a[data-scroll]") : null;
      if (!link) return;
      var target = link.getAttribute("data-scroll");
      e.preventDefault();
      if (target === "top") {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }
      var el = document.getElementById(target);
      if (el)
        el.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
    });

    if (!nav) return;

    var onScroll = function () {
      var y = window.scrollY || window.pageYOffset;
      nav.classList.toggle("is-visible", y > window.innerHeight * 0.55);
      nav.classList.toggle("is-stuck", y > 100);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Active link follows the section in view */
    var links = $$(".site-nav-link, .site-nav-hi", nav);
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute("data-scroll");
      if (id && id !== "top") map[id] = l;
    });

    var watched = Object.keys(map)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    if (!watched.length || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (l) {
            l.classList.remove("is-active");
          });
          var active = map[e.target.id];
          if (active) active.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );

    watched.forEach(function (el) {
      io.observe(el);
    });

    /* Back at the very top, Home is active again */
    window.addEventListener(
      "scroll",
      function () {
        if ((window.scrollY || 0) < window.innerHeight * 0.5) {
          links.forEach(function (l) {
            l.classList.toggle("is-active", l.getAttribute("data-scroll") === "top");
          });
        }
      },
      { passive: true }
    );
  }

  /* ======================================================================
     Boot
     ====================================================================== */

  document.body.classList.add("is-loading");

  initReveals();
  initFrame();
  initProjects();
  initMarquee();
  initNav();

  initLoader(function () {
    document.body.classList.remove("is-loading");
    window.dispatchEvent(new CustomEvent("loader:done"));
    if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
  });

  window.addEventListener("load", function () {
    if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
