package com.goctrithuc.backend.dtos;

import com.fasterxml.jackson.annotation.JsonValue;

public enum AccessStatus {
  ENROLLED("enrolled"),
  REQUESTED("requested"),
  NONE("none");

  private final String value;

  AccessStatus(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }
}
