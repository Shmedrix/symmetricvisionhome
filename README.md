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

- `latest` and `shorts` are generated from the Symmetric Vision YouTube channel
  by `scripts/update_youtube_feed.py`; do not edit those sections by hand.
- `featured`, `performances`, and `projects` remain manually curated.
- YouTube items use `platform: "youtube"` and `videoId`.
- Instagram or locally hosted preview items use `previewVideo` and/or `thumbnail`.
- Hover previews are muted and only start on pointer hover when the browser allows it.

All media committed to this repository will be publicly visible and downloadable from GitHub Pages.

## Automatic YouTube updates

`.github/workflows/update-youtube-feed.yml` checks the public YouTube channel
feed and Shorts page every six hours and can also be run manually from the
Actions tab. It commits `data/video-carousels.json` only when the latest twelve
uploads or Shorts change, then explicitly requests a GitHub Pages build for the
new commit.
GitHub may disable schedules on a public repository after sixty days without
repository activity; the workflow can be re-enabled and run from the Actions tab.

To refresh the generated carousels locally:

```powershell
python scripts/update_youtube_feed.py
python -m unittest discover -s tests -p "test_*.py"
```

Each generated carousel displays one general flashing-lights notice above its
cards. The updater does not modify the curated `featured`, `performances`, or
`projects` sections.
