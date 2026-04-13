import { Play, ExternalLink, Facebook } from "lucide-react";
import { useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import {
  getChannelVideosForDisplay,
  YOUTUBE_CHANNEL_HANDLE_URL,
} from "@/data/youtubeChannelVideos";

const FB_PAGE = "https://www.facebook.com/share/1Jjs7ipP1x/";

const categories = ["All", "Training", "Motivation", "Industry", "Spirituality"] as const;

export default function Media() {
  const videos = useMemo(() => getChannelVideosForDisplay(), []);
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "All") return videos;
    return videos.filter((v) => v.category === filter);
  }, [videos, filter]);

  return (
    <>
      <SEO
        title="Videos & Media — Training Sessions & Motivation"
        description="Watch AKM Care's videos on our official YouTube channel @akmcare1309 — training, motivation, spirituality, and industry insights. Follow us on Facebook."
        keywords="AKM Care YouTube, AKM Care Facebook, @akmcare1309, industrial training videos, motivation videos India, HR training sessions"
        canonical="/media"
      />
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-warm-beige to-background pointer-events-none" />
        <div className="container-premium text-center max-w-3xl relative z-10">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary mb-4">Media</p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6 bg-gradient-to-br from-foreground to-foreground/75 bg-clip-text">
            Video Library
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Every clip below is from our official channel — authentic sessions and messages from Team AKM Care.
          </p>
        </div>
      </section>

      <section className="section-padding pt-8">
        <div className="container-premium">
          <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide -mx-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  filter === cat
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                    : "bg-card border border-border/70 text-muted-foreground hover:border-primary/25 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((video) => (
              <button
                key={video.id}
                type="button"
                className="text-left group rounded-2xl overflow-hidden border border-border/60 bg-card/80 backdrop-blur-sm shadow-md shadow-black/[0.04] transition-all duration-300 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                onClick={() => setActiveVideo(video.videoId)}
              >
                <div className="relative aspect-video bg-muted">
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                    alt={video.title}
                    width={480}
                    height={270}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 group-hover:scale-110 transition-transform">
                      <Play size={22} className="text-primary-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-black/50 text-white backdrop-blur-sm">
                    {video.category}
                  </span>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-heading text-base font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{video.dateLabel}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <a
              href={YOUTUBE_CHANNEL_HANDLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-all"
            >
              Open @akmcare1309 on YouTube <ExternalLink size={16} />
            </a>
            <a
              href={FB_PAGE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-accent/50 transition-all"
            >
              <Facebook size={20} className="shrink-0 text-primary" aria-hidden />
              AKM Care on Facebook <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden ring-2 ring-primary/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="AKM Care video"
            />
          </div>
        </div>
      )}
    </>
  );
}
