import { Play, ExternalLink } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CHANNEL_VIDEOS, YOUTUBE_CHANNEL_HANDLE_URL } from "@/data/youtubeChannelVideos";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";
import { runRevealWhenVisible } from "@/lib/runRevealWhenVisible";

const preview = CHANNEL_VIDEOS.slice(0, 5);

export default function YouTubeCarousel() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragMax, setDragMax] = useState(0);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const row = rowRef.current;
    const track = trackRef.current;
    if (!row || !track) return;

    const measure = () => {
      const max = Math.min(0, row.clientWidth - track.scrollWidth);
      setDragMax(max);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const row = rowRef.current;
    if (!section || !header || !row) return;

    const cta = section.querySelector<HTMLElement>("[data-yt-cta]");
    const cards = row.querySelectorAll("[data-yt-card]");

    if (prefersReducedMotion()) {
      gsap.set(
        [...header.querySelectorAll("[data-yt-reveal]"), ...cards, cta].filter(Boolean),
        { clearProps: "all", opacity: 1, y: 0, x: 0 },
      );
      return;
    }

    let ctx: gsap.Context | null = null;
    const disconnect = runRevealWhenVisible(section, () => {
      ctx?.revert();
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(
          header.querySelectorAll("[data-yt-reveal]"),
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, stagger: 0.06, duration: 0.65 },
        ).fromTo(
          cards,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.06 },
          "-=0.4",
        );
        if (cta) {
          tl.fromTo(cta, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3");
        }
      }, section);
    });

    return () => {
      disconnect();
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="section-padding section-shell min-h-0 bg-white">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5] via-white to-[#FAF8F5] pointer-events-none" />
      <div className="container-premium relative z-10">
        <div ref={headerRef} className="text-center mb-8 max-w-2xl mx-auto">
          <p data-yt-reveal className="text-xs font-semibold tracking-[0.22em] uppercase text-[#E8621A] mb-2">
            From our channel
          </p>
          <h2 data-yt-reveal className="font-heading text-3xl sm:text-4xl lg:text-[2.35rem] mb-3 text-[#1A1A1A]">
            Stories & Sessions
          </h2>
          <p data-yt-reveal className="text-[#6B6B6B] text-base sm:text-lg">
            Training, motivation, and values — every video from{" "}
            <span className="text-[#1A1A1A] font-medium">@akmcare1309</span>
          </p>
        </div>

        <div ref={rowRef} className="overflow-hidden -mx-2 px-2">
          <motion.div
            ref={trackRef}
            className="flex gap-4 sm:gap-5 w-max pb-2 cursor-grab active:cursor-grabbing"
            drag={reduceMotion ? false : "x"}
            dragConstraints={{ left: dragMax, right: 0 }}
            dragElastic={0.06}
            whileTap={reduceMotion ? undefined : { cursor: "grabbing" }}
          >
            {preview.map((video) => (
              <div key={video.id} data-yt-card className="flex-shrink-0 w-[260px] sm:w-[280px] snap-start">
                <button
                  type="button"
                  className="w-full text-left group"
                  onClick={() => setActiveVideo(video.videoId)}
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border border-black/[0.06] shadow-lg shadow-[#E8621A]/5 ring-1 ring-black/[0.04] transition-all duration-500 ease-in-out group-hover:ring-[#E8621A]/25 group-hover:-translate-y-1 group-hover:shadow-xl">
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                      alt={video.title}
                      width={480}
                      height={270}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-90 group-hover:via-black/15 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-[#E8621A] flex items-center justify-center shadow-lg shadow-[#E8621A]/35 scale-95 group-hover:scale-100 transition-transform">
                        <Play size={22} className="text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-medium text-sm mt-3 line-clamp-2 leading-snug group-hover:text-[#E8621A] transition-colors text-[#1A1A1A]">
                    {video.title}
                  </h3>
                </button>
              </div>
            ))}
          </motion.div>
        </div>

        <div data-yt-cta className="text-center mt-8">
          <a
            href={YOUTUBE_CHANNEL_HANDLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#E8621A]/25 bg-[#E8621A]/5 px-6 py-3 text-sm font-semibold text-[#E8621A] hover:bg-[#E8621A]/10 transition-all"
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
            className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden ring-2 ring-[#E8621A]/25 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=0&controls=0&fs=0&disablekb=1&modestbranding=1&rel=0`}
              className="w-full h-full"
              style={{ pointerEvents: "none" }}
              allow="encrypted-media"
              title="AKM Care video"
            />
          </div>
        </div>
      )}
    </section>
  );
}
