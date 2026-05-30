package com.goctrithuc.backend.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum LessonType {
  VIDEO,
  BLOG,
  TEST;

  @JsonValue
  public String toJson() {
    return name().toLowerCase();
  }

  @JsonCreator
  public static LessonType fromJson(String value) {
    return LessonType.valueOf(value.toUpperCase());
  }
}
