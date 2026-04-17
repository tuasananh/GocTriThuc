package com.goctrithuc.backend.common.util;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.regex.Pattern;

public class StringUtil {

  private static final Pattern DIACRITICS_AND_FRIENDS =
      Pattern.compile("[\\p{InCombiningDiacriticalMarks}\\p{IsM}\\p{IsLm}\\p{IsSk}]+");

  private static final String BASE62_CHARS =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  private static final SecureRandom RANDOM = new SecureRandom();

  private static final String[] PLAYFUL_ADJECTIVES = {
    "swift", "happy", "brave", "clever", "mighty", "bright", "cool", "epic",
    "silent", "sneaky", "bold", "wild", "calm", "gentle", "fierce", "lucky",
    "proud", "wise", "quick", "agile", "funny", "jolly", "kind", "loyal"
  };
  private static final String[] PLAYFUL_ANIMALS = {
    "turtle", "fox", "panda", "tiger", "lion", "bear", "wolf", "hawk",
    "eagle", "shark", "whale", "dolphin", "penguin", "koala", "rabbit", "deer",
    "frog", "owl", "bat", "cheetah", "puma", "falcon", "raven", "otter"
  };

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
   * Generates a safe, ASCII-only username with a base62 random suffix with random length from 3 to
   * 7.
   *
   * <p>If the name is null, generate a playful default username like 'swift_turtle_3fG7'.
   *
   * <p>Examples:
   *
   * <p>- "Nguyễn Văn Hùng" ->"nguyen_van_hung_4a1Z"
   */
  public static String generateBaseSuffixUsername(String rawName) {
    var randomLength = RANDOM.nextInt(3, 8); // 3 to 7 inclusive

    if (rawName == null || rawName.trim().isEmpty()) {
      String adj = PLAYFUL_ADJECTIVES[RANDOM.nextInt(PLAYFUL_ADJECTIVES.length)];
      String animal = PLAYFUL_ANIMALS[RANDOM.nextInt(PLAYFUL_ANIMALS.length)];
      return adj + "_" + animal + "_" + generateBase62Suffix(randomLength);
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

    return cleanBaseName + "_" + generateBase62Suffix(randomLength);
  }

  private static String generateBase62Suffix(int length) {
    StringBuilder sb = new StringBuilder(length);
    for (int i = 0; i < length; i++) {
      sb.append(BASE62_CHARS.charAt(RANDOM.nextInt(62)));
    }
    return sb.toString();
  }
}
