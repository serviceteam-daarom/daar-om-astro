# daar-om.nl in Astro (snelheidsdemo)

Interne demo: de homepage en alle pagina's uit menu en footer van daar-om.nl, overgezet van WordPress/Divi naar Astro. Doel: laten zien hoeveel sneller dezelfde site is zonder Divi.

Live: https://serviceteam-daarom.github.io/daar-om-astro/

## Wat er anders is dan op WordPress

- Geen jQuery, geen Divi-JavaScript, geen Gravity Forms-, Complianz- of Jetpack-scripts.
- CSS per pagina opgeschoond: alleen regels die de pagina echt gebruikt blijven over (PurgeCSS), inline in de `<head>`.
- Eigen kleine scripts van de site (header, sliders, carrousels, zoeken) blijven werken; zoeken gebruikt een statische index (`public/search.json`).
- Divi-accordeons, animaties, tellers en responsive content werken zonder Divi-runtime.
- Afbeeldingen worden tijdens de build opgehaald van daar-om.nl (`scripts/fetch-assets.mjs`) en JPG/PNG opnieuw gecomprimeerd.

## Bewust niet meegenomen

- Formulieren versturen niets (melding in beeld). Google Maps laadt pas na een klik.
- Geen tracking (GTM, GA4, Clarity), zodat de demo de echte data niet vervuilt.
- `noindex` + canonical naar daar-om.nl, dus geen duplicate content.
- Blogs, cases en vacatures linken door naar de live site.

## Structuur

- `src/layouts/Base.astro`: gedeelde layout met header, footer en scripts.
- `src/pages/[...slug].astro`: genereert alle pagina's uit `src/site/pages/<slug>/`.
- `src/site/shared/`: header, footer en gedeelde scripts.

## Lokaal draaien

```bash
npm ci
npm run build   # haalt eerst de afbeeldingen op
npm run preview
```
