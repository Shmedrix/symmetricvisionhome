# Wix Style Reference

Captured from:

- `https://symmetricvision.wixsite.com/website`
- `https://symmetricvision.wixsite.com/website/about-contact`
- `https://symmetricvision.wixsite.com/website/links`

Local captures live in `docs/reference/wix-current/`.

## Target Impression

The existing site reads as a dark visionary-art and projection-mapping portfolio: black stage-like space, luminous psychedelic media, thin white typography, and wide horizontal media rows. The rebuild should preserve the cinematic black environment and high-contrast media focus, but not reproduce Wix's fixed-width overflow or runtime chrome.

## Keep

- Black background as the dominant page field.
- White/light-gray typography with minimal accent color.
- Large immersive hero using supplied Symmetric Vision media.
- Centered title treatment: `SYMMETRIC VISION` with spaced, clean uppercase lettering.
- Tagline: `Inducing Flashbacks since 2014`.
- Simple top navigation: Home, About/Contact, Links.
- Horizontal media rails for featured videos, projection mapping performances, and Instagram posts.
- Minimal rectangular controls: thin white borders, black/dark fill, no rounded card styling.
- Link hub as a centered vertical stack of outlined buttons.
- Footer language: `VFX, Video Production, Visionary Art, 3D animation, Projection mapping and much more`.

## Improve

- Remove Wix banner and Wix runtime artifacts.
- Do not copy Wix-generated markup, scripts, class names, or layout mechanics.
- Fix mobile responsiveness. The Wix About/Contact page currently overflows horizontally and crops the bio/form area.
- Make media grids keyboard-accessible and readable on mobile.
- Surface flashing-light / epilepsy warnings more deliberately for relevant videos.
- Replace the static Wix contact form with a working static-site-safe option: mailto CTA, Formspree/Getform/Basin, or another approved endpoint.
- Use structured data files for videos, links, and Instagram items instead of embedding content directly into page markup.

## Visual System

- Pattern: media portfolio with homepage sections, link hub, and about/contact page.
- Style family: dark cinematic visionary-art portfolio.
- Palette:
  - Background: `#000000`
  - Surface: `#111111` / `#181818`
  - Primary text: `#ffffff`
  - Secondary text: `#cfcfcf`
  - Muted text: `#8c8c8c`
  - Border: `#f4f0f0` at low visual weight
  - Accent: media-driven RGB/glitch color from artwork, not UI gradients
- Type direction:
  - Thin geometric/grotesque sans for headings and buttons.
  - Body text should stay readable at small sizes; avoid the over-condensed/cropped feel from the Wix mobile pages.
- Effect budget:
  - Subtle opacity changes for hover/focus.
  - Muted video hover preview for media cards where source permits.
  - No decorative glow layers, no gradient UI panels, no bouncy animations.

## Page Inventory

### Home

- Hero:
  - Background video/image with symmetric psychedelic line-art visuals.
  - Main title: `SYMMETRIC VISION`.
  - Subtitle: `Inducing Flashbacks since 2014`.
- Sections:
  - Featured videos.
  - How did I get here?
  - Projection mapping performances.
  - Latest Instagram posts.
- Primary interaction:
  - Browse video/image cards.
  - Open media details or external video links.

### About/Contact

- Content:
  - `Get in Touch`.
  - Contact form / contact CTA.
  - Bio text beginning with `"Inducing Flashback since 2014"`.
  - VICE Nederland article link.
  - Availability for Video Production, VFX, Visionary Art, and 3D/VR Production.
  - Consent statement against unrequested use, AI model training, and commercial reuse without permission.
  - Larger Projects carousel/section.
  - Support section.
- Required improvement:
  - Rebuild as a responsive two-column layout on desktop and a clean single column on mobile.

### Links

Current link labels:

- Facebook
- Instagram
- Twitter
- Youtube Channel
- Gumroad Store
- Patreon Page
- Symmetric Vision App
- Support, Paypal
- Discord server
- NFTs - Foundation
- NFTs - Rarible
- NFTs - Teia.art

Target:

- Keep this page simple and fast.
- Centered stack of outlined links.
- Strong keyboard focus states.
- No heavy media required.

## Reference Files

- `docs/reference/wix-current/home-desktop.png`
- `docs/reference/wix-current/home-mobile.png`
- `docs/reference/wix-current/about-contact-desktop.png`
- `docs/reference/wix-current/about-contact-mobile.png`
- `docs/reference/wix-current/links-desktop.png`
- `docs/reference/wix-current/links-mobile.png`

JSON text/media extraction files with the same basenames are also in `docs/reference/wix-current/`.
