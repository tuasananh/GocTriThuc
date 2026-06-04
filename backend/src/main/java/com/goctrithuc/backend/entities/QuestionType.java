package com.goctrithuc.backend.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum QuestionType {
  MULTIPLE_CHOICE;

  @JsonValue
  public String toJson() {
    return name().toLowerCase();
  }

  @JsonCreator
  public static QuestionType fromJson(String value) {
    if (value == null) {
      return null;
    }
    // Convert multiple_choice to MULTIPLE_CHOICE
    return QuestionType.valueOf(value.toUpperCase().replace("-", "_"));
  }
}
