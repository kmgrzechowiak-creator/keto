# Renderer wizualizacji (narzędzie dla autora, nie część strony)

Obrazy w `assets/img/scene/` to wizualizacje 3D, nie fotografie. Powstają tym małym rendererem
(WebGL2, ray marching: miękkie cienie, okluzja, głębia ostrości, proceduralna skórka, miękisz, drewno i len).
Strona działa bez niego. Zachowano go, żeby obrazy dało się odtworzyć lub zmienić kadr.

```bash
npm i playwright                      # raz, w dowolnym miejscu (PLAYWRIGHT_PATH, jeśli poza projektem)
cd _src/render
node render.js loaf 1600 1200 48 final/loaf.jpg 92     # scena szerokość wysokość przebiegi plik jakość
node export2.js loaf cake buns flours holiday slices:kitchen hero   # zapis do assets/img/scene (rozmiary, og-*)
```

Sceny: `loaf`, `cake`, `buns`, `flours`, `holiday`, `slices` (zapisywana jako `kitchen`), `hero` (16:9).
Bez karty graficznej render programowy (SwiftShader) trwa ok. 2–3 min na obraz (48 przebiegów).
Skrypty szukają Chromium przez Playwright; własną ścieżkę podasz w `CHROME_PATH`.
