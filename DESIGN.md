# Design Guide — Nusantara Journey

## Brand and visual direction

A calm, editorial travel brand: deep navy and warm paper establish trust, muted gold provides a travel-inspired accent, and large serif headlines add a magazine-like feel. Keep layouts spacious and photography-led. Avoid generic dashboard styling on the public site.

## Design tokens

The current shared palette is defined at the top of `styles.css`:

- Navy `#122b4e` and blue `#17385d`: hero, dark sections, primary buttons.
- Gold `#e4bd71`: accents, small markers, emphasized italic text.
- Paper `#fbfaf7`: page background.
- Ink `#1b2d43`: body copy; muted `#6d7b8b`; line `#e5e7e9`.
- Services surface `#f1f3f6`; cards and form fields use white.

Typography uses DM Sans for interface and body text and Playfair Display for display headings and selected editorial labels. These fonts are loaded from Google Fonts; keep local fallback fonts effective if the external request fails. Prefer the existing CSS custom properties and type scale over introducing one-off values.

## Public page composition

- Header: compact, horizontal brand/navigation bar; collapses for narrow screens.
- Hero: navy split layout with editorial copy on the left and a large destination photograph on the right. The image has dark overlays, destination labels, slide count, and previous/next controls. CTA links take visitors to packages or WhatsApp.
- Intro and package catalog: light surfaces with generous section padding. The catalog uses a three-column image-card grid on wide screens and responsive columns below that.
- Services (`#layanan`): pale gray section with a four-column ruled list on desktop. Each item needs consistent inner padding and complete outer edges, including the right border on the final column; reduce columns responsively without leaving orphaned/missing borders.
- Why-us and contact: navy background, white/light copy, restrained gold accents. Contact details sit in a thin outlined card.
- Testimonials, footer, detail page, and admin: reuse the shared palette, typography, border, and button styles while preserving their distinct information density.

## Interaction and accessibility

- Use square/softly rounded corners sparingly; borders and spacing define most components.
- Maintain visible focus states, semantic heading order, descriptive image alt text, keyboard-operable controls, and adequate contrast.
- Hero auto-advances every five seconds when motion is allowed. Pause while the pointer is over the hero and while keyboard focus is within it; restart on exit. Manual controls wrap around. Disable auto-motion when `prefers-reduced-motion: reduce` is active.
- Keep mobile navigation and grids usable at narrow widths; avoid horizontal overflow. Honor the existing light/dark theme controls and theme initialization.
- Keep motion short and subtle. Interactive elements should communicate hover, focus, disabled, loading, and error states.

## Editing guidance

`styles.css` currently contains many compressed rules. When editing, target existing component selectors, keep responsive overrides together with the existing breakpoints, and avoid broad selector changes that unintentionally affect the catalog, detail page, or admin. Add a new external asset origin only with a corresponding CSP review in `vercel.json`.
