import { Play, ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import { CHANNEL_VIDEOS, YOUTUBE_CHANNEL_HANDLE_URL } from "@/data/youtubeChannelVideos";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

const preview = CHANNEL_VIDEOS.slice(0, 5);

export default function YouTubeCarousel() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rowRef.current) return;
    setDragging(true);
    dragState.current = { startX: e.pageX - rowRef.current.offsetLeft, scrollLeft: rowRef.current.scrollLeft };
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || !rowRef.current) return;
    const x = e.pageX - rowRef.current.offsetLeft;
    rowRef.current.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX);
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-premium relative z-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="mb-10 max-w-2xl">
          <p className="label-kicker text-primary mb-3">
            From our channel
          </p>
          <h2 className="text-[var(--size-h2)] mb-3">
            Stories & Sessions
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Training, motivation, and values — every video from{" "}
            <span className="text-foreground font-medium">@akmcare1309</span>
          </p>
        </motion.div>

        <div
          ref={rowRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          className={`flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-2 px-2 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          {preview.map((video) => (
            <motion.div key={video.id} className="flex-shrink-0 w-[280px] sm:w-[340px] snap-start">
              <button
                type="button"
                className="w-full text-left group"
                onClick={() => setActiveVideo(video.videoId)}
              >
                <div className="relative aspect-video rounded-[var(--radius-lg)] overflow-hidden bg-muted border border-black/5 shadow-[var(--shadow-card)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[var(--shadow-card-hover)]">
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                    alt={video.title}
                    width={480}
                    height={270}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <div className="w-[52px] h-[52px] rounded-full bg-white shadow-lg flex items-center justify-center scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all">
                      <span className="w-0 h-0 border-l-[20px] border-l-primary border-y-[12px] border-y-transparent ml-1" />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 scale-95 group-hover:opacity-0 transition-all">
                      <Play size={22} className="text-primary-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.08em] uppercase text-primary font-medium mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> AKM Care
                  </p>
                <h3 className="font-medium text-[15px] line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        <div className="text-right mt-2">
          <a
            href={YOUTUBE_CHANNEL_HANDLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all"
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
