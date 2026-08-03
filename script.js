/* ============================================================
   FINEXPERIA — Site interactions
   ============================================================ */
(function () {
  "use strict";

  /* ============================================================
     REGION CONTACT NUMBERS — EDIT HERE
     ------------------------------------------------------------
     To change a number, edit the entry below. Nothing else needs
     to change: the picker, detection and links all read from here.

       phone     what the visitor sees, and what tel: dials
       whatsapp  digits only, country code first, no + or spaces
       label     shown in the region picker

     All five regions are kept separate on purpose (design doc §5),
     so any one of them can be given its own number later.
     ============================================================ */
  var REGION_CONTACTS = {
    kerala:         { phone: "+91 80753 13751", whatsapp: "918075313751", label: "Kerala" },
    tamil_nadu:     { phone: "+91 95168 11111", whatsapp: "919516811111", label: "Tamil Nadu" },
    karnataka:      { phone: "+91 95168 11111", whatsapp: "919516811111", label: "Karnataka" },
    andhra_pradesh: { phone: "+91 95168 11111", whatsapp: "919516811111", label: "Andhra Pradesh" },
    other:          { phone: "+91 95168 11111", whatsapp: "919516811111", label: "Other" }
  };
  var REGION_DEFAULT = "other";      // shown before/if detection fails (design doc §7.3)
  var REGION_STORAGE_KEY = "fx-region";
  var REGION_WA_TEXT = "Finxeperia%20Demo";

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Scroll progress bar =====
  var scrollBar = document.querySelector(".scroll-bar");
  function updateScrollBar() {
    if (!scrollBar) return;
    var doc = document.documentElement;
    var pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
    scrollBar.style.width = Math.min(100, pct) + "%";
  }
  window.addEventListener("scroll", updateScrollBar, { passive: true });

  // ===== Nav pill scrolled state =====
  var navPill = document.querySelector(".nav-pill");
  function updateNav() {
    if (navPill) navPill.classList.toggle("scrolled", window.scrollY > 40);
  }
  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });

  // ===== Mobile nav toggle =====
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    header.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ===== Cursor glow =====
  var glow = document.querySelector(".cursor-glow");
  if (glow && window.matchMedia("(pointer: fine)").matches) {
    var gx = 0, gy = 0, cx = 0, cy = 0;
    document.addEventListener("mousemove", function (e) { gx = e.clientX; gy = e.clientY; }, { passive: true });
    function animGlow() {
      cx += (gx - cx) * 0.08;
      cy += (gy - cy) * 0.08;
      glow.style.transform = "translate(" + (cx - 210) + "px, " + (cy - 210) + "px)";
      requestAnimationFrame(animGlow);
    }
    animGlow();
  }

  // ===== Scroll reveal =====
  var revealEls = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");
  if ("IntersectionObserver" in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.dataset.delay || 0;
          setTimeout(function () { el.classList.add("in"); }, Number(delay));
          revealIO.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -48px 0px" });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // ===== Count-up for stats =====
  var statEls = document.querySelectorAll(".stat-n[data-target]");
  if (statEls.length && "IntersectionObserver" in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.dataset.target);
        var decimals = parseInt(el.dataset.decimal || "0", 10);
        var dur = 1600;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var prog = Math.min((ts - start) / dur, 1);
          var ease = 1 - Math.pow(1 - prog, 4);
          var val = target * ease;
          el.textContent = val.toFixed(decimals);
          if (prog < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        countIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    statEls.forEach(function (el) { countIO.observe(el); });
  }

  // ===== Web3Forms contact form =====
  var form = document.getElementById("contactForm");
  var submitBtn = document.getElementById("cfSubmit");
  var statusEl = document.getElementById("cfStatus");

  if (form && submitBtn && statusEl) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameField  = form.querySelector("[name='name']");
      var emailField = form.querySelector("[name='email']");
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((emailField ? emailField.value : "").trim());
      var nameOk  = nameField && nameField.value.trim().length > 0;

      if (!nameOk || !emailOk) {
        statusEl.textContent = "Please fill in your name and a valid email address.";
        statusEl.className = "cf-status err";
        return;
      }

      submitBtn.classList.add("loading");
      submitBtn.disabled = true;
      statusEl.textContent = "";
      statusEl.className = "cf-status";

      var data = {};
      new FormData(form).forEach(function (val, key) { data[key] = val; });

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json(); })
        .then(function (json) {
          submitBtn.classList.remove("loading");
          submitBtn.disabled = false;
          if (json.success) {
            statusEl.textContent = "Message sent! We'll get back to you soon.";
            statusEl.className = "cf-status ok";
            form.reset();
          } else {
            throw new Error(json.message || "Submission failed");
          }
        })
        .catch(function () {
          submitBtn.classList.remove("loading");
          submitBtn.disabled = false;
          statusEl.textContent = "Something went wrong. Please try again or call us directly.";
          statusEl.className = "cf-status err";
        });
    });
  }

  // ===== Lead magnet: "Download the syllabus" preselects the syllabus option =====
  document.querySelectorAll("[data-magnet]").forEach(function (el) {
    el.addEventListener("click", function () {
      var sel = document.getElementById("cf-track");
      if (sel) {
        for (var i = 0; i < sel.options.length; i++) {
          if (/brochure|syllabus|pricing/i.test(sel.options[i].text)) { sel.selectedIndex = i; break; }
        }
      }
      setTimeout(function () {
        var email = document.getElementById("cf-email");
        if (email) { try { email.focus({ preventScroll: true }); } catch (e) { email.focus(); } }
      }, 600);
    });
  });

  // ===== Sticky CTA bar — show after the hero, hide while the contact form is in view =====
  var stickyCta = document.getElementById("stickyCta");
  var contactSec = document.getElementById("contact");
  if (stickyCta) {
    var updateSticky = function () {
      var past = window.scrollY > window.innerHeight * 0.85;
      var nearContact = false;
      if (contactSec) {
        var r = contactSec.getBoundingClientRect();
        nearContact = r.top < window.innerHeight && r.bottom > 0;
      }
      stickyCta.classList.toggle("visible", past && !nearContact);
    };
    updateSticky();
    window.addEventListener("scroll", updateSticky, { passive: true });
    window.addEventListener("resize", updateSticky, { passive: true });
  }

  // ===== Interactive 28-week journey =====
  var jnodes = document.querySelectorAll(".jnode");
  var jpanels = document.querySelectorAll(".jpanel");
  if (jnodes.length && jpanels.length) {
    var showModule = function (idx) {
      jnodes.forEach(function (n) {
        var on = n.getAttribute("data-mod") === String(idx);
        n.classList.toggle("is-active", on);
        n.setAttribute("aria-selected", String(on));
      });
      jpanels.forEach(function (p) {
        p.hidden = p.getAttribute("data-mod") !== String(idx);
      });
    };
    jnodes.forEach(function (n) {
      n.addEventListener("click", function () {
        showModule(Number(n.getAttribute("data-mod")));
      });
    });
  }

  // ===== Region-based contact number =====
  // Design doc: finexperia-region-contact-feature.md
  // Order of precedence: saved manual choice > IP detection > REGION_DEFAULT.
  // A saved choice skips the lookup entirely — it respects the visitor and
  // spends fewer of the free daily lookups.
  var regionSelect = document.getElementById("regionSelect");
  var regionPhone = document.getElementById("regionPhone");
  var regionWhatsapp = document.getElementById("regionWhatsapp");
  var regionHint = document.getElementById("regionHint");

  // Guard: script.js also loads on about.html, which has no contact block.
  if (regionSelect && regionPhone && regionWhatsapp) {

    // localStorage throws in some private-browsing modes — never let that break the page.
    var regionStore = {
      get: function () {
        try { return window.localStorage.getItem(REGION_STORAGE_KEY); } catch (e) { return null; }
      },
      set: function (v) {
        try { window.localStorage.setItem(REGION_STORAGE_KEY, v); } catch (e) { /* ignore */ }
      }
    };

    var setHint = function (msg) {
      if (regionHint) regionHint.textContent = msg;
    };

    var applyRegion = function (key) {
      var c = REGION_CONTACTS[key] || REGION_CONTACTS[REGION_DEFAULT];
      regionPhone.textContent = c.phone;
      regionPhone.setAttribute("href", "tel:" + c.phone.replace(/[^\d+]/g, ""));
      regionWhatsapp.setAttribute("href", "https://wa.me/" + c.whatsapp + "?text=" + REGION_WA_TEXT);
      if (regionSelect.value !== key) regionSelect.value = key;
    };

    // Map whatever the lookup service calls the region onto our keys.
    var matchRegion = function (data) {
      if (!data || data.success === false) return null;
      if (data.country_code && data.country_code !== "IN") return "other";
      var r = String(data.region || "").toLowerCase();
      if (r.indexOf("kerala") > -1) return "kerala";
      if (r.indexOf("tamil") > -1) return "tamil_nadu";
      if (r.indexOf("karnataka") > -1) return "karnataka";
      if (r.indexOf("andhra") > -1) return "andhra_pradesh";
      return "other";
    };

    // Visitor already told us who they are — use it, don't second-guess them.
    var saved = regionStore.get();
    if (saved && REGION_CONTACTS[saved]) {
      applyRegion(saved);
      setHint("Showing your saved region. Change it any time.");
    } else {
      applyRegion(REGION_DEFAULT);
      setHint("Detecting your region…");

      // Abort a slow lookup rather than leave the hint hanging.
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = window.setTimeout(function () { if (ctrl) ctrl.abort(); }, 4000);

      fetch("https://ipwho.is/?fields=success,country_code,region", ctrl ? { signal: ctrl.signal } : undefined)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          window.clearTimeout(timer);
          var key = matchRegion(data);
          if (key) {
            applyRegion(key);
            setHint("Detected " + REGION_CONTACTS[key].label + " — not right? Change it above.");
          } else {
            setHint("Not your region? Choose it above.");
          }
        })
        .catch(function () {
          // Offline, blocked, rate-limited or timed out — the default stands.
          window.clearTimeout(timer);
          setHint("Not your region? Choose it above.");
        });
    }

    regionSelect.addEventListener("change", function () {
      applyRegion(regionSelect.value);
      regionStore.set(regionSelect.value);
      setHint("Saved — we'll show " + (REGION_CONTACTS[regionSelect.value] || {}).label + " next time.");
    });
  }

})();
