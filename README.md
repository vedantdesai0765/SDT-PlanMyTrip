# PlanMyTrip

A front-end-only trip planner prototype built with plain HTML, CSS, and JavaScript. It has no backend, framework, package install, or build step. Trip data and preferences stay in this browser's local storage.

## Project structure

- `index.html` — app shell, navigation, dialogs, and page containers.
- `style.css` — design tokens, responsive layouts, and light/dark themes.
- `script.js` — destination demo data, app state, page rendering, and interactions.
- `photos/` — optimized local JPG destination images and their attribution records.

## Features

- Dashboard with trip summary, budget overview, alerts, destination discovery, favourites, and a photo carousel.
- Trip creation with date-range validation and a generated itinerary.
- Demo flight, hotel, and activity search with price filters and booking breakdowns.
- Booking confirmation with a reference code.
- Per-trip packing checklist with Beach, Mountain, and City presets.
- Destination detail dialog, favourites saved locally, dark mode, and first-run onboarding.
- Responsive sidebar and mobile navigation, keyboard-friendly controls, and reduced-motion support.
- Nine locally stored landscape destination photos. The carousel features Goa, Jaipur, Manali, Kerala, Dubai, and Singapore; the discovery cards feature Agra, Bali, and Kyoto.

This checkout includes nine sample destinations. Destination data is declared near the top of `script.js` in `DEST`. The six names in `HOME_QUOTES` appear on the landing carousel; other destinations appear in the discovery cards.

## Run it

Open `index.html` in a modern browser. For a local web server, run `python -m http.server 8000` from this folder, then open `http://localhost:8000`.

## Add a destination

Add an entry to the `DEST` object in `script.js` with the same fields as the existing entries:

```js
Example: {
  emoji: '🌅', country: 'Example country', tag: 'A short destination description', base: 5000, mins: 180,
  img: 'photos/example.jpg', imgCredit: 'Photographer · photo source · license',
  imgSource: 'https://example.com/photo-source',
  hotels: [['Example Hotel', 4, 6000, 'Old Town']],
  acts: [['Example walking tour', 'culture', 2, 900, 'A short activity description']]
}
```

The destination name becomes available automatically in trip forms and search filters. To show it in the carousel, add a quote under its name in `HOME_QUOTES`; destinations without a quote appear in the discovery cards. Add a landscape photo at least 1600 pixels wide, keep it under 400 KB, and record its author, source, and license in `imgCredit` and `imgSource`. Categories should match the keys in `CATS` (`adventure`, `culture`, `food`, `relaxation`, or `nature`).
