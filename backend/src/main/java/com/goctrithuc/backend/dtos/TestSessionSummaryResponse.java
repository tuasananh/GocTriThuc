package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.TestSessionEntity;
import java.time.ZonedDateTime;

public record TestSessionSummaryResponse(
    Long sessionId,
    Long userId,
    String displayName,
    ZonedDateTime startedAt,
    ZonedDateTime submittedAt,
    boolean isDone) {
  public static TestSessionSummaryResponse from(TestSessionEntity entity) {
    return new TestSessionSummaryResponse(
        entity.getId(),
        entity.getUser().getId(),
        entity.getUser().getDisplayName(),
        entity.getStartedAt(),
        entity.getSubmittedAt(),
        entity.isDone());
  }
}
