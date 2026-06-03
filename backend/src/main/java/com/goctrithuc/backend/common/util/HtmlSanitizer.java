package com.goctrithuc.backend.common.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Cleaner;
import org.jsoup.safety.Safelist;

public final class HtmlSanitizer {

  private HtmlSanitizer() {}

  private static final Safelist CUSTOM_SAFELIST =
      Safelist.relaxed()
          // --- Standard BlockNote structural wrappers ---
          .addTags("span", "div", "section")

          // --- Global attribute allowlist ---
          // NOTE: "style" is permissive by design (trusted authors only). CSS url() exfiltration
          // is an accepted residual risk for this content platform.
          .addAttributes(":all", "class", "style", "id")

          // --- BlockNote data-* attributes ---
          // Covers block wrappers emitted by BlockNote's HTML serialiser across versions.
          .addAttributes(
              ":all",
              "data-content-type",
              "data-id",
              "data-level",
              "data-text-alignment",
              "data-node-type",
              "data-block-type")

          // --- MathLive <math-field> custom element ---
          // Required so that BlockNote's MathBlock and InlineMath toExternalHTML output is
          // preserved rather than silently stripped by the Jsoup cleaner.
          .addTags("math-field")
          .addAttributes("math-field", "read-only", "class", "style")

          // --- Link hardening ---
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
