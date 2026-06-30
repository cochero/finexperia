/* ============================================================
   FINEXPERIA — Site interactions
   ============================================================ */
(function () {
  "use strict";

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

})();
