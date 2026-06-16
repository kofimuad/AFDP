# Hero slideshow images

The homepage hero ([components/home/HomeHero.tsx](../../components/home/HomeHero.tsx))
crossfades through the slides defined in its `HERO_SLIDES` array. Drop the image
files here with these exact names:

| File | Used for | Recommended size | Notes |
|------|----------|------------------|-------|
| `hero-1.jpg` | Desktop slide 1 | ~2400 × 1600 (landscape) | Couple cooking together |
| `hero-2.jpg` | Desktop slide 2 | ~2400 × 1600 (landscape) | Chef mixing batter |
| `hero-1-mobile.jpg` | Mobile slide 1 | ~1080 × 1600 (portrait) | Portrait crop of slide 1 |
| `hero-2-mobile.jpg` | Mobile slide 2 | ~1080 × 1600 (portrait) | Portrait crop of slide 2 |

**Optimize before committing:** export as JPEG, target **< 400 KB each**. The
source photos are ~6000 px wide (multi-MB) — way too big to ship as-is.

**Right now** `HERO_SLIDES[*].mobile` points at the landscape files (so mobile
center-crops them and isn't blank). Once you add the portrait crops above, change
each `mobile:` field in `HERO_SLIDES` to its `*-mobile.jpg` path.

To add or reorder slides, just edit the `HERO_SLIDES` array — the dots and
auto-advance adapt automatically.
