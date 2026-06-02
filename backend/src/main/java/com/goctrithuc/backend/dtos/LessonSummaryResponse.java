package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.LessonType;

public record LessonSummaryResponse(
    Long id, String title, LessonType type, Integer order, Boolean completed) {
  public LessonSummaryResponse(Long id, String title, LessonType type, Integer order) {
    this(id, title, type, order, null);
  }
}
