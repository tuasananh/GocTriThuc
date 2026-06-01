package com.goctrithuc.backend.common.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Cleaner;
import org.jsoup.safety.Safelist;

public final class HtmlSanitizer {

  private HtmlSanitizer() {}
  private static final Safelist CUSTOM_SAFELIST =
      Safelist.relaxed()
          .addTags("span", "div", "section")
          .addAttributes(":all", "class", "style", "id")
          .addAttributes(
              ":all", "data-content-type", "data-id", "data-level", "data-text-alignment")
          .addEnforcedAttribute("a", "rel", "nofollow noopener noreferrer")
          .preserveRelativeLinks(true);
  public static String sanitize(String rawHtml) {
    if (rawHtml == null) {
      return null;
    }
    Document.OutputSettings outputSettings = new Document.OutputSettings().prettyPrint(false);
    Document dirty = Jsoup.parseBodyFragment(rawHtml, "");
    Cleaner cleaner = new Cleaner(CUSTOM_SAFELIST);
    Document clean = cleaner.clean(dirty);
    clean.outputSettings(outputSettings);
    return clean.body().html();
  }
}
