# Symmetric Vision Home

Static GitHub Pages site for Symmetric Vision.

## Live site

```text
https://symmetric-vision.xyz/
```

Fallback GitHub Pages URL:

```text
https://shmedrix.github.io/symmetricvisionhome/
```

GitHub Pages publishes from the `main` branch and repository root. The custom domain is configured by the root `CNAME` file.

## Maintenance guide

The owner-facing maintenance guide is available here:

- [PDF guide](docs/WEBSITE_MAINTENANCE_GUIDE.pdf)
- [LaTeX source](docs/WEBSITE_MAINTENANCE_GUIDE.tex)

It covers browser edits through GitHub, local preview, carousel data, media safety, contact form settings, DNS/domain notes, and a testing checklist.

## Local preview

```powershell
python -m http.server 8010 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8010/
```

## Media carousel data

The carousel content is in `data/video-carousels.json`.

- YouTube items use `platform: "youtube"` and `videoId`.
- Instagram or locally hosted preview items use `previewVideo` and/or `thumbnail`.
- Hover previews are muted and only start on pointer hover when the browser allows it.

All media committed to this repository will be publicly visible and downloadable from GitHub Pages.
