# Symmetric Vision Home

Static GitHub Pages site for Symmetric Vision.

The current Pages target is the default project URL:

```text
https://shmedrix.github.io/symmetricvisionhome/
```

Current remote state checked on 2026-06-01: the repository is private and GitHub Pages is not enabled. A repo admin needs to open GitHub repository settings and enable Pages from `main` / root. If GitHub does not allow Pages publishing from this private repository on the current plan, make the repository public or use a plan that supports private Pages.

The custom domain `symmetricvision.xyz` is intentionally not configured yet. When domain access is ready, add the GitHub Pages custom domain in repository settings and create the required DNS records in Wix.

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
