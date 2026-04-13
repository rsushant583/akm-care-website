import { Play, ExternalLink } from "lucide-react";
import { useState } from "react";
import { CHANNEL_VIDEOS, YOUTUBE_CHANNEL_HANDLE_URL } from "@/data/youtubeChannelVideos";

const preview = CHANNEL_VIDEOS.slice(0, 5);

export default function YouTubeCarousel() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-warm-beige/80 to-background pointer-events-none" />
      <div className="container-premium relative z-10">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary mb-3">From our channel</p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-3">Stories & Sessions</h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Training, motivation, and values — every video from{" "}
            <span className="text-foreground font-medium">@akmcare1309</span>
          </p>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-2 px-2">
          {preview.map((video) => (
            <div key={video.id} className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start">
              <button
                type="button"
                className="w-full text-left group"
                onClick={() => setActiveVideo(video.videoId)}
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border border-border/60 shadow-lg shadow-primary/5 ring-1 ring-primary/5 transition-all duration-300 group-hover:ring-primary/20 group-hover:shadow-xl group-hover:-translate-y-1">
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                    alt={video.title}
                    width={480}
                    height={270}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-90 group-hover:via-black/20 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 scale-95 group-hover:scale-100 transition-transform">
                      <Play size={22} className="text-primary-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-sm mt-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href={YOUTUBE_CHANNEL_HANDLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
          >
            View all on YouTube <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden ring-2 ring-primary/20 shadow-2xl"
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
    </section>
  );
}
