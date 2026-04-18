#!/usr/bin/env python3
"""Bulk-upload food images to Cloudinary at the public_ids the catalog expects.

The catalog uses ``afdp/foods/<slug>`` as each food's Cloudinary public_id.
This script walks a local folder and uploads every image whose filename (minus
the extension) matches an AFDP food slug.

Usage (from apps/api):

    export CLOUDINARY_CLOUD_NAME=...
    export CLOUDINARY_API_KEY=...
    export CLOUDINARY_API_SECRET=...
    python -m scripts.upload_food_images --images-dir ~/food-images

Accepted filenames (case-insensitive): any image whose stem equals a known
food slug. For example ``jollof-rice.jpg`` or ``jollof-rice.webp``.

Skipped files are reported but don't fail the run. Re-running is safe —
``overwrite=True`` replaces the existing asset at the same public_id.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import cloudinary
import cloudinary.uploader
from slugify import slugify

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.sourcing.catalog import FOODS  # noqa: E402

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Upload AFDP food images to Cloudinary.")
    ap.add_argument("--images-dir", required=True, help="Local folder containing food images.")
    ap.add_argument(
        "--folder",
        default="afdp/foods",
        help="Cloudinary folder for public_ids. Default: afdp/foods.",
    )
    return ap.parse_args()


def _configure() -> None:
    cloud = os.environ.get("CLOUDINARY_CLOUD_NAME")
    key = os.environ.get("CLOUDINARY_API_KEY")
    secret = os.environ.get("CLOUDINARY_API_SECRET")
    if not (cloud and key and secret):
        raise SystemExit(
            "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, "
            "CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
        )
    cloudinary.config(cloud_name=cloud, api_key=key, api_secret=secret, secure=True)


def main() -> None:
    args = parse_args()
    images_dir = Path(args.images_dir).expanduser().resolve()
    if not images_dir.is_dir():
        raise SystemExit(f"Not a directory: {images_dir}")

    _configure()
    slugs = {slugify(f["name"]) for f in FOODS}

    uploaded = 0
    skipped: list[str] = []
    failed: list[tuple[str, str]] = []
    missing_slugs = set(slugs)

    for path in sorted(images_dir.iterdir()):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTS:
            continue
        stem = slugify(path.stem)
        if stem not in slugs:
            skipped.append(path.name)
            continue
        public_id = stem  # folder= handles the prefix; public_id is just the slug
        try:
            cloudinary.uploader.upload(
                str(path),
                folder=args.folder,
                public_id=public_id,
                overwrite=True,
                resource_type="image",
            )
            uploaded += 1
            missing_slugs.discard(stem)
            print(f"  ✓ {args.folder}/{public_id} ← {path.name}")
        except Exception as e:
            failed.append((path.name, str(e)))
            print(f"  ✗ {path.name}: {e}")

    print(
        f"\nUploaded {uploaded} | skipped (unrecognized name) {len(skipped)} | "
        f"failed {len(failed)} | still missing {len(missing_slugs)} food images"
    )
    if missing_slugs:
        print("\nFoods with no image yet:")
        for s in sorted(missing_slugs):
            print(f"  - {s}")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
