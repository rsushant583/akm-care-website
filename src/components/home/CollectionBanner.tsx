import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CollectionBanner({
  eyebrow,
  title,
  description,
  href,
  ctaLabel,
  imageSrc,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <section className="bg-[#FAF8F5]" aria-labelledby="collection-banner-heading">
      <div className="container-premium py-6 sm:py-8">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-0 overflow-hidden bg-[#F5F0EB]">
          <div className="p-5 sm:p-7 lg:p-8 flex flex-col justify-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-2">
              {eyebrow}
            </p>
            <h2 id="collection-banner-heading" className="type-section mb-2">
              {title}
            </h2>
            <p className="text-sm text-[#6B6B6B] max-w-md mb-5">{description}</p>
            <Link to={href} className="btn-primary self-start">
              {ctaLabel} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="relative min-h-[12rem] md:min-h-0 bg-[#EDE8E2]">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={imageAlt || ""}
                className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#EDE8E2] to-[#F5F0EB]" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
