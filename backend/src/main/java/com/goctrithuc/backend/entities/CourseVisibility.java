package com.goctrithuc.backend.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CourseVisibility {
  PUBLIC,
  RESTRICTED,
  PRIVATE;

  @JsonValue
  public String toJson() {
    return name().toLowerCase();
  }

  @JsonCreator
  public static CourseVisibility fromJson(String value) {
    return CourseVisibility.valueOf(value.toUpperCase());
  }
}
