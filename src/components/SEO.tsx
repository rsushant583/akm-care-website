import { Helmet } from "react-helmet-async";
import { absoluteSiteUrl, getCanonicalSiteOrigin } from "@/lib/config/siteUrl";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  schema?: object | object[];
  /** When true, title is used as-is (e.g. admin-provided seo_title). */
  exactTitle?: boolean;
  /** Override default robots meta (e.g. "noindex, nofollow" for admin/404). */
  robots?: string;
}

const DEFAULT_IMAGE = `${getCanonicalSiteOrigin()}/og-image.jpg`;
const ORG_NAME = "AKM Care";

export function SEO({
  title,
  description,
  keywords,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  schema,
  exactTitle = false,
  robots = "index, follow, max-image-preview:large",
}: SEOProps) {
  const fullTitle = exactTitle ? title : `${title} | ${ORG_NAME}`;
  const canonicalUrl = canonical ? absoluteSiteUrl(canonical) : getCanonicalSiteOrigin();

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={ORG_NAME} />
      <meta name="robots" content={robots} />
      <meta name="theme-color" content="#F97316" />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={ORG_NAME} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {schema &&
        (Array.isArray(schema) ? schema : [schema]).map((entry, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(entry)}
          </script>
        ))}
    </Helmet>
  );
}
