# KetoBoomers.pl — Rodzinna Piekarnia Keto

Statyczna strona (HTML + CSS + trochę JS), zbudowana na podstawie konspektu biznesowego
(`KetoBoomers_Konspekt_Biznesowy.docx` / `.xlsx`, sesja 1). Bez frameworków, bez procesu budowania,
bez zewnętrznych czcionek i skryptów — szybka i zgodna z RODO.

**Główna zasada z konspektu:** strona główna ma zebrać adres e-mail (lead magnet), a nie sprzedawać.
Sprzedaż dzieje się później — w mailu i na landingu ebooka.

## Podgląd lokalny

```bash
npx http-server -p 8080 -c-1 .     # albo: python3 -m http.server 8080
# otwórz http://localhost:8080
```

## Strony

| Plik | Rola (wg konspektu) |
|---|---|
| `index.html` | Strona główna — obietnica, formularz zapisu, historia w skrócie, zajawki, FAQ |
| `pieczywo-keto.html` | Landing ebooka nr 1 (tripwire) — CTA powtórzone 3×, gwarancja 7 dni, FAQ |
| `sklep.html` | Sklep — pieczywo, ciasta, święta, pakiety |
| `blog.html` | Blog z darmowymi przepisami (na razie „wkrótce”) |
| `blog/szablon-przepisu.html` | Szablon wpisu z przepisem (JSON-LD `Recipe`, makra, kroki) |
| `nasza-historia.html` | Zaufanie — kto piecze i dlaczego |
| `dziekujemy.html` | Po zapisie: oferta ebooka z odliczaniem zamiast zwykłego „dziękujemy” |
| `faq.html` | Zbijanie obiekcji (+ dane strukturalne `FAQPage`) |
| `kontakt.html` | Formularz, e-mail, dane sprzedawcy |
| `regulamin.html`, `polityka-prywatnosci.html` | **Projekty** — wymagają uzupełnienia i weryfikacji prawnika |
| `404.html` | Strona błędu |

Nagłówek i stopka są powtórzone w każdym pliku. Zmiana menu = wyszukaj i zamień w całym repozytorium.

## Co trzeba podłączyć (wszystko w `assets/js/config.js`)

Puste pole = funkcja wyłączona, strona działa w trybie podglądu.

- **`signup.endpoint`** — formularz newslettera (np. MailerLite → Formularze → Osadź; ustaw też `emailField`,
  w MailerLite `fields[email]`). **Dopóki jest puste, adresy e-mail nie są nigdzie zapisywane** —
  formularz tylko przekierowuje na „dziękujemy”. W konsoli przeglądarki pojawia się ostrzeżenie.
- **`checkout.pieczywo`** — link do płatności (np. Easy.Tools). Po wpisaniu strona sama przełącza się
  z „premiera wkrótce” + lista premierowa na przyciski „Kup ebooka” i ofertę na stronie „dziękujemy”.
- **`offer`** — czas trwania i cena oferty powitalnej. Limit musi być **prawdziwy**: po jego upływie cena
  w koszyku faktycznie musi wzrosnąć (udawane odliczanie to nieuczciwa praktyka rynkowa).
- **`analytics.ga4Id`** — Google Analytics 4. Ładuje się dopiero po zgodzie; pasek cookies pojawia się tylko
  wtedy, gdy ID jest wpisane.
- **`email`**, **`contact.endpoint`** — adres kontaktowy i (opcjonalnie) endpoint formularza kontaktowego;
  bez endpointu formularz otwiera program pocztowy.

## Do uzupełnienia przed publikacją

Strona celowo **nie zawiera wymyślonych faktów** — zdjęć, opinii, danych firmy ani osobistej historii.

- [ ] **Zdjęcia wypieków** — konspekt: to najważniejszy element strony. Ilustracje w `assets/img/*.svg`
  są zastępnikami; podmień je na zdjęcia (`<img src>` w plikach HTML, dodaj wymiary i `alt`).
- [ ] **Nasza historia** (`nasza-historia.html`) — tekst jest szkicem; wpisz prawdziwą historię i dodaj zdjęcia osób.
- [ ] **Opinie** — sekcje `#opinie` są ukryte (`hidden`). Odkryj je dopiero z prawdziwymi cytatami (za zgodą autorów).
- [ ] **Dane sprzedawcy** — pola `[do uzupełnienia…]` w kontakcie, regulaminie i polityce prywatności.
- [ ] **Regulamin i polityka prywatności** — uzupełnij, zweryfikuj z prawnikiem, potem usuń
  `<meta name="robots" content="noindex">` z obu plików. W koszyku musi być checkbox zgody na natychmiastowe
  dostarczenie treści cyfrowej i utratę prawa odstąpienia (konspekt, sekcja „Prawo i podatki”).
- [ ] **Treść zapowiadająca ebooka** — opis „co znajdziesz w środku”, makra, zamienniki, 7 dni gwarancji
  opisują planowany produkt. Zaktualizuj po jego ukończeniu; twarde deklaracje typu „składniki z Biedronki i Lidla”
  czy „max 40 minut” (konspekt je poleca) dodaj dopiero po sprawdzeniu na gotowych przepisach.
- [ ] **Lead magnet** „5 przepisów na keto chleb i bułki” — musi istnieć i być wysyłany w sekwencji powitalnej.
- [ ] **Adres `kontakt@ketoboomers.pl`** — to założenie; upewnij się, że skrzynka istnieje.
- [ ] Po podpięciu domeny sprawdź `sitemap.xml` i `robots.txt` (adres `https://ketoboomers.pl`).

## Dodawanie przepisu na blog

Skopiuj `blog/szablon-przepisu.html`, wypełnij, usuń `noindex`, dodaj wpis do `blog.html`.
Liczby (makra, czas) wpisuj wyłącznie po realnym przepieczeniu i policzeniu.

## Reklamy Meta — bezpieczna narracja

Konspekt ostrzega, że Meta ocenia też stronę docelową. Teksty na stronie mówią o smaku i rodzinie, nie
o odchudzaniu: bez „przed i po”, wag, obietnic wagowych i pytań typu „masz nadwagę?”. Zachowaj to, redagując treści.

## Hosting

Dowolny hosting plików statycznych (Cloudflare Pages, Netlify, GitHub Pages, zwykły hosting z FTP).
Strona używa ścieżek względnych; `404.html` ścieżek absolutnych, więc domena powinna wskazywać na katalog główny.
