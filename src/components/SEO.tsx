import { Helmet } from "react-helmet-async";
import { BRAND } from "@/lib/config/brand";
import { absoluteSiteUrl } from "@/lib/config/siteUrl";
import { serializeJsonLd } from "@/lib/seo/jsonLd";

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  /** When true, no canonical link is emitted (404 / gone URLs). */
  omitCanonical?: boolean;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: string;
  schema?: object | object[];
  /** When true, title is used as-is (e.g. admin-provided seo_title). */
  exactTitle?: boolean;
  /** Override default robots meta (e.g. "noindex, nofollow" for admin/404). */
  robots?: string;
}

const DEFAULT_IMAGE = absoluteSiteUrl(BRAND.defaultShareImagePath);

export function SEO({
  title,
  description,
  keywords,
  canonical,
  omitCanonical = false,
  ogImage = DEFAULT_IMAGE,
  ogImageAlt,
  ogType = "website",
  schema,
  exactTitle = false,
  robots = "index, follow, max-image-preview:large",
}: SEOProps) {
  const fullTitle = exactTitle ? title : `${title} | ${BRAND.name}`;
  const canonicalUrl = omitCanonical || !canonical ? undefined : absoluteSiteUrl(canonical);
  const desc = description?.trim() || undefined;
  const imageAlt = ogImageAlt?.trim() || `${BRAND.name} — ${title}`;
  const gsc = String(import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || "").trim();
  const bing = String(import.meta.env.VITE_BING_SITE_VERIFICATION || "").trim();
  const schemaList = schema ? (Array.isArray(schema) ? schema : [schema]).filter(Boolean) : [];

  return (
    <Helmet>
      <html lang="en" />
      <title>{fullTitle}</title>
      {desc && <meta name="description" content={desc} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={BRAND.name} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="theme-color" content="#F97316" />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {gsc && <meta name="google-site-verification" content={gsc} />}
      {bing && <meta name="msvalidate.01" content={bing} />}

      <meta property="og:title" content={fullTitle} />
      {desc && <meta property="og:description" content={desc} />}
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={BRAND.name} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {desc && <meta name="twitter:description" content={desc} />}
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {schemaList.map((entry, i) => (
        <script key={i} type="application/ld+json">
          {serializeJsonLd(entry)}
        </script>
      ))}
    </Helmet>
  );
}
