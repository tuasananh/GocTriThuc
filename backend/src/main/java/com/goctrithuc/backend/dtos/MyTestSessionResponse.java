package com.goctrithuc.backend.dtos;

import java.time.ZonedDateTime;

public record MyTestSessionResponse(
    Long sessionId,
    Long testId,
    String testTitle,
    String courseTitle,
    Long courseId,
    double score,
    int correctCount,
    int totalQuestions,
    ZonedDateTime submittedAt) {}
