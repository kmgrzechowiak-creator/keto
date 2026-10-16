/* KetoBoomers.pl - drobne funkcje strony. Bez zależności. */
(() => {
  "use strict";

  const C = window.KETO_CONFIG || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.body.dataset.root || "";

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* tryb prywatny */ }
    }
  };

  /* ---------- Menu mobilne ---------- */
  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  }

  /* ---------- Cień nagłówka po przewinięciu ---------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Delikatne wjazdy sekcji przy przewijaniu ---------- */
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const all = $$(".hero-grid > *, .section-head, .split > *, .grid > *, .trust-item, .steps li, .faq details, .signup-card, .guarantee, .offer-box, .callout, .quote, .empty-state");
    const targets = all.filter((el) => !all.some((other) => other !== el && other.contains(el))); // tylko zewnętrzne
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px", threshold: 0.05 });
    targets.forEach((el) => {
      const index = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty("--d", Math.min(index, 5) * 0.08 + "s");
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  /* ---------- Filtr kategorii na liście wpisów ---------- */
  $$(".chips[data-filterable]").forEach((list) => {
    const cards = $$(".post-card");
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      $$("[data-filter]", list).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      cards.forEach((card) => { card.hidden = !!btn.dataset.filter && card.dataset.cat !== btn.dataset.filter; });
    });
  });

  /* ---------- Karuzela ebooków (pierścień 3D) ---------- */
  $$("[data-carousel]").forEach((root) => {
    const stage = $(".carousel-stage", root);
    const ring = $(".carousel-ring", root);
    const books = $$(".book", root);
    const infos = $$(".info-item", root);
    const dots = $$(".carousel-dots button", root);
    const n = books.length;
    if (!n || !stage || !(window.CSS && CSS.supports("transform-style", "preserve-3d"))) return;

    const step = 360 / n;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let angle = 0;
    let active = 0;
    let timer = null;
    let stopped = false;
    let visible = true;
    let moved = false;

    root.classList.add("is-3d");
    $$("a, img", ring).forEach((el) => el.setAttribute("draggable", "false"));
    stage.tabIndex = 0;
    stage.setAttribute("role", "group");

    const setRadius = () => {
      const w = ring.offsetWidth || 236;
      const radius = (w / 2) / Math.tan(Math.PI / n) * 1.5 + w * 0.1;
      root.style.setProperty("--r", radius.toFixed(1) + "px");
    };
    const paint = () => root.style.setProperty("--rot", (-angle).toFixed(2) + "deg");
    const modN = (v) => ((v % n) + n) % n;

    const show = () => {
      books.forEach((b, i) => {
        b.classList.toggle("is-active", i === active);
        const a = $("a", b);
        if (a) a.tabIndex = i === active ? 0 : -1;
      });
      infos.forEach((el, i) => { el.hidden = i !== active; });
      dots.forEach((d, i) => d.setAttribute("aria-current", i === active ? "true" : "false"));
    };
    const goTo = (i) => {
      const target = modN(i);
      let delta = modN(target - active);
      if (delta > n / 2) delta -= n;
      angle += delta * step;
      active = target;
      paint();
      show();
    };
    const stop = () => { stopped = true; if (timer) { clearInterval(timer); timer = null; } };
    const play = () => {
      if (reduce || stopped || timer || !visible) return;
      timer = setInterval(() => goTo(active + 1), 5200);
    };
    const pause = () => { if (timer) { clearInterval(timer); timer = null; } };
    const interact = () => stop();

    $(".carousel-btn--prev", root).addEventListener("click", () => { interact(); goTo(active - 1); });
    $(".carousel-btn--next", root).addEventListener("click", () => { interact(); goTo(active + 1); });
    dots.forEach((d) => d.addEventListener("click", () => { interact(); goTo(Number(d.dataset.go)); }));
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); interact(); goTo(active - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); interact(); goTo(active + 1); }
    });

    // kliknięcie okładki: nieaktywna obraca się do przodu, aktywna otwiera link
    ring.addEventListener("click", (e) => {
      const book = e.target.closest(".book");
      if (!book) return;
      if (moved) { e.preventDefault(); return; }
      const i = Number(book.dataset.index);
      if (i !== active) { e.preventDefault(); interact(); goTo(i); }
    });

    // przeciąganie myszą i palcem
    let startX = 0;
    let startAngle = 0;
    let dragging = false;
    stage.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = false; startX = e.clientX; startAngle = angle;
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6 && !moved) {
        moved = true; root.classList.add("is-dragging"); interact();
        if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignoruj */ } }
      }
      if (moved) { angle = startAngle - dx * 0.32; paint(); }
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        root.classList.remove("is-dragging");
        const idx = Math.round(angle / step);
        active = modN(idx);
        angle = idx * step;
        paint(); show();
        setTimeout(() => { moved = false; }, 60);
      }
    };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", play);
    root.addEventListener("focusin", () => { pause(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) play(); else pause();
      }, { threshold: 0.35 }).observe(root);
    }
    window.addEventListener("resize", setRadius);
    setRadius(); show(); paint(); play();
  });

  /* ---------- Dane z config.js ---------- */
  if (C.email) {
    $$("[data-email]").forEach((el) => {
      el.textContent = C.email;
      if (el.tagName === "A") el.href = "mailto:" + C.email;
    });
  }
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Produkt „wkrótce" / „w sprzedaży" ---------- */
  const checkout = C.checkout || {};
  $$("[data-live-for]").forEach((el) => { el.hidden = !checkout[el.dataset.liveFor]; });
  $$("[data-soon-for]").forEach((el) => { el.hidden = !!checkout[el.dataset.soonFor]; });
  $$("a[data-checkout]").forEach((a) => {
    const url = checkout[a.dataset.checkout];
    if (!url) return;
    a.href = url;
    a.rel = "noopener";
    if (a.dataset.buyLabel) a.textContent = a.dataset.buyLabel;
  });
  $$("[data-offer-price]").forEach((el) => {
    const offer = C.offer || {};
    if (offer.price) el.textContent = offer.price + " zł";
  });
  $$("[data-offer-regular]").forEach((el) => {
    const offer = C.offer || {};
    if (offer.regularPrice) el.textContent = offer.regularPrice + " zł";
    else el.hidden = true;
  });

  /* ---------- Formularz zapisu na newsletter ---------- */
  const goToThankYou = () => {
    const target = (C.signup && C.signup.thankYouUrl) || "dziekujemy.html";
    window.location.href = /^https?:/.test(target) ? target : root + target;
  };

  $$("form[data-signup]").forEach((form) => {
    const msg = $(".form-msg", form);
    const show = (text) => { msg.textContent = text; msg.hidden = !text; };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      show("");
      const email = form.elements.email;
      const consent = form.elements.consent;
      const bot = form.elements.website;

      if (bot && bot.value) { goToThankYou(); return; } // pułapka na boty

      if (!email.validity.valid || !email.value.trim()) {
        show("Wpisz poprawny adres e-mail, np. imie@poczta.pl.");
        email.focus();
        return;
      }
      if (!consent.checked) {
        show("Zaznacz zgodę na e-maile – bez niej nie możemy wysłać Ci przepisów.");
        consent.focus();
        return;
      }

      const signup = C.signup || {};
      if (!signup.endpoint) {
        console.warn("[KetoBoomers] Tryb podglądu: brak signup.endpoint w assets/js/config.js – adres e-mail NIE został zapisany.");
        goToThankYou();
        return;
      }

      const button = $('button[type="submit"]', form);
      button.disabled = true;
      try {
        const data = new FormData(form);
        data.delete("website");
        if (signup.emailField) {
          data.delete("email");
          data.set(signup.emailField, email.value.trim());
        }
        await fetch(signup.endpoint, { method: "POST", mode: "no-cors", body: data });
        goToThankYou();
      } catch (err) {
        button.disabled = false;
        show("Nie udało się wysłać formularza. Sprawdź połączenie i spróbuj ponownie.");
      }
    });
  });

  /* ---------- Formularz kontaktowy ---------- */
  $$("form[data-contact]").forEach((form) => {
    const msg = $(".form-msg", form);
    const show = (text, ok) => {
      msg.textContent = text;
      msg.hidden = !text;
      msg.style.background = ok ? "#e4eee2" : "";
      msg.style.color = ok ? "#2f5239" : "";
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      show("");
      const { name, email, message, consent } = form.elements;
      if (!name.value.trim() || !message.value.trim()) { show("Uzupełnij imię i wiadomość."); return; }
      if (!email.validity.valid || !email.value.trim()) { show("Wpisz poprawny adres e-mail, żebyśmy mogli odpowiedzieć."); email.focus(); return; }
      if (!consent.checked) { show("Zaznacz zgodę na przetwarzanie danych w celu odpowiedzi."); consent.focus(); return; }

      const endpoint = C.contact && C.contact.endpoint;
      if (endpoint) {
        try {
          await fetch(endpoint, { method: "POST", mode: "no-cors", body: new FormData(form) });
          form.reset();
          show("Dziękujemy! Wiadomość wysłana – odpowiemy tak szybko, jak to możliwe.", true);
        } catch (err) {
          show("Nie udało się wysłać wiadomości. Napisz do nas bezpośrednio na adres e-mail obok.");
        }
        return;
      }
      const subject = encodeURIComponent("Wiadomość ze strony ketoboomers.pl");
      const body = encodeURIComponent(message.value.trim() + "\n\n– " + name.value.trim() + " (" + email.value.trim() + ")");
      window.location.href = "mailto:" + (C.email || "") + "?subject=" + subject + "&body=" + body;
      show("Otwieramy Twój program pocztowy. Jeśli nic się nie stało, napisz na adres e-mail obok.", true);
    });
  });

  /* ---------- Odliczanie oferty powitalnej ---------- */
  $$("[data-offer]").forEach((wrap) => {
    const hours = (C.offer && Number(C.offer.hours)) || 24;
    const KEY = "kb_offer_start";
    let start = Number(store.get(KEY));
    if (!start || start > Date.now()) {
      start = Date.now();
      store.set(KEY, String(start));
    }
    const end = start + hours * 3600 * 1000;
    const out = $("[data-countdown-value]", wrap);
    const active = $$("[data-offer-active]", wrap);
    const expired = $$("[data-offer-expired]", wrap);
    const pad = (n) => String(n).padStart(2, "0");
    let timer;

    const tick = () => {
      const left = end - Date.now();
      if (left <= 0) {
        active.forEach((el) => { el.hidden = true; });
        expired.forEach((el) => { el.hidden = false; });
        clearInterval(timer);
        return;
      }
      const s = Math.floor(left / 1000);
      if (out) out.textContent = pad(Math.floor(s / 3600)) + ":" + pad(Math.floor((s % 3600) / 60)) + ":" + pad(s % 60);
    };
    tick();
    timer = setInterval(tick, 1000);
  });

  /* ---------- Analityka (GA4) po zgodzie ---------- */
  const ga = C.analytics && C.analytics.ga4Id;
  if (ga) {
    const KEY = "kb_consent";
    const settings = $$("[data-cookie-settings]");
    settings.forEach((el) => { el.hidden = false; });

    const loadAnalytics = () => {
      if (window.gtag) return;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga);
      document.head.appendChild(s);
      window.gtag("js", new Date());
      window.gtag("config", ga, { anonymize_ip: true });
    };

    const showBanner = () => {
      if ($(".cookie")) return;
      const box = document.createElement("div");
      box.className = "cookie";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-labelledby", "cookie-title");
      box.innerHTML =
        '<h2 id="cookie-title" class="mt-0" style="font-size:1.15rem">Ciasteczka? Tylko za Twoją zgodą</h2>' +
        "<p>Chcemy sprawdzać, które przepisy czytacie najchętniej – do tego używamy anonimowej analityki Google Analytics. " +
        'Bez Twojej zgody jej nie włączamy. <a href="' + root + 'polityka-prywatnosci.html#cookies">Szczegóły</a></p>' +
        '<div class="cookie-actions">' +
        '<button type="button" class="btn btn--primary btn--sm" data-consent="granted">Zgadzam się</button>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-consent="denied">Tylko niezbędne</button>' +
        "</div>";
      document.body.appendChild(box);
      box.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-consent]");
        if (!btn) return;
        const previous = store.get(KEY);
        store.set(KEY, btn.dataset.consent);
        box.remove();
        if (btn.dataset.consent === "granted") loadAnalytics();
        else if (previous === "granted") window.location.reload(); // wyłącza już załadowany skrypt
      });
      $("[data-consent]", box).focus();
    };

    const saved = store.get(KEY);
    if (saved === "granted") loadAnalytics();
    else if (!saved) showBanner();
    settings.forEach((el) => el.addEventListener("click", showBanner));
  }
})();
