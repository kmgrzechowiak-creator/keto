#!/usr/bin/env python3
"""Generator strony KetoBoomers.pl.

Składa gotowe, statyczne pliki HTML w katalogu głównym repozytorium ze źródeł:
  _src/pages/*.html   zwykłe podstrony (plik wynikowy ma tę samą nazwę)
  _src/posts/*.html   wpisy blogowe (plik wynikowy: blog/<nazwa>.html)

Uruchomienie (Python 3.9+, bez dodatkowych bibliotek):
  python3 _src/build.py

Każde źródło zaczyna się blokiem <!--meta ... --> z parametrami (title, description itd.).
Opis formatu i parametrów: README.md, sekcja „Jak dodać wpis na blog".
"""
import html as htmllib
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
PAGES = HERE / "pages"
POSTS = HERE / "posts"
SITE = "https://ketoboomers.pl"
DEFAULT_OG = "assets/img/og.png"

NAV = [
    ("blog", "blog.html", "Blog"),
    ("sklep", "sklep.html", "Sklep"),
    ("historia", "nasza-historia.html", "Nasza historia"),
    ("faq", "faq.html", "FAQ"),
    ("kontakt", "kontakt.html", "Kontakt"),
]

MONTHS = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia",
          "września", "października", "listopada", "grudnia"]

ICONS = {
    "check": '<circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.4l3 3 6-6.4"/>',
    "scale": '<path d="M12 3.5v17M7 20.5h10M5 7.5h14"/><path d="M5 7.5l-3 7.2a3.3 3.3 0 0 0 6 0L5 7.5zM19 7.5l-3 7.2a3.3 3.3 0 0 0 6 0l-3-7.2z"/>',
    "clock": '<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.6 2.2"/>',
    "shield": '<path d="M12 2.8l7.5 2.8v5.6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10V5.6L12 2.8z"/><path d="M8.6 12l2.6 2.6 4.4-4.8"/>',
}


PRODUCTS = [
    dict(key="pieczywo", title="Keto pieczywo", sub="12 przepisów na chleb i bułki", theme="wheat", img="loaf",
         tag=("Ebook", "PDF"), price="29 zł", href="pieczywo-keto.html", cta="Poznaj ebooka",
         blurb="Chleb i bułki, które wychodzą za pierwszym razem. Makra, czas i wskazówki krok po kroku."),
    dict(key="ciasta", title="Ciasta i serniki", sub="wypieki, które łączą rodzinę", theme="rose", img="cake",
         tag=("Ebook", "Wkrótce"), price="planowo 39 zł", href="sklep.html#powiadom", cta="Powiadom mnie o premierze",
         blurb="Od codziennych ciast po sernik na święta, bez cukru i bez kompromisów w smaku."),
    dict(key="swieta", title="Święta keto", sub="wypieki bez cukru na świąteczny stół", theme="pine", img="holiday",
         tag=("Ebook", "Wkrótce"), price="planowo 39 zł", href="sklep.html#powiadom", cta="Powiadom mnie o premierze",
         blurb="Piernik, sernik i makowiec na święta: przy stole nikogo nie zabraknie, także osób pilnujących węglowodanów."),
    dict(key="maki", title="Przewodnik po mąkach", sub="migdałowa, kokosowa, łubinowa", theme="sage", img="flours",
         tag=("Poradnik", "Za darmo"), price="Czytaj za darmo na blogu", href="blog/maki-keto-migdalowa-kokosowa-lubinowa-babka-plesznik.html", cta="Przeczytaj na blogu",
         blurb="Proporcje, zamienniki i alergeny. Wiedza, której najbardziej brakuje początkującym w pieczeniu keto."),
    dict(key="pakiet", title="Pakiet ebooków", sub="wszystkie w jednym, taniej", theme="espresso", img=None,
         tag=("Pakiet", "Wkrótce"), price="planowo 119 zł", href="sklep.html#powiadom", cta="Powiadom mnie o premierze",
         blurb="Wszystkie ebooki w jednym pakiecie. Przy premierze pokażemy dokładnie, ile oszczędzasz."),
    dict(key="ksiega", title="Wielka księga wypieków", sub="Rodzinna piekarnia keto", theme="wine", img="kitchen",
         tag=("Księga", "Wkrótce"), price="planowo 79 zł", href="sklep.html#powiadom", cta="Powiadom mnie o premierze",
         blurb="Nasz flagowy zbiór: 50–70 przepisów na chleb, ciasta i święta. W przygotowaniu."),
]


def carousel_html(root):
    n = len(PRODUCTS)
    books, infos, dots = [], [], []
    for i, p in enumerate(PRODUCTS):
        t = htmllib.escape(p["title"])
        if p["img"]:
            visual = f'<span class="bk-photo"><img src="{root}assets/img/scene/{p["img"]}-800.jpg" alt="" width="800" height="600" loading="lazy"></span>'
        else:
            visual = '<span class="bk-stack" aria-hidden="true"><i></i><i></i><i></i></span>'
        books.append(f"""<li class="book{' is-active' if i == 0 else ''}" style="--i:{i}" data-index="{i}">
            <div class="book-face book-face--front bk bk--{p['theme']}">
              <a class="book-link" href="{root}{p['href']}" aria-label="{t}: {htmllib.escape(p['sub'])}">
                <span class="bk-inner"><span class="bk-brand">KetoBoomers</span><span class="bk-title">{t}</span><span class="bk-sub">{htmllib.escape(p['sub'])}</span></span>
                {visual}
                <span class="bk-tag"><span>{p['tag'][0]}</span><span>{p['tag'][1]}</span></span>
              </a>
            </div>
            <div class="book-face book-face--back bk bk--{p['theme']} bk-back"><img src="{root}assets/img/logo-mark.svg" alt="" width="64" height="64"></div>
          </li>""")
        if p["key"] == "pieczywo":
            badge = '<span class="badge" data-soon-for="pieczywo">Premiera wkrótce</span><span class="badge" data-live-for="pieczywo" hidden>Dostępny</span>'
        else:
            badge = f'<span class="badge">{p["tag"][1]}</span>'
        infos.append(f"""<div class="info-item" data-index="{i}"{'' if i == 0 else ' hidden'}>
            {badge}
            <h3>{t}</h3>
            <p>{htmllib.escape(p['blurb'])}</p>
            <p class="info-price">{htmllib.escape(p['price'])}</p>
            <a class="btn btn--light btn--arrow" href="{root}{p['href']}">{p['cta']}</a>
          </div>""")
        cur = ' aria-current="true"' if i == 0 else ""
        dots.append(f'<button type="button" data-go="{i}" aria-label="Pokaż: {t}"{cur}></button>')
    return f"""<div class="carousel" data-carousel style="--n:{n}">
      <div class="carousel-stage" aria-roledescription="karuzela" aria-label="Biblioteka ebooków KetoBoomers">
        <div class="carousel-floor" aria-hidden="true"></div>
        <ol class="carousel-ring">
          {"".join(books)}
        </ol>
      </div>
      <button type="button" class="carousel-btn carousel-btn--prev" aria-label="Poprzedni ebook">‹</button>
      <button type="button" class="carousel-btn carousel-btn--next" aria-label="Następny ebook">›</button>
      <div class="carousel-info" aria-live="polite">
        {"".join(infos)}
      </div>
      <div class="carousel-dots">{"".join(dots)}</div>
    </div>"""


def badge_html(root):
    return f"""<div class="badge-round" aria-hidden="true">
      <svg class="ring" viewBox="0 0 100 100"><defs><path id="badge-path" d="M50,50 m-39,0 a39,39 0 1,1 78,0 a39,39 0 1,1 -78,0"/></defs><text><textPath href="#badge-path" textLength="241" lengthAdjust="spacing">Wypieki keto bez cukru · Rodzinna piekarnia · </textPath></text></svg>
      <img src="{root}assets/img/logo-mark.svg" alt="" width="64" height="64">
    </div>"""


def pl_date(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return f"{d} {MONTHS[m - 1]} {y}"


def icon(name):
    return f'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICONS[name]}</svg>'


def signup(uid, label):
    return f"""<form class="signup" data-signup novalidate>
        <div class="field">
          <label for="email-{uid}">Twój adres e-mail</label>
          <input id="email-{uid}" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="np. imie@poczta.pl">
        </div>
        <div class="hp" aria-hidden="true"><label>Nie wypełniaj tego pola <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <button class="btn btn--primary btn--lg btn--block" type="submit">{label}</button>
        <label class="consent" for="consent-{uid}">
          <input id="consent-{uid}" name="consent" type="checkbox" required>
          <span>Zgadzam się na otrzymywanie e-maili od KetoBoomers.pl z przepisami i informacjami o produktach. Mogę wypisać się w każdej chwili. <a href="{{ROOT}}polityka-prywatnosci.html">Polityka prywatności</a></span>
        </label>
        <p class="form-msg" role="alert" hidden></p>
      </form>"""


def parse_source(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"\s*<!--meta\n(.*?)\n-->\s*", text, re.S)
    if not m:
        raise SystemExit(f"{path.name}: brak bloku <!--meta ... -->")
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, text[m.end():]


def nbsp(fragment):
    """Twarda spacja po jednoliterowych spójnikach – bez sierot na końcu linii. Tylko w tekście, nie w tagach."""
    parts = re.split(r"(<script.*?</script>|<[^>]+>)", fragment, flags=re.S)
    for i, part in enumerate(parts):
        if part.startswith("<"):
            continue
        parts[i] = re.sub(r"(^|[\s(„\"])([IiWwZzOoUuAa]) (?=\S)", r"\1\2&nbsp;", part)
    return "".join(parts)


# ---------- Wpisy blogowe ----------

def load_posts():
    posts = []
    for p in sorted(POSTS.glob("*.html")):
        meta, body = parse_source(p)
        for key in ("title", "description", "date", "category", "excerpt"):
            if key not in meta:
                raise SystemExit(f"{p.name}: brakuje parametru '{key}' w bloku meta")
        meta["slug"] = p.stem
        meta["file"] = f"blog/{p.stem}.html"
        meta["body"] = body
        meta.setdefault("updated", meta["date"])
        meta.setdefault("readtime", "5")
        meta.setdefault("image", "assets/img/hero-loaf.svg")
        meta.setdefault("og_image", DEFAULT_OG)
        meta.setdefault("h1", meta["title"].split(" | ")[0])
        posts.append(meta)
    posts.sort(key=lambda m: m["date"], reverse=True)
    return posts


def post_cards(posts, root, total=None, start=0):
    cards = []
    total = total or len(posts)
    for idx, p in enumerate(posts):
        title = htmllib.escape(p["h1"])
        no = total - (start + idx)
        cards.append(f"""<article class="card post-card" data-cat="{htmllib.escape(p['category'])}">
          <div class="card-media card-media--photo"><img src="{root}{p['image']}" alt="" width="800" height="600" loading="lazy"></div>
          <div class="card-body">
            <span class="card-no">N° {no:02d}</span>
            <span class="badge">{htmllib.escape(p['category'])}</span>
            <h3><a class="card-title-link" href="{root}{p['file']}">{title}</a></h3>
            <p>{htmllib.escape(p['excerpt'])}</p>
            <p class="post-meta-line"><span><time datetime="{p['date']}">{pl_date(p['date'])}</time></span> · <span>{p['readtime']} min czytania</span></p>
          </div>
        </article>""")
    return "\n".join(cards)


def featured_card(p, root, total):
    title = htmllib.escape(p["h1"])
    return f"""<article class="featured-post post-card" data-cat="{htmllib.escape(p['category'])}">
      <div class="fp-media"><img src="{root}{p['image'].replace('-800.jpg', '-1600.jpg')}" alt="" width="1600" height="1200" loading="eager"></div>
      <div class="fp-body">
        <span class="eyebrow">Najnowszy wpis · {htmllib.escape(p['category'])}</span>
        <h2><a href="{root}{p['file']}">{title}</a></h2>
        <p>{htmllib.escape(p['excerpt'])}</p>
        <p class="post-meta-line"><span><time datetime="{p['date']}">{pl_date(p['date'])}</time></span> · <span>{p['readtime']} min czytania</span></p>
        <span class="btn btn--primary btn--arrow" style="align-self:flex-start">Czytaj wpis</span>
      </div>
    </article>"""


def expand_posts_tokens(body, posts, root):
    """{{featured}} – najnowszy wpis, {{posts:rest}} – pozostałe, {{posts}} – wszystkie, {{posts:N}} – N najnowszych."""
    total = len(posts)
    body = body.replace("{{featured}}", featured_card(posts[0], root, total) if posts else "")
    body = body.replace("{{posts:rest}}", post_cards(posts[1:], root, total, 1))
    body = re.sub(r"\{\{posts:(\d+)\}\}", lambda m: post_cards(posts[: int(m.group(1))], root, total, 0), body)
    body = body.replace("{{posts}}", post_cards(posts, root, total, 0))
    cats = []
    for p in posts:
        if p["category"] not in cats:
            cats.append(p["category"])
    chips = ['<li><button type="button" class="chip" data-filter="" aria-pressed="true">Wszystkie</button></li>']
    chips += [
        f'<li><button type="button" class="chip" data-filter="{htmllib.escape(c)}" aria-pressed="false">{htmllib.escape(c)}</button></li>'
        for c in cats
    ]
    body = body.replace("{{categories}}", "\n".join(chips))
    body = body.replace("{{carousel}}", carousel_html(root)).replace("{{badge}}", badge_html(root))
    return body


def toc_html(body):
    items = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body, re.S)
    if len(items) < 3:
        return ""
    lis = "".join(f'<li><a href="#{i}">{re.sub(r"<[^>]+>", "", t).strip()}</a></li>' for i, t in items)
    return f'<nav class="toc" aria-labelledby="toc-title"><p class="toc-title" id="toc-title">W tym artykule</p><ol>{lis}</ol></nav>'


def post_main(post, posts):
    root = "../"
    h1 = htmllib.escape(post["h1"])
    crumb_title = htmllib.escape(post.get("crumb", post["h1"]))
    updated = ""
    if post["updated"] != post["date"]:
        updated = f' <span>Zaktualizowano <time datetime="{post["updated"]}">{pl_date(post["updated"])}</time></span>'
    hero = ""
    if post.get("hero", "yes") != "no":
        small = post["image"]
        large = small.replace("-800.jpg", "-1600.jpg")
        srcset = f' srcset="{root}{small} 800w, {root}{large} 1600w" sizes="(min-width: 1100px) 1080px, 94vw"' if large != small else ""
        hero = f'<figure class="post-hero"><div class="frame"><img src="{root}{large}"{srcset} alt="{htmllib.escape(post.get("image_alt", ""))}" width="1600" height="1200" fetchpriority="high"></div></figure>'
    others = [p for p in posts if p["slug"] != post["slug"]]
    same = [p for p in others if p["category"] == post["category"]]
    ordered = same + [p for p in others if p not in same]
    related = ""
    if ordered:
        related = f"""<section class="section section--alt">
  <div class="container">
    <div class="section-head section-head--center"><span class="eyebrow">Dalej w księdze</span><h2>Czytaj dalej</h2></div>
    <div class="grid grid--3">
{post_cards(ordered[:3], root, len(posts), 0)}
    </div>
  </div>
</section>"""
    toc = toc_html(post["body"])
    layout_cls = "post-layout" if toc else "post-layout post-layout--solo"
    aside = f'<aside class="post-aside">{toc}</aside>' if toc else ""
    return f"""<article class="post">
  <header class="post-header">
    <div class="container--narrow">
      <nav class="breadcrumbs" aria-label="Nawigacja okruszkowa"><ol>
        <li><a href="{root}index.html">Strona główna</a></li>
        <li><a href="{root}blog.html">Blog</a></li>
        <li aria-current="page">{crumb_title}</li>
      </ol></nav>
      <span class="eyebrow">{htmllib.escape(post["category"])}</span>
      <h1>{h1}</h1>
      <p class="lead">{htmllib.escape(post["excerpt"])}</p>
      <p class="post-byline"><span>Zespół KetoBoomers</span><span><time datetime="{post["date"]}">{pl_date(post["date"])}</time></span>{updated}<span>{post["readtime"]} min czytania</span></p>
    </div>
    {hero}
  </header>
  <div class="{layout_cls}">
    {aside}
    <div class="post-main">
      <div class="prose post-body">
{post["body"].strip()}
      </div>
      <div class="post-end"><div class="ornament" aria-hidden="true"></div><p>Do zobaczenia w naszej piekarni.</p></div>
      <aside class="callout callout--sage post-disclaimer">
        <p><strong>Uwaga:</strong> artykuł ma charakter informacyjny i nie zastępuje porady lekarza ani dietetyka. Jeśli chorujesz przewlekle (w tym na cukrzycę), przyjmujesz leki albo jesteś w ciąży, zmianę diety skonsultuj ze specjalistą.</p>
      </aside>
    </div>
  </div>
</article>
{related}
<section class="section section--dark">
  <div class="container--narrow center">
    <span class="eyebrow">Darmowy zestaw</span>
    <h2>5 przepisów na keto chleb i bułki, które wychodzą</h2>
    <p class="lead" style="margin-inline:auto">Zapisz się na newsletter i odbierz zestaw na start. Nowe artykuły i przepisy prosto na skrzynkę.</p>
    <div class="signup-card" style="text-align:left;max-width:34rem;margin:2rem auto 0">
      {{{{signup:post|Wyślij mi darmowe przepisy}}}}
    </div>
  </div>
</section>"""


# ---------- Dane strukturalne ----------

def faq_jsonld(body):
    items = []
    for m in re.finditer(r"<summary>(.*?)</summary>\s*<div class=\"answer\">(.*?)</div>\s*</details>", body, re.S):
        q = htmllib.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
        a = htmllib.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(2)))).strip()
        items.append({"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}})
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": items}


def org_jsonld():
    return [
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "KetoBoomers.pl",
            "alternateName": "Rodzinna Piekarnia Keto",
            "url": SITE + "/",
            "logo": SITE + "/assets/img/og.png",
            "description": "Rodzinna piekarnia keto – sprawdzone przepisy na chleb, bułki i wypieki bez cukru.",
        },
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "KetoBoomers.pl",
            "url": SITE + "/",
            "inLanguage": "pl-PL",
        },
    ]


def article_jsonld(post):
    url = f"{SITE}/{post['file']}"
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post["h1"],
        "description": post["description"],
        "inLanguage": "pl-PL",
        "datePublished": post["date"],
        "dateModified": post["updated"],
        "mainEntityOfPage": url,
        "image": f"{SITE}/{post['og_image']}",
        "author": {"@type": "Organization", "name": "Zespół KetoBoomers", "url": SITE + "/"},
        "publisher": {"@type": "Organization", "name": "KetoBoomers.pl", "url": SITE + "/",
                      "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/og.png"}},
    }


def breadcrumb_jsonld(post):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Strona główna", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog.html"},
            {"@type": "ListItem", "position": 3, "name": post.get("crumb", post["h1"]), "item": f"{SITE}/{post['file']}"},
        ],
    }


# ---------- Układ strony ----------

def header(root, nav_key):
    items = []
    for key, href, label in NAV:
        cur = ' aria-current="page"' if key == nav_key else ""
        items.append(f'<li><a href="{root}{href}"{cur}>{label}</a></li>')
    return f"""<a class="skip-link" href="#main">Przejdź do treści</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="{root}index.html" aria-label="KetoBoomers – Rodzinna Piekarnia Keto, strona główna">
      <img src="{root}assets/img/logo-mark.svg" alt="" width="44" height="44">
      <span class="brand-text"><span class="brand-name">KetoBoomers</span><span class="brand-sub">Rodzinna Piekarnia Keto</span></span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="nav-toggle-bars" aria-hidden="true"></span>Menu</button>
    <nav id="site-nav" class="site-nav" aria-label="Główna nawigacja">
      <ul>
        {"".join(items)}
      </ul>
      <a class="btn btn--primary btn--sm" href="{root}index.html#darmowe-przepisy">Darmowe przepisy</a>
    </nav>
  </div>
</header>
"""


def footer(root):
    return f"""<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-brand"><img src="{root}assets/img/logo-mark.svg" alt="" width="42" height="42">KetoBoomers</div>
        <p>Rodzinna piekarnia keto. Wypieki bez cukru, bez smaku kompromisu.</p>
      </div>
      <div>
        <h2>Na stronie</h2>
        <ul>
          <li><a href="{root}blog.html">Blog keto</a></li>
          <li><a href="{root}sklep.html">Sklep</a></li>
          <li><a href="{root}pieczywo-keto.html">Ebook: Keto pieczywo</a></li>
          <li><a href="{root}nasza-historia.html">Nasza historia</a></li>
        </ul>
      </div>
      <div>
        <h2>Pomoc</h2>
        <ul>
          <li><a href="{root}faq.html">Częste pytania</a></li>
          <li><a href="{root}kontakt.html">Kontakt</a></li>
          <li><a href="{root}regulamin.html">Regulamin</a></li>
          <li><a href="{root}polityka-prywatnosci.html">Polityka prywatności</a></li>
          <li><button type="button" class="linklike" data-cookie-settings hidden>Ustawienia cookies</button></li>
        </ul>
      </div>
      <div>
        <h2>Napisz do nas</h2>
        <p><a href="mailto:kontakt@ketoboomers.pl" data-email>kontakt@ketoboomers.pl</a></p>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© <span data-year>2026</span> KetoBoomers.pl. Wszelkie prawa zastrzeżone.</p>
      <p>Przepisy i treści na stronie mają charakter informacyjny i nie zastępują porady lekarza ani dietetyka. Przy chorobach przewlekłych, w tym cukrzycy i insulinooporności, zmianę diety skonsultuj ze specjalistą.</p>
    </div>
  </div>
</footer>
"""


def expand_tokens(body, root):
    body = re.sub(r"\{\{signup:([\w-]+)\|([^}]+)\}\}", lambda m: signup(m.group(1), m.group(2)), body)
    body = re.sub(r"\{\{icon:(\w+)\}\}", lambda m: icon(m.group(1)), body)
    return body.replace("{ROOT}", root)


def render_document(meta, main_html, root, out_rel, extra_ld=None, og_type="website", extra_head=""):
    title = meta["title"]
    desc = meta["description"]
    canonical = SITE + "/" + ("" if out_rel == "index.html" else out_rel)
    robots = '<meta name="robots" content="noindex, follow">\n' if "noindex" in meta.get("robots", "") else ""
    og_image = f"{SITE}/{meta.get('og_image', DEFAULT_OG)}"

    ld = list(extra_ld or [])
    for kind in meta.get("jsonld", "").split():
        if kind == "org":
            ld += org_jsonld()
        elif kind == "faq":
            ld.append(faq_jsonld(main_html))
    ld_html = "".join(
        f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>\n' for o in ld
    )

    body = nbsp(expand_tokens(main_html.strip(), root))
    e = htmllib.escape
    doc = f"""<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc, quote=True)}">
<meta name="theme-color" content="#fbf6ec">
{robots}<link rel="canonical" href="{canonical}">
<link rel="icon" href="{root}assets/img/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="{og_type}">
<meta property="og:locale" content="pl_PL">
<meta property="og:site_name" content="KetoBoomers.pl">
<meta property="og:title" content="{e(title, quote=True)}">
<meta property="og:description" content="{e(desc, quote=True)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{og_image}">
<meta name="twitter:card" content="summary_large_image">
{extra_head}<link rel="preload" as="font" type="font/woff2" crossorigin href="{root}assets/fonts/fraunces-latin-opsz-normal.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="{root}assets/fonts/fraunces-latin-ext-opsz-normal.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="{root}assets/fonts/dm-sans-latin-wght-normal.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="{root}assets/fonts/dm-sans-latin-ext-wght-normal.woff2">
<link rel="stylesheet" href="{root}assets/css/style.css">
<script>document.documentElement.classList.add("js")</script>
{ld_html}</head>
<body data-root="{root}">
{nbsp(header(root, meta.get("nav", "")))}<main id="main">
{body}
</main>
{nbsp(footer(root))}<script src="{root}assets/js/config.js"></script>
<script src="{root}assets/js/site.js" defer></script>
</body>
</html>
"""
    target = ROOT / out_rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(doc, encoding="utf-8")


def build_page(src_path, posts):
    meta, body = parse_source(src_path)
    root = meta.get("root", "")
    out_rel = meta.get("file", src_path.name)
    body = expand_posts_tokens(body, posts, root)
    render_document(meta, body, root, out_rel)
    return out_rel, "noindex" in meta.get("robots", ""), None


def build_post(post, posts):
    main = post_main(post, posts)
    meta = {
        "title": post["title"],
        "description": post["description"],
        "nav": "blog",
        "og_image": post["og_image"],
        "jsonld": "faq" if post.get("faq") == "yes" else "",
    }
    if post.get("faq") == "yes":
        meta["jsonld"] = "faq"
    extra_head = (
        f'<meta property="article:published_time" content="{post["date"]}">\n'
        f'<meta property="article:modified_time" content="{post["updated"]}">\n'
        f'<meta property="article:section" content="{htmllib.escape(post["category"], quote=True)}">\n'
    )
    # FAQPage budowany jest z treści wpisu (nie z całego układu strony)
    render_document(
        meta, main, "../", post["file"],
        extra_ld=[article_jsonld(post), breadcrumb_jsonld(post)],
        og_type="article", extra_head=extra_head,
    )
    return post["file"], False, post["updated"]


def main():
    posts = load_posts()
    built = []
    for p in sorted(PAGES.glob("*.html")):
        built.append(build_page(p, posts))
    for post in posts:
        built.append(build_post(post, posts))

    urls = []
    for f, noindex, lastmod in built:
        if noindex or f == "404.html":
            continue
        loc = f"{SITE}/{'' if f == 'index.html' else f}"
        urls.append(f"  <url><loc>{loc}</loc>" + (f"<lastmod>{lastmod}</lastmod>" if lastmod else "") + "</url>")
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n",
        encoding="utf-8",
    )
    (ROOT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nDisallow: /_src/\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8"
    )
    print(f"zbudowano {len(built)} stron ({len(posts)} wpisów blogowych)")


if __name__ == "__main__":
    main()
