package com.goctrithuc.backend.common.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class StringUtil {

  private static final Pattern DIACRITICS_AND_FRIENDS =
      Pattern.compile("[\\p{InCombiningDiacriticalMarks}\\p{IsM}\\p{IsLm}\\p{IsSk}]+");

  /** Converts a string with accents (e.g., Vietnamese) to pure ASCII. */
  public static String stripAccents(String s) {
    if (s == null) {
      return null;
    }

    // Handle the special Vietnamese 'Đ' and 'đ' first, as Normalizer doesn't catch them
    String replaced = s.replace("Đ", "D").replace("đ", "d");

    // Normalize to Decomposed form (separates base characters from accents)
    String normalized = Normalizer.normalize(replaced, Normalizer.Form.NFD);

    // Remove the separated accent marks
    return DIACRITICS_AND_FRIENDS.matcher(normalized).replaceAll("");
  }

  /**
   * Generates a safe, ASCII-only username with a 4-digit random suffix. "Nguyễn Văn Hùng" ->
   * "nguyen_van_hung_4912"
   */
  public static String generateBaseSuffixUsername(String rawName) {
    if (rawName == null || rawName.trim().isEmpty()) {
      return "user_" + ((int) (Math.random() * 9000) + 1000);
    }

    String asciiName = stripAccents(rawName);

    String cleanBaseName =
        asciiName
            .toLowerCase()
            .replaceAll("\\s+", "_") // Spaces to underscores
            .replaceAll("[^a-z0-9_]", ""); // Strip anything that isn't a-z, 0-9, or _

    if (cleanBaseName.length() > 20) {
      cleanBaseName = cleanBaseName.substring(0, 20);
    }

    int randomSuffix = (int) (Math.random() * 9000) + 1000;

    return cleanBaseName + "_" + randomSuffix;
  }
}
