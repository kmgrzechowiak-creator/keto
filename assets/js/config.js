/*
  KetoBoomers.pl — ustawienia strony.
  Wszystko, co trzeba podłączyć przed publikacją, jest w tym jednym pliku.
  Puste pole = funkcja wyłączona (strona działa w trybie podglądu).
*/
window.KETO_CONFIG = {
  // Adres kontaktowy pokazywany na stronie (kontakt, stopka, regulamin).
  email: "kontakt@ketoboomers.pl",

  // Zapis na newsletter (MailerLite lub inne narzędzie).
  //  endpoint   — adres z formularza osadzanego (Formularze → Osadź → „Działanie formularza"/URL).
  //               Puste = tryb podglądu: formularz przekierowuje na stronę „dziękujemy",
  //               ALE adres e-mail nie jest nigdzie zapisywany.
  //  emailField — nazwa pola e-mail wymagana przez narzędzie (MailerLite: "fields[email]").
  //  thankYouUrl — strona po zapisie z ofertą ebooka.
  signup: {
    endpoint: "",
    emailField: "",
    thankYouUrl: "dziekujemy.html"
  },

  // Formularz kontaktowy. Puste = otwiera program pocztowy (mailto:).
  contact: {
    endpoint: ""
  },

  // Linki do płatności (koszyk w Easy.Tools / innym narzędziu).
  // Puste = produkt jest „wkrótce", przyciski zapraszają na listę premierową.
  // Wpisz adres → strona sama przełączy się na sprzedaż (przyciski „Kup", oferta na stronie „dziękujemy").
  checkout: {
    pieczywo: ""
  },

  // Oferta powitalna na stronie „dziękujemy".
  //  hours        — czas trwania odliczania liczony od pierwszego wejścia odwiedzającego.
  //  price        — cena powitalna.
  //  regularPrice — cena po upływie oferty (null = nie pokazuj ceny przekreślonej).
  // WAŻNE: limit czasowy musi być prawdziwy — po upływie czasu cena w koszyku faktycznie
  // musi wzrosnąć. Udawane odliczanie to nieuczciwa praktyka rynkowa (UOKiK).
  offer: {
    hours: 24,
    price: 29,
    regularPrice: null
  },

  // Google Analytics 4 (np. "G-XXXXXXXXXX"). Puste = brak analityki i brak paska cookies.
  // Po wpisaniu ID skrypt ładuje się dopiero po zgodzie odwiedzającego.
  analytics: {
    ga4Id: ""
  }
};
