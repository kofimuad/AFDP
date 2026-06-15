"use client";

import { ExternalLink, FileText, Play, Video } from "lucide-react";
import { useState } from "react";

import type { RecipeLink } from "@/types";

/** Pull a YouTube video id out of the common URL shapes; null if it isn't one. */
function youtubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

interface RecipeLinksProps {
  links: RecipeLink[];
  dishName: string;
}

export function RecipeLinks({ links, dishName }: RecipeLinksProps) {
  // Prefer the flagged primary; fall back to the first embeddable YouTube link,
  // then to whatever exists — so a missing/odd primary still renders something.
  const primary =
    links.find((l) => l.is_primary) ??
    links.find((l) => l.source_type === "youtube" && youtubeId(l.url)) ??
    links[0] ??
    null;

  const others = links.filter((l) => l.id !== primary?.id);
  const primaryVideoId = primary && primary.source_type === "youtube" ? youtubeId(primary.url) : null;

  if (!primary) return null;

  return (
    <div className="space-y-4">
      {primaryVideoId ? (
        <YouTubeEmbed
          videoId={primaryVideoId}
          title={primary.title}
          thumbnail={primary.thumbnail_url}
        />
      ) : (
        // Broken/non-YouTube primary — link out instead of embedding a broken player.
        <ExternalRecipeCard link={primary} featured />
      )}

      <p className="text-xs text-[var(--color-text-muted)]">
        Recipe by an external creator. AFDP curates the link — we don&rsquo;t author the steps.
      </p>

      {others.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            More ways to make {dishName}
          </h3>
          <ul className="space-y-2">
            {others.map((link) => (
              <li key={link.id}>
                <ExternalRecipeCard link={link} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function YouTubeEmbed({
  videoId,
  title,
  thumbnail
}: {
  videoId: string;
  title: string;
  thumbnail: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const poster = thumbnail ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] bg-black shadow-[var(--shadow-md)]">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Play recipe video: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-black/30 transition group-hover:bg-black/20" aria-hidden="true" />
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_8px_24px_rgba(0,0,0,.4)] transition group-hover:scale-110">
              <Play size={28} className="ml-1" fill="currentColor" />
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent p-4 text-left text-sm font-semibold text-white">
            <Video size={16} className="shrink-0" />
            <span className="line-clamp-2">{title}</span>
          </span>
        </button>
      )}
    </div>
  );
}

function ExternalRecipeCard({ link, featured = false }: { link: RecipeLink; featured?: boolean }) {
  const isVideo = link.source_type === "youtube";
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        featured
          ? "flex items-center gap-3 rounded-[var(--radius-lg)] border-[1.5px] border-[var(--color-primary-light)] bg-[var(--color-primary-light)] p-4 transition hover:border-[var(--color-primary)]"
          : "flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)]"
      }
    >
      <span
        className={
          isVideo
            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white"
            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
        }
        aria-hidden="true"
      >
        {isVideo ? <Video size={18} /> : <FileText size={18} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">
          {link.title}
        </span>
        <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
          {isVideo ? "YouTube video" : "Recipe article"}
        </span>
      </span>
      <ExternalLink size={16} className="shrink-0 text-[var(--color-text-muted)]" />
    </a>
  );
}
