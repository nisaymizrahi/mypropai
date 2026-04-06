import { useEffect } from "react";
import { trackPageView } from "../utils/analytics";
import { SITE_URL } from "../utils/env";

const upsertMetaTag = (attributeName, attributeValue, content) => {
  if (!content) {
    return;
  }

  let tag = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attributeName, attributeValue);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
};

const upsertCanonicalLink = (href) => {
  let tag = document.head.querySelector('link[rel="canonical"]');

  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }

  tag.setAttribute("href", href);
};

const buildAbsoluteUrl = (path) => new URL(path, SITE_URL).toString();

function Seo({ title, description, path = "/", section = "marketing" }) {
  useEffect(() => {
    const url = buildAbsoluteUrl(path);

    if (title) {
      document.title = title;
      upsertMetaTag("property", "og:title", title);
      upsertMetaTag("name", "twitter:title", title);
    }

    if (description) {
      upsertMetaTag("name", "description", description);
      upsertMetaTag("property", "og:description", description);
      upsertMetaTag("name", "twitter:description", description);
    }

    upsertMetaTag("property", "og:type", "website");
    upsertMetaTag("property", "og:url", url);
    upsertMetaTag("name", "twitter:card", "summary_large_image");
    upsertCanonicalLink(url);
    trackPageView({ path, title, section });
  }, [description, path, section, title]);

  return null;
}

export default Seo;
