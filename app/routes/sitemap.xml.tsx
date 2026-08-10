// app/routes/sitemap.xml.tsx

import { getDatabase } from "~/lib/cloudflare/cloudflareContext";
import { findBookableArtists } from "~/lib/artists/artistRepository.server";
import type { Route } from "./+types/sitemap.xml";

const SITE_URL = "https://tattoostation.lt";

const SUPPORTED_LOCALES = ["lt", "en"] as const;
type SitemapLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Every publicly indexable, statically-routed page, relative to the locale
 * prefix. Excludes /media/* and /portfolio-image/* (asset proxies, not
 * pages) and everything under /admin (auth-gated, not for search engines).
 */
const STATIC_PATHS = [
  "",
  "artists",
  "booking",
  "piercing",
  "aftercare",
  "aftercare/aftercarePiercing",
  "aftercare/aftercareTattoo",
  "flashdesigns",
  "tattoostyles",
  "faq",
  "coupon",
  "privacypolicy",
];

/**
 * Matches intlayer.config.ts's "prefix-no-default" routing: Lithuanian (the
 * default locale) is served unprefixed, English is served under /en.
 */
function localizedPath(locale: SitemapLocale, path: string): string {
  const prefix = locale === "en" ? "/en" : "";
  return path === "" ? `${prefix}/` : `${prefix}/${path}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * One <url> entry per path, with xhtml:link alternates pointing every
 * locale's version at its siblings so search engines can tell they're
 * translations of the same page rather than duplicate content.
 */
function buildUrlEntry(path: string): string {
  const alternates = SUPPORTED_LOCALES.map(
    (locale) =>
      `    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(SITE_URL + localizedPath(locale, path))}" />`,
  ).join("\n");

  const defaultHref = escapeXml(SITE_URL + localizedPath("lt", path));

  return SUPPORTED_LOCALES.map((locale) => {
    const loc = escapeXml(SITE_URL + localizedPath(locale, path));
    return `  <url>\n    <loc>${loc}</loc>\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultHref}" />\n  </url>`;
  }).join("\n");
}

export async function loader({ context }: Route.LoaderArgs) {
  const database = getDatabase(context);
  const bookableArtists = await findBookableArtists({ database });

  const artistPaths = bookableArtists.map(
    (artist) => `artists/${artist.slug}`,
  );

  const allPaths = [...STATIC_PATHS, ...artistPaths];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    allPaths.map(buildUrlEntry).join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
