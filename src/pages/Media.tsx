import { Play, ExternalLink } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/SEO";

const categories = ["All", "Training", "Motivation", "Industry"];

const videos = [
  { id: "1", title: "Soft Skills Training Workshop", category: "Training", videoId: "dQw4w9WgXcQ", date: "2025-01-15" },
  { id: "2", title: "Daily Motivation — Start Your Day Right", category: "Motivation", videoId: "dQw4w9WgXcQ", date: "2025-01-14" },
  { id: "3", title: "Industrial Compliance Overview", category: "Industry", videoId: "dQw4w9WgXcQ", date: "2025-01-13" },
  { id: "4", title: "Leadership Development Session", category: "Training", videoId: "dQw4w9WgXcQ", date: "2025-01-12" },
  { id: "5", title: "Morning Inspiration Talk", category: "Motivation", videoId: "dQw4w9WgXcQ", date: "2025-01-11" },
  { id: "6", title: "HR Best Practices Seminar", category: "Industry", videoId: "dQw4w9WgXcQ", date: "2025-01-10" },
];

export default function Media() {
  const [filter, setFilter] = useState("All");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const filtered = filter === "All" ? videos : videos.filter((v) => v.category === filter);

  return (
    <>
      <SEO
        title="Videos & Media — Training Sessions & Motivation"
        description="Watch AKM Care's training videos, motivational sessions, and industry insights on our media page. Subscribe to our YouTube channel for regular updates."
        keywords="AKM Care YouTube, industrial training videos, motivation videos India, HR training sessions"
        canonical="/media"
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Media</h1>
          <p className="text-lg text-muted-foreground">Watch our training sessions, motivational content, and industry insights</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((video) => (
              <div key={video.id} className="bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover hover:-translate-y-1.5 transition-all duration-200 cursor-pointer" onClick={() => setActiveVideo(video.videoId)}>
                <div className="relative aspect-video bg-muted">
                  <img src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} width={480} height={270} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                      <Play size={22} className="text-primary-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">{video.date}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a href="https://www.youtube.com/@akmcare1309" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              View all on YouTube <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {activeVideo && (
        <div className="fixed inset-0 z-[100] bg-foreground/80 flex items-center justify-center p-4" onClick={() => setActiveVideo(null)}>
          <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <iframe src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Video" />
          </div>
        </div>
      )}
    </>
  );
}
