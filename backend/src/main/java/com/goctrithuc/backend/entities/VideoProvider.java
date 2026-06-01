package com.goctrithuc.backend.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum VideoProvider {
  YOUTUBE,
  VIMEO;

  @JsonValue
  public String toJson() {
    return name().toLowerCase();
  }

  @JsonCreator
  public static VideoProvider fromJson(String value) {
    return VideoProvider.valueOf(value.toUpperCase());
  }
}
