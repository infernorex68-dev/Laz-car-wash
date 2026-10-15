# Laz Gentle Touch Universe

Single-page site for Laz Gentle Touch Carwash, Chloorkop. A hand car wash told as a journey through a WebGL particle universe, with a built-in booking chat that hands off to WhatsApp.

## Structure

```
.
├── index.html        # Markup only
├── css/
│   └── style.css     # All styles
├── js/
│   └── main.js       # Three.js universe, interactions, booking chat
├── images/
│   └── wash-bay.webp # Bay photo (also sampled to build the particle hologram)
└── README.md
```

Third-party: Three.js r128 (CDN) and Google Fonts (Sora, Instrument Sans, JetBrains Mono).

## Run locally

Serve the folder over HTTP rather than opening `index.html` directly. The bay photo is read into a canvas to build the particle hologram, and browsers block that on `file://`.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing

- Business details (prices, hours, address, phone, packages) live in the `BUSINESS` object in `js/main.js`.
- Colours and fonts are CSS variables at the top of `css/style.css`.
- Page copy is in `index.html`.

## Deploy

Works on GitHub Pages as-is: Settings → Pages → deploy from the `main` branch root.
