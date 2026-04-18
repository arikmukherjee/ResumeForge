# ResumeForge 📄

A premium, fully responsive Resume Builder web app built with pure HTML, CSS, and Vanilla JavaScript. Fill in your details and watch your resume come to life in real time — then export it as a polished PDF.

![ResumeForge](https://img.shields.io/badge/version-1.0.0-6C63FF?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-10B981?style=flat-square) ![No frameworks](https://img.shields.io/badge/vanilla-JS-F59E0B?style=flat-square)

---

## ✨ Features

### Core
- **Live Preview** — Resume updates in real time as you type (debounced at 80ms)
- **3 Resume Templates** — Modern, Minimal, and Creative designs
- **PDF Export** — High-quality A4 PDF via `html2pdf.js` at 2× resolution
- **LocalStorage Persistence** — Your data is saved automatically and survives page refresh
- **Profile Photo Upload** — Supports JPG/PNG up to 5MB

### Sections
- Personal details (name, title, email, phone, location, website, LinkedIn)
- Professional summary
- Work experience (dynamic, add/remove entries)
- Education (dynamic, add/remove entries)
- Skills (comma-separated with live tag preview)
- Languages
- Projects (dynamic, add/remove entries)

### UI / UX
- **6 Accent Colors** — Violet, Sky, Emerald, Amber, Rose, Pink
- **Light / Dark Mode** toggle
- **Zoom Controls** — Scale the preview from 50% to 150%
- Collapsible form sections with smooth animations
- Bullet-point auto-formatting in descriptions (`•` or `-` lines render as proper list items in the PDF)
- Toast notifications for user actions
- Mobile-responsive with a bottom tab bar (Edit / Preview / Export)

---

## 🗂 Project Structure

```
resume-builder/
├── index.html   — App shell, layout, and all HTML markup
├── style.css    — All styling: variables, components, templates, responsive rules
├── script.js    — App state, event handling, DOM rendering, PDF export
└── README.md
```

No build step. No dependencies to install. No frameworks.

---

## 🚀 Getting Started

1. Download or clone the three files (`index.html`, `style.css`, `script.js`) into the same folder.
2. Open `index.html` in any modern browser.
3. Start filling in your details — the preview updates instantly on the right.

> An internet connection is required on first load for Google Fonts and the `html2pdf.js` CDN library.

---

## 🎨 Templates

| Template | Style | Layout |
|----------|-------|--------|
| **Modern** | Colored accent header, sidebar skills | Two-column body |
| **Minimal** | Black & white, typographic, monospace dates | Full-width single column |
| **Creative** | Split dark/accent header, left sidebar | Two-column with prominent sidebar |

Switch templates instantly using the header buttons — the accent color applies across all three.

---

## 🖨 Exporting to PDF

Click **Export PDF** in the header (or the Export tab on mobile). The app temporarily resets the zoom to 100%, renders the preview at 2× scale for sharpness, and downloads an A4 PDF named `YourName_Resume.pdf`.

For best results:
- Use Chrome or Edge
- Keep descriptions concise to avoid content overflowing a single page
- Avoid very large profile photos to keep file size manageable

---

## 💾 Data Persistence

All form data is saved to `localStorage` automatically (500ms debounce after each change). Your profile photo is stored separately as a base64 string. To clear everything and start fresh, click the trash icon in the form panel header and confirm.

---

## 🛠 Technical Notes

- **No frameworks** — pure HTML5, CSS3 (Custom Properties, Flexbox, Grid), and ES6+ JavaScript
- **Modular rendering** — each template has its own render function (`renderModern`, `renderMinimal`, `renderCreative`)
- **XSS-safe** — all user input is passed through `escHtml()` before being injected into the DOM
- **Bullet formatting** — the `formatDesc()` helper converts lines starting with `•` or `-` into proper `<ul>/<li>` HTML in the rendered resume
- **Accent color system** — changing the accent updates CSS custom properties directly; a `darkenColor()` utility derives the hover shade and drop shadow from the chosen hex value
- **CDN dependencies** (loaded via `<script>` / `<link>` tags, no npm required):
  - [Google Fonts](https://fonts.google.com/) — DM Serif Display, Outfit, JetBrains Mono
  - [html2pdf.js v0.10.1](https://github.com/eKoopmans/html2pdf.js) — PDF generation

---

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Mobile Chrome/Safari | ✅ Responsive layout |

---

## 📄 License

MIT — free to use, modify, and distribute.
