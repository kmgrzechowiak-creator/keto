# KetoBoomers.pl – Rodzinna Piekarnia Keto

Statyczna strona (HTML + CSS + trochę JS), zbudowana na podstawie konspektu biznesowego
(`KetoBoomers_Konspekt_Biznesowy.docx` / `.xlsx`, sesja 1). Bez frameworków, bez zewnętrznych czcionek
i skryptów – szybka i zgodna z RODO. Gotowe pliki HTML leżą w katalogu głównym, więc hostingu nie trzeba
niczym budować. Strategia pozycjonowania: **[SEO.md](SEO.md)**.

**Główna zasada z konspektu:** strona główna ma zebrać adres e-mail (lead magnet), a nie sprzedawać.
Sprzedaż dzieje się później – w mailu i na landingu ebooka.

## Podgląd lokalny

```bash
python3 -m http.server 8080      # albo: npx http-server -p 8080 -c-1 .
# otwórz http://localhost:8080
```

## Jak edytować stronę

Pliki HTML w katalogu głównym i w `blog/` są **generowane**. Nie edytuj ich ręcznie (nadpisze je kolejne
budowanie). Zmieniaj źródła i zbuduj stronę ponownie (Python 3.9+, bez dodatkowych bibliotek):

```bash
python3 _src/build.py
```

| Źródło | Co z niego powstaje |
|---|---|
| `_src/pages/*.html` | zwykłe podstrony (ta sama nazwa pliku w katalogu głównym) |
| `_src/posts/*.html` | wpisy blogowe (`blog/<nazwa>.html`), lista na `blog.html`, sitemap |
| `_src/build.py` | generator: wspólny nagłówek, stopka, meta SEO, dane strukturalne, sitemap, robots |
| `assets/` | style (`css`), skrypty (`js`), obrazy (`img`) |

Nagłówek i stopka są w `_src/build.py` (funkcje `header` i `footer`). Zmiana menu w jednym miejscu
obejmie wszystkie strony. Katalog `_src` jest zablokowany w `robots.txt`.

## Strony

| Strona | Rola (wg konspektu) |
|---|---|
| `index.html` | Strona główna: obietnica, formularz zapisu, historia w skrócie, zajawki, najnowsze wpisy, FAQ |
| `blog.html` | Blog: lista wpisów z filtrem kategorii (tworzona automatycznie) |
| `blog/*.html` | Wpisy blogowe (3 pierwsze: keto dla początkujących, mąki keto, gumowy keto chleb) |
| `pieczywo-keto.html` | Landing ebooka nr 1 (tripwire): CTA powtórzone 3×, gwarancja 7 dni, FAQ |
| `sklep.html` | Sklep: pieczywo, ciasta, święta, pakiety |
| `nasza-historia.html` | Zaufanie: kto piecze i dlaczego |
| `dziekujemy.html` | Po zapisie: oferta ebooka z odliczaniem zamiast zwykłego „dziękujemy" |
| `faq.html` | Zbijanie obiekcji i pytania z długiego ogona (+ dane strukturalne `FAQPage`) |
| `kontakt.html` | Formularz, e-mail, dane sprzedawcy |
| `regulamin.html`, `polityka-prywatnosci.html` | **Projekty**: wymagają uzupełnienia i weryfikacji prawnika |
| `blog/szablon-przepisu.html` | Szablon wpisu z przepisem (dane `Recipe`, makra, kroki), `noindex` |
| `404.html` | Strona błędu |

## Jak dodać wpis na blog

1. Utwórz plik `_src/posts/<adres-wpisu>.html` (nazwa pliku staje się adresem URL, np. `sernik-keto.html`).
2. Zacznij go blokiem z parametrami, a dalej wpisz treść (same akapity i nagłówki):

   ```html
   <!--meta
   title: Tytuł do ok. 60 znaków | KetoBoomers.pl
   h1: Nagłówek na stronie (może być dłuższy niż title)
   description: Opis do ok. 155 znaków.
   excerpt: Zajawka na liście wpisów i pod nagłówkiem.
   date: 2026-10-05
   category: Poradniki
   readtime: 7
   image: assets/img/scene/kitchen-800.jpg
   image_alt: Opis obrazu
   og_image: assets/img/scene/og-kitchen.jpg
   faq: yes
   -->
   <p>Wstęp…</p>
   <h2 id="pierwsza-sekcja">Pierwsza sekcja</h2>
   ```

   - `title`, `description`, `date` (RRRR-MM-DD), `category`, `excerpt` są wymagane; reszta ma wartości domyślne.
   - Nagłówki `<h2 id="…">` tworzą spis treści; linki do innych wpisów pisz jako `{ROOT}blog/inny-wpis.html`.
   - `faq: yes` dodaje dane `FAQPage` z bloków `<details>` (wzór: dowolny z istniejących wpisów).
3. Uruchom `python3 _src/build.py`. Wpis pojawi się na liście, w sitemapie i w sekcjach „Czytaj dalej".
4. Zaktualizuj `updated:` przy późniejszych zmianach treści.

Przepisy: skopiuj `blog/szablon-przepisu.html` i wypełnij. Liczby (makra, czas) wpisuj wyłącznie po
realnym przepieczeniu i policzeniu. Lista kontrolna publikacji jest w [SEO.md](SEO.md).

## Co trzeba podłączyć (wszystko w `assets/js/config.js`)

Puste pole = funkcja wyłączona, strona działa w trybie podglądu.

- **`signup.endpoint`** – formularz newslettera (np. MailerLite → Formularze → Osadź; ustaw też `emailField`,
  w MailerLite `fields[email]`). **Dopóki jest puste, adresy e-mail nie są nigdzie zapisywane**,
  formularz tylko przekierowuje na „dziękujemy". W konsoli przeglądarki pojawia się ostrzeżenie.
- **`checkout.pieczywo`** – link do płatności (np. Easy.Tools). Po wpisaniu strona sama przełącza się
  z „premiera wkrótce" + lista premierowa na przyciski „Kup ebooka" i ofertę na stronie „dziękujemy".
- **`offer`** – czas trwania i cena oferty powitalnej. Limit musi być **prawdziwy**: po jego upływie cena
  w koszyku faktycznie musi wzrosnąć (udawane odliczanie to nieuczciwa praktyka rynkowa).
- **`analytics.ga4Id`** – Google Analytics 4. Ładuje się dopiero po zgodzie; pasek cookies pojawia się tylko
  wtedy, gdy ID jest wpisane.
- **`email`**, **`contact.endpoint`** – adres kontaktowy i (opcjonalnie) endpoint formularza kontaktowego;
  bez endpointu formularz otwiera program pocztowy.

## Do uzupełnienia przed publikacją

Strona celowo **nie zawiera wymyślonych faktów** – prawdziwych zdjęć, opinii, danych firmy ani osobistej historii.

- [ ] **Zdjęcia wypieków.** Obrazy w `assets/img/scene/` to **wizualizacje** wygenerowane komputerowo,
  a nie fotografie: służą jako zastępniki. Konspekt wskazuje własne zdjęcia jako najważniejszy element strony.
  Podmień pliki, zachowując nazwy (`loaf`, `buns`, `cake`, `holiday`, `flours`, `kitchen`) w dwóch rozmiarach:
  `*-800.jpg` (karty) i `*-1600.jpg` (duże kadry), oraz `og-*.jpg` (1200×630, udostępnianie) i `og.png`.
  Alt-y zawierają dopisek „(wizualizacja)": usuń go po podmianie na zdjęcia.
- [ ] **Wpisy blogowe** – przed publikacją niech przejrzy je dietetyk (treści zdrowotne). Zastąp „Zespół
  KetoBoomers" prawdziwym autorem. Szczegóły: [SEO.md](SEO.md).
- [ ] **Nasza historia** (`_src/pages/nasza-historia.html`) – tekst jest szkicem; wpisz prawdziwą historię i dodaj zdjęcia osób.
- [ ] **Opinie** – sekcje `#opinie` są ukryte (`hidden`). Odkryj je dopiero z prawdziwymi cytatami (za zgodą autorów).
- [ ] **Dane sprzedawcy** – pola `[do uzupełnienia…]` w kontakcie, regulaminie i polityce prywatności.
- [ ] **Regulamin i polityka prywatności** – uzupełnij, zweryfikuj z prawnikiem, potem usuń
  `robots: noindex` z obu źródeł w `_src/pages` i zbuduj stronę. W koszyku musi być checkbox zgody na natychmiastowe
  dostarczenie treści cyfrowej i utratę prawa odstąpienia (konspekt, sekcja „Prawo i podatki").
- [ ] **Treść zapowiadająca ebooka** – opis „co znajdziesz w środku", makra, zamienniki, 7 dni gwarancji
  opisują planowany produkt. Zaktualizuj po jego ukończeniu; twarde deklaracje typu „składniki z Biedronki i Lidla"
  czy „max 40 minut" (konspekt je poleca) dodaj dopiero po sprawdzeniu na gotowych przepisach.
- [ ] **Lead magnet** „5 przepisów na keto chleb i bułki" – musi istnieć i być wysyłany w sekwencji powitalnej.
- [ ] **Adres `kontakt@ketoboomers.pl`** – to założenie; upewnij się, że skrzynka istnieje.
- [ ] Po podpięciu domeny sprawdź `sitemap.xml` i `robots.txt` (adres `https://ketoboomers.pl`).

## Reklamy Meta: bezpieczna narracja

Konspekt ostrzega, że Meta ocenia też stronę docelową. Teksty na stronie mówią o smaku i rodzinie, nie
o odchudzaniu: bez „przed i po", wag, obietnic wagowych i pytań typu „masz nadwagę?". Zachowaj to, redagując treści.

## Hosting

Dowolny hosting plików statycznych (Cloudflare Pages, Netlify, GitHub Pages, zwykły hosting z FTP):
katalog główny repozytorium wystarczy opublikować bez komendy budowania.
Strona używa ścieżek względnych; `404.html` ścieżek absolutnych, więc domena powinna wskazywać na katalog główny.
