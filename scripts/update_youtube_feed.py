#!/usr/bin/env python3
"""Refresh the generated latest-upload and Shorts carousels from YouTube."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET


CHANNEL_ID = "UCFfJzhPdy9E898xntaxKZRw"
CHANNEL_URL = "https://www.youtube.com/c/SymmetricVision"
FEED_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
SHORTS_URL = f"{CHANNEL_URL}/shorts"
DEFAULT_LIMIT = 12
MAX_FEED_BYTES = 2_000_000
MAX_PAGE_BYTES = 5_000_000
REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG_PATH = REPOSITORY_ROOT / "data" / "video-carousels.json"

ATOM = "http://www.w3.org/2005/Atom"
YOUTUBE = "http://www.youtube.com/xml/schemas/2015"
VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


def fetch_feed(feed_url: str = FEED_URL) -> bytes:
    request = Request(
        feed_url,
        headers={
            "Accept": "application/atom+xml, application/xml;q=0.9, */*;q=0.1",
            "User-Agent": "symmetricvisionhome-feed-updater/1.0",
        },
    )
    with urlopen(request, timeout=30) as response:
        payload = response.read(MAX_FEED_BYTES + 1)

    if len(payload) > MAX_FEED_BYTES:
        raise ValueError("YouTube feed exceeded the expected size limit")
    return payload


def fetch_shorts_page(shorts_url: str = SHORTS_URL) -> bytes:
    request = Request(
        shorts_url,
        headers={
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
            "Accept-Language": "en-US,en;q=0.9",
            "Cookie": "SOCS=CAI",
            "User-Agent": "Mozilla/5.0 symmetricvisionhome-feed-updater/1.0",
        },
    )
    with urlopen(request, timeout=30) as response:
        payload = response.read(MAX_PAGE_BYTES + 1)

    if len(payload) > MAX_PAGE_BYTES:
        raise ValueError("YouTube Shorts page exceeded the expected size limit")
    return payload


def parse_feed(feed_xml: bytes, limit: int = DEFAULT_LIMIT) -> list[dict[str, object]]:
    if limit < 1:
        raise ValueError("limit must be at least 1")

    root = ET.fromstring(feed_xml)
    parsed_items: list[tuple[datetime, dict[str, object]]] = []
    seen_video_ids: set[str] = set()

    for entry in root.findall(f"{{{ATOM}}}entry"):
        video_id = (entry.findtext(f"{{{YOUTUBE}}}videoId") or "").strip()
        entry_channel_id = (entry.findtext(f"{{{YOUTUBE}}}channelId") or "").strip()
        title = " ".join((entry.findtext(f"{{{ATOM}}}title") or "").split())
        published_text = (entry.findtext(f"{{{ATOM}}}published") or "").strip()

        if entry_channel_id and entry_channel_id != CHANNEL_ID:
            raise ValueError(f"Unexpected YouTube channel in feed: {entry_channel_id}")
        if not VIDEO_ID_PATTERN.fullmatch(video_id) or not title or not published_text:
            continue
        if video_id in seen_video_ids:
            continue

        published = datetime.fromisoformat(published_text.replace("Z", "+00:00"))
        if published.tzinfo is None:
            published = published.replace(tzinfo=timezone.utc)
        published_utc = published.astimezone(timezone.utc)

        seen_video_ids.add(video_id)
        parsed_items.append(
            (
                published_utc,
                {
                    "platform": "youtube",
                    "videoId": video_id,
                    "title": title,
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                    "publishedAt": published_utc.isoformat().replace("+00:00", "Z"),
                },
            )
        )

    parsed_items.sort(key=lambda item: item[0], reverse=True)
    items = [item for _, item in parsed_items[:limit]]
    if not items:
        raise ValueError("YouTube feed did not contain any valid video entries")
    return items


def find_values(value: object, key: str):
    if isinstance(value, dict):
        if key in value:
            yield value[key]
        for child in value.values():
            yield from find_values(child, key)
    elif isinstance(value, list):
        for child in value:
            yield from find_values(child, key)


def extract_initial_data(page_html: bytes) -> object:
    text = page_html.decode("utf-8")
    markers = (
        "var ytInitialData = ",
        'window["ytInitialData"] = ',
        "ytInitialData = ",
    )
    decoder = json.JSONDecoder()

    for marker in markers:
        marker_position = text.find(marker)
        if marker_position < 0:
            continue
        try:
            initial_data, _ = decoder.raw_decode(text[marker_position + len(marker) :])
        except json.JSONDecodeError:
            continue
        return initial_data

    raise ValueError("YouTube Shorts page did not contain readable initial data")


def parse_shorts_page(page_html: bytes, limit: int = DEFAULT_LIMIT) -> list[dict[str, object]]:
    if limit < 1:
        raise ValueError("limit must be at least 1")

    initial_data = extract_initial_data(page_html)
    items: list[dict[str, object]] = []
    seen_video_ids: set[str] = set()

    for lockup in find_values(initial_data, "shortsLockupViewModel"):
        if not isinstance(lockup, dict):
            continue

        command = lockup.get("onTap", {}).get("innertubeCommand", {})
        endpoint = command.get("reelWatchEndpoint", {})
        video_id = endpoint.get("videoId", "")
        title = (
            lockup.get("overlayMetadata", {})
            .get("primaryText", {})
            .get("content", "")
        )
        if not isinstance(video_id, str) or not VIDEO_ID_PATTERN.fullmatch(video_id):
            continue
        if not isinstance(title, str):
            continue
        title = " ".join(title.split())
        if not title or video_id in seen_video_ids:
            continue

        seen_video_ids.add(video_id)
        items.append(
            {
                "platform": "youtube",
                "platformLabel": "Short",
                "videoId": video_id,
                "title": title,
                "url": f"https://www.youtube.com/shorts/{video_id}",
                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/oar2.jpg",
                "aspectRatio": "9 / 16",
            }
        )
        if len(items) == limit:
            break

    if not items:
        raise ValueError("YouTube Shorts page did not contain any valid Shorts")
    return items


def build_latest_carousel(items: list[dict[str, object]]) -> dict[str, object]:
    return {
        "label": "Latest uploads from Symmetric Vision on YouTube",
        "managedBy": "scripts/update_youtube_feed.py",
        "channelId": CHANNEL_ID,
        "items": items,
    }


def build_shorts_carousel(items: list[dict[str, object]]) -> dict[str, object]:
    return {
        "label": "Latest Shorts from Symmetric Vision on YouTube",
        "managedBy": "scripts/update_youtube_feed.py",
        "channelId": CHANNEL_ID,
        "items": items,
    }


def update_catalog(catalog_path: Path, managed_carousels: dict[str, object]) -> bool:
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    if not isinstance(catalog, dict):
        raise ValueError("Carousel catalog must contain a JSON object")

    if all(catalog.get(key) == value for key, value in managed_carousels.items()):
        return False

    catalog.update(managed_carousels)
    serialized = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
    with catalog_path.open("w", encoding="utf-8", newline="\n") as catalog_file:
        catalog_file.write(serialized)
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--feed-url", default=FEED_URL)
    parser.add_argument("--shorts-url", default=SHORTS_URL)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG_PATH)
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    return parser.parse_args()


def main() -> int:
    options = parse_args()
    try:
        feed_xml = fetch_feed(options.feed_url)
        shorts_html = fetch_shorts_page(options.shorts_url)
        latest_items = parse_feed(feed_xml, options.limit)
        shorts_items = parse_shorts_page(shorts_html, options.limit)
        changed = update_catalog(
            options.catalog,
            {
                "latest": build_latest_carousel(latest_items),
                "shorts": build_shorts_carousel(shorts_items),
            },
        )
    except (OSError, ValueError, json.JSONDecodeError, ET.ParseError) as error:
        print(f"YouTube feed update failed: {error}", file=sys.stderr)
        return 1

    status = "updated" if changed else "already current"
    print(
        f"{options.catalog}: {status} "
        f"({len(latest_items)} latest uploads, {len(shorts_items)} Shorts)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
