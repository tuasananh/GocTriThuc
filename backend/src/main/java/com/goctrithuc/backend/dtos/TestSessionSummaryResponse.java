package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.TestSessionEntity;
import java.time.ZonedDateTime;

public record TestSessionSummaryResponse(
    Long sessionId,
    Long userId,
    String displayName,
    ZonedDateTime startedAt,
    ZonedDateTime submittedAt,
    boolean isDone,
    Double score,
    Integer correctCount,
    Integer totalQuestions) {
  public static TestSessionSummaryResponse from(TestSessionEntity entity) {
    return new TestSessionSummaryResponse(
        entity.getId(),
        entity.getUser().getId(),
        entity.getUser().getDisplayName(),
        entity.getStartedAt(),
        entity.getSubmittedAt(),
        entity.isDone(),
        null,
        null,
        null);
  }

  public static TestSessionSummaryResponse from(
      TestSessionEntity entity, TestResultResponse result) {
    if (entity.isDone() && result != null) {
      return new TestSessionSummaryResponse(
          entity.getId(),
          entity.getUser().getId(),
          entity.getUser().getDisplayName(),
          entity.getStartedAt(),
          entity.getSubmittedAt(),
          entity.isDone(),
          result.score(),
          result.correctCount(),
          result.totalQuestions());
    } else {
      return from(entity);
    }
  }
}
