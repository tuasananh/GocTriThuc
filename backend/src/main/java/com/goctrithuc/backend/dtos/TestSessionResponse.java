package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.TestSessionEntity;
import java.time.ZonedDateTime;

public record TestSessionResponse(
    Long id,
    Long testId,
    Long userId,
    ZonedDateTime startedAt,
    ZonedDateTime submittedAt,
    boolean isDone,
    long remainingTime) {
  public static TestSessionResponse from(TestSessionEntity entity, long remainingTime) {
    return new TestSessionResponse(
        entity.getId(),
        entity.getTest().getId(),
        entity.getUser().getId(),
        entity.getStartedAt(),
        entity.getSubmittedAt(),
        entity.isDone(),
        remainingTime);
  }
}
