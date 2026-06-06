package com.goctrithuc.backend.dtos;

import java.time.ZonedDateTime;
import java.util.List;

public record TestResultResponse(
    Long sessionId,
    Long testId,
    double score,
    int correctCount,
    int totalQuestions,
    ZonedDateTime startedAt,
    ZonedDateTime submittedAt,
    long timeTakenSeconds,
    List<QuestionResultItem> questions) {}
