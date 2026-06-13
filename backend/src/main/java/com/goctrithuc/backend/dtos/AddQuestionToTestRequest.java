package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record AddQuestionToTestRequest(
    @NotNull(message = "Question ID is required") Long questionId,
    @PositiveOrZero(message = "Order must be >= 0") Integer order,
    @PositiveOrZero(message = "Point must be >= 0") Double point) {}
