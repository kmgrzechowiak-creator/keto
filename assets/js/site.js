/* KetoBoomers.pl — drobne funkcje strony. Bez zależności. */
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
        show("Zaznacz zgodę na e-maile — bez niej nie możemy wysłać Ci przepisów.");
        consent.focus();
        return;
      }

      const signup = C.signup || {};
      if (!signup.endpoint) {
        console.warn("[KetoBoomers] Tryb podglądu: brak signup.endpoint w assets/js/config.js — adres e-mail NIE został zapisany.");
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
          show("Dziękujemy! Wiadomość wysłana — odpowiemy tak szybko, jak to możliwe.", true);
        } catch (err) {
          show("Nie udało się wysłać wiadomości. Napisz do nas bezpośrednio na adres e-mail obok.");
        }
        return;
      }
      const subject = encodeURIComponent("Wiadomość ze strony ketoboomers.pl");
      const body = encodeURIComponent(message.value.trim() + "\n\n— " + name.value.trim() + " (" + email.value.trim() + ")");
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
        "<p>Chcemy sprawdzać, które przepisy czytacie najchętniej — do tego używamy anonimowej analityki Google Analytics. " +
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
