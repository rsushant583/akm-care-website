import { Play, ExternalLink } from "lucide-react";
import { useState } from "react";

const fallbackVideos = [
  { id: "1", title: "AKM Care Session 1", videoId: "7ZMkdj_Zl7Q" },
  { id: "2", title: "AKM Care Session 2", videoId: "5dOz3VlOqSM" },
  { id: "3", title: "AKM Care Session 3", videoId: "I6rIeHUroZ8" },
  { id: "4", title: "AKM Care Session 4", videoId: "vmboyU5x-z8" },
];

export default function YouTubeCarousel() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section className="section-padding bg-warm-beige">
      <div className="container-premium">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl sm:text-4xl mb-3">
            Our Stories & Sessions
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Watch our latest training sessions, motivational content, and industry insights
          </p>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {fallbackVideos.map((video) => (
            <div
              key={video.id}
              className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start"
            >
              <div
                className="relative aspect-video rounded-2xl overflow-hidden bg-muted card-shadow cursor-pointer group"
                onClick={() => setActiveVideo(video.videoId)}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                  alt={video.title}
                  width={480}
                  height={270}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                    <Play size={22} className="text-primary-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
              <h3 className="font-medium text-sm mt-3">{video.title}</h3>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://www.youtube.com/@akmcare1309"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            View all on YouTube <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Video modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/80 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Video"
            />
          </div>
        </div>
      )}
    </section>
  );
}
