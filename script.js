/* Camomille homepage — interactions */
(function () {
  "use strict";

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* nav: shadow on scroll */
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* scroll reveal */
  var reveal = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add("in"); });
  }

  /* leasing calculators — one engine drives the hero mini + the pricing full one */
  var FR = document.documentElement.lang === "fr";
  function money(n) { n = Math.round(n); return FR ? n.toLocaleString("fr-FR") + " €" : "€" + n.toLocaleString("en-US"); }
  var T = FR ? {
    oneTimeUnit: " une fois", monthUnit: " / mois",
    allIn: function (m) { return "pendant " + m + " mois, tout compris"; },
    afterBuild: function (c) { return "après une création unique de " + c; },
    termMonths: function (m) { return "pendant " + m + " mois"; },
    oneTimeTerm: "création unique"
  } : {
    oneTimeUnit: " one-time", monthUnit: " / month",
    allIn: function (m) { return "for " + m + " months, all in"; },
    afterBuild: function (c) { return "after a " + c + " one-time build"; },
    termMonths: function (m) { return "for " + m + " months"; },
    oneTimeTerm: "one-time build"
  };

  function initCalc(root) {
    var range = root.querySelector(".calc-range");
    var terms = root.querySelector(".calc-terms");
    if (!range || !terms) return;
    var def = range.getAttribute("value");      // ignore any browser-restored value
    if (def !== null) range.value = def;
    var termButtons = terms.querySelectorAll("button[data-m]");
    var groups = root.querySelectorAll(".calc-group");
    var MIN = 1500;
    var months = 12;
    var sel = terms.querySelector("button.is-on");
    if (sel) months = +sel.dataset.m;

    function set(cls, txt) { var el = root.querySelector("." + cls); if (el) el.textContent = txt; }
    function care() {
      var t = 0;
      groups.forEach(function (g) { var o = g.querySelector(".opt.is-on"); if (o) t += +o.dataset.price; });
      return t;
    }
    function gate(cost) {
      termButtons.forEach(function (b) { var m = +b.dataset.m; b.disabled = !(m === 0 || cost >= MIN * m); });
      var cur = terms.querySelector('button[data-m="' + months + '"]');
      if (cur && cur.disabled) {
        var en = [];
        termButtons.forEach(function (b) { if (!b.disabled) en.push(+b.dataset.m); });
        var pick = null;
        en.forEach(function (m) { if (m !== 0 && m <= months && (pick === null || m > pick)) pick = m; });
        if (pick === null) en.forEach(function (m) { if (m !== 0 && (pick === null || m > pick)) pick = m; });
        if (pick === null) pick = 0;
        months = pick;
        termButtons.forEach(function (b) { b.classList.toggle("is-on", +b.dataset.m === months); });
      }
    }
    function update() {
      var cost = +range.value;
      range.style.setProperty("--p", (((cost - range.min) / (range.max - range.min)) * 100).toFixed(1) + "%");
      gate(cost);
      set("js-cost", money(cost));
      var c = care();
      if (months === 0) {
        set("js-build", money(cost)); set("js-buildunit", T.oneTimeUnit);
        set("js-total", money(c)); set("js-totalunit", T.monthUnit);
        set("js-totalsub", T.afterBuild(money(cost)));
        set("js-term", T.oneTimeTerm);
      } else {
        var build = Math.max(MIN, Math.round(cost / months / 50) * 50);
        set("js-build", money(build)); set("js-buildunit", T.monthUnit);
        set("js-total", money(build + c)); set("js-totalunit", T.monthUnit);
        set("js-totalsub", T.allIn(months));
        set("js-term", T.termMonths(months));
      }
    }

    range.addEventListener("input", update);
    terms.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-m]");
      if (!b || b.disabled) return;
      months = +b.dataset.m;
      termButtons.forEach(function (x) { x.classList.toggle("is-on", x === b); });
      update();
    });
    groups.forEach(function (g) {
      g.addEventListener("click", function (e) {
        var o = e.target.closest(".opt");
        if (!o) return;
        g.querySelectorAll(".opt").forEach(function (x) { x.classList.toggle("is-on", x === o); });
        update();
      });
    });

    update();
    // Chrome restores slider values on reload after init runs; re-assert the default afterwards.
    window.addEventListener("pageshow", function () { if (def !== null) range.value = def; update(); });
  }

  document.querySelectorAll("[data-calc]").forEach(initCalc);

  /* scrollspy: one-page nav follows the sections as you scroll */
  var navLinkFor = {};
  document.querySelectorAll(".nav-link").forEach(function (a) {
    var id = a.getAttribute("href").replace("#", "");
    if (id) navLinkFor[id] = a;
  });
  var secWork = document.getElementById("work");
  var secPricing = document.getElementById("pricing");
  function topOf(el) { return el ? el.getBoundingClientRect().top + window.scrollY : Infinity; }
  function spy() {
    var pos = window.scrollY + window.innerHeight * 0.35;
    var cur = "top";
    if (pos >= topOf(secWork)) cur = "work";
    if (pos >= topOf(secPricing)) cur = "pricing";
    Object.keys(navLinkFor).forEach(function (k) {
      navLinkFor[k].classList.toggle("is-active", k === cur);
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  window.addEventListener("resize", spy);
  window.addEventListener("load", spy);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(spy);
  spy();
})();
