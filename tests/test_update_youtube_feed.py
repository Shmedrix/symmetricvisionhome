import json
from pathlib import Path
import sys
import tempfile
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "scripts"))

import update_youtube_feed as updater


SAMPLE_FEED = b"""<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <entry>
    <yt:videoId>abcdefghijk</yt:videoId>
    <yt:channelId>UCFfJzhPdy9E898xntaxKZRw</yt:channelId>
    <title> Older   upload </title>
    <published>2026-09-10T10:00:00+00:00</published>
  </entry>
  <entry>
    <yt:videoId>12345678901</yt:videoId>
    <yt:channelId>UCFfJzhPdy9E898xntaxKZRw</yt:channelId>
    <title>Newest upload</title>
    <published>2026-09-12T10:00:00Z</published>
  </entry>
</feed>
"""

SAMPLE_SHORTS_PAGE = (
    "<script>var ytInitialData = "
    + json.dumps(
        {
            "contents": [
                {
                    "shortsLockupViewModel": {
                        "onTap": {
                            "innertubeCommand": {
                                "reelWatchEndpoint": {"videoId": "12345678901"}
                            }
                        },
                        "overlayMetadata": {
                            "primaryText": {"content": " Newest   Short "}
                        },
                    }
                },
                {
                    "shortsLockupViewModel": {
                        "onTap": {
                            "innertubeCommand": {
                                "reelWatchEndpoint": {"videoId": "abcdefghijk"}
                            }
                        },
                        "overlayMetadata": {
                            "primaryText": {"content": "Older Short"}
                        },
                    }
                },
            ]
        }
    )
    + ";</script>"
).encode()


class YouTubeFeedTests(unittest.TestCase):
    def test_parse_feed_sorts_and_normalizes_entries(self):
        items = updater.parse_feed(SAMPLE_FEED, limit=2)

        self.assertEqual([item["videoId"] for item in items], ["12345678901", "abcdefghijk"])
        self.assertEqual(items[1]["title"], "Older upload")
        self.assertEqual(items[0]["publishedAt"], "2026-09-12T10:00:00Z")
        self.assertNotIn("warning", items[0])

    def test_parse_shorts_page_preserves_order_and_normalizes_entries(self):
        items = updater.parse_shorts_page(SAMPLE_SHORTS_PAGE, limit=2)

        self.assertEqual([item["videoId"] for item in items], ["12345678901", "abcdefghijk"])
        self.assertEqual(items[0]["title"], "Newest Short")
        self.assertEqual(items[0]["aspectRatio"], "9 / 16")
        self.assertNotIn("warning", items[0])

    def test_empty_feed_is_rejected(self):
        empty_feed = b'<feed xmlns="http://www.w3.org/2005/Atom" />'

        with self.assertRaisesRegex(ValueError, "did not contain any valid video entries"):
            updater.parse_feed(empty_feed)

    def test_update_catalog_preserves_curated_sections(self):
        latest = updater.build_latest_carousel(updater.parse_feed(SAMPLE_FEED, limit=1))
        shorts = updater.build_shorts_carousel(
            updater.parse_shorts_page(SAMPLE_SHORTS_PAGE, limit=1)
        )
        generated = {"latest": latest, "shorts": shorts}

        with tempfile.TemporaryDirectory() as temp_directory:
            catalog_path = Path(temp_directory) / "video-carousels.json"
            catalog_path.write_text(
                json.dumps({"featured": {"label": "Keep me", "items": []}}),
                encoding="utf-8",
            )

            self.assertTrue(updater.update_catalog(catalog_path, generated))
            updated = json.loads(catalog_path.read_text(encoding="utf-8"))
            self.assertEqual(updated["featured"]["label"], "Keep me")
            self.assertEqual(updated["latest"], latest)
            self.assertEqual(updated["shorts"], shorts)
            self.assertFalse(updater.update_catalog(catalog_path, generated))


if __name__ == "__main__":
    unittest.main()
