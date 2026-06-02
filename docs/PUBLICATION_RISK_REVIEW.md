# Public GitHub Pages Risk Review

Checked on 2026-06-02 for publication as a public GitHub Pages site.

## Contact

- The site does not include a message-submission form.
- The About/Contact page uses outbound contact links only, so GitHub Pages does not collect visitor names, emails, messages, IPs, or form submissions.
- If a real form is added later, use a static-form provider endpoint or a serverless backend. Do not place API keys, access tokens, Instagram tokens, SMTP credentials, or private webhook secrets in HTML, JSON, or browser JavaScript.

## Media

- All committed files are publicly accessible if the repository or GitHub Pages site is public.
- `SiteBackgroundVideo.mp4`, `RGBDistortLogo.png`, `Symmetric Vision logo.png`, and `eyelogo.jpg` should be treated as public and downloadable.
- Do not commit private/raw client work, source project files, unreleased media, watermarked proofs, or account exports unless public redistribution is intended.

## External Services

- YouTube cards load public thumbnails from `i.ytimg.com`.
- YouTube hover previews use `youtube-nocookie.com` embeds and a sandboxed iframe.
- External links open in a new tab with `rel="noopener noreferrer"`.
- Instagram currently links out to the public profile and uses local approved preview media. No Instagram access token is committed.

## Data Files

- Carousel content is controlled by `data/video-carousels.json`.
- Browser-rendered titles, labels, and descriptions are inserted with `textContent`.
- Carousel URLs and media sources are sanitized in `scripts/video-carousel.js` before being assigned to links, images, videos, or iframes.

## Local Reference Artifacts

- Wix capture artifacts under `docs/reference/` are intentionally ignored by `.gitignore`.
- Only `docs/WIX_STYLE_REFERENCE.md` and this review document are meant to remain in the repo.

